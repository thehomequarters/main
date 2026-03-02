import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

interface Venue {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  country: string;
  address: string;
  phone: string | null;
  menu_url: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface Deal {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  terms: string | null;
  is_active: boolean;
}

const CATEGORIES = ["restaurant", "bar", "cafe", "experience"];

const EMPTY_VENUE = {
  name: "",
  description: "",
  category: "restaurant",
  city: "Harare",
  country: "Zimbabwe",
  address: "",
  phone: "",
  menu_url: "",
  image_url: "",
};

export default function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState(EMPTY_VENUE);
  const [saving, setSaving] = useState(false);
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);

  // Deal form
  const [showDealForm, setShowDealForm] = useState<string | null>(null);
  const [dealForm, setDealForm] = useState({ title: "", description: "", terms: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [venuesSnap, dealsSnap] = await Promise.all([
        getDocs(collection(db, "venues")),
        getDocs(collection(db, "deals")),
      ]);
      setVenues(
        venuesSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Venue)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setDeals(dealsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deal));
    } catch (e) {
      console.error("Failed to load venues:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVenue = async () => {
    if (!form.name.trim() || !form.address.trim()) return;
    setSaving(true);

    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        city: form.city.trim(),
        country: form.country.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || null,
        menu_url: form.menu_url.trim() || null,
        image_url: form.image_url.trim() || null,
        latitude: 0,
        longitude: 0,
        is_active: true,
      };

      if (editingVenue) {
        await updateDoc(doc(db, "venues", editingVenue.id), data);
      } else {
        await addDoc(collection(db, "venues"), {
          ...data,
          created_at: new Date().toISOString(),
        });
      }

      setShowForm(false);
      setEditingVenue(null);
      setForm(EMPTY_VENUE);
      await fetchData();
    } catch (e) {
      console.error("Failed to save venue:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (venue: Venue) => {
    await updateDoc(doc(db, "venues", venue.id), {
      is_active: !venue.is_active,
    });
    setVenues((prev) =>
      prev.map((v) =>
        v.id === venue.id ? { ...v, is_active: !v.is_active } : v
      )
    );
  };

  const handleDeleteVenue = async (venue: Venue) => {
    if (!confirm(`Delete "${venue.name}" and all its deals? This cannot be undone.`))
      return;

    // Delete all deals for this venue
    const venueDealIds = deals.filter((d) => d.venue_id === venue.id);
    for (const deal of venueDealIds) {
      await deleteDoc(doc(db, "deals", deal.id));
    }
    await deleteDoc(doc(db, "venues", venue.id));
    await fetchData();
  };

  const handleAddDeal = async (venueId: string) => {
    if (!dealForm.title.trim()) return;
    setSaving(true);

    try {
      await addDoc(collection(db, "deals"), {
        venue_id: venueId,
        title: dealForm.title.trim(),
        description: dealForm.description.trim() || null,
        terms: dealForm.terms.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      setShowDealForm(null);
      setDealForm({ title: "", description: "", terms: "" });
      await fetchData();
    } catch (e) {
      console.error("Failed to add deal:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Delete this deal?")) return;
    await deleteDoc(doc(db, "deals", dealId));
    await fetchData();
  };

  const openEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setForm({
      name: venue.name,
      description: venue.description,
      category: venue.category,
      city: venue.city,
      country: venue.country,
      address: venue.address,
      phone: venue.phone ?? "",
      menu_url: venue.menu_url ?? "",
      image_url: venue.image_url ?? "",
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-dark rounded-lg animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-24"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Venues</h1>
          <p className="text-gray-500 text-sm mt-1">
            {venues.length} partner venue{venues.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVenue(null);
            setForm(EMPTY_VENUE);
            setShowForm(true);
          }}
          className="px-5 py-2.5 bg-gold text-black font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors"
        >
          + Add Venue
        </button>
      </div>

      {/* Venue form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-dark border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-white text-lg font-bold mb-4">
              {editingVenue ? "Edit Venue" : "New Venue"}
            </h2>

            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Venue name"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              />
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description"
                rows={3}
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 resize-none"
              />
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
              <input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                placeholder="Address"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
                <input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="Country"
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone (optional)"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              />
              <input
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
                placeholder="Image URL (optional)"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingVenue(null);
                }}
                className="flex-1 px-4 py-3 border border-dark-border text-gray-400 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVenue}
                disabled={saving || !form.name.trim()}
                className="flex-1 px-4 py-3 bg-gold text-black rounded-xl text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editingVenue ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Venue list */}
      <div className="space-y-3">
        {venues.map((venue) => {
          const venuDeals = deals.filter((d) => d.venue_id === venue.id);
          const isExpanded = expandedVenue === venue.id;

          return (
            <div
              key={venue.id}
              className={`bg-dark border rounded-2xl overflow-hidden ${
                venue.is_active ? "border-dark-border" : "border-red-500/20 opacity-60"
              }`}
            >
              <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3">
                {/* Image thumbnail */}
                {venue.image_url && (
                  <img
                    src={venue.image_url}
                    alt={venue.name}
                    className="w-full md:w-16 h-32 md:h-16 rounded-xl object-cover flex-shrink-0"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">
                      {venue.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gold-light text-gold">
                      {venue.category}
                    </span>
                    {!venue.is_active && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/15 text-red-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {venue.address} · {venue.city}
                  </div>
                  <div className="text-gray-600 text-xs mt-0.5">
                    {venuDeals.length} deal{venuDeals.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      setExpandedVenue(isExpanded ? null : venue.id)
                    }
                    className="px-3 py-2 text-gray-400 hover:text-white text-xs border border-dark-border rounded-xl transition-colors"
                  >
                    {isExpanded ? "Hide Deals" : "Deals"}
                  </button>
                  <button
                    onClick={() => openEdit(venue)}
                    className="px-3 py-2 text-gold text-xs border border-gold/25 rounded-xl hover:bg-gold-light transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(venue)}
                    className="px-3 py-2 text-gray-400 hover:text-white text-xs border border-dark-border rounded-xl transition-colors"
                  >
                    {venue.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => handleDeleteVenue(venue)}
                    className="px-3 py-2 text-red-400 text-xs border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded deals section */}
              {isExpanded && (
                <div className="border-t border-dark-border px-4 md:px-5 py-4 bg-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-sm font-semibold">
                      Deals & Benefits
                    </span>
                    <button
                      onClick={() => {
                        setShowDealForm(venue.id);
                        setDealForm({ title: "", description: "", terms: "" });
                      }}
                      className="text-gold text-xs font-bold hover:underline"
                    >
                      + Add Deal
                    </button>
                  </div>

                  {showDealForm === venue.id && (
                    <div className="bg-dark border border-dark-border rounded-xl p-4 mb-3 space-y-2">
                      <input
                        value={dealForm.title}
                        onChange={(e) =>
                          setDealForm({ ...dealForm, title: e.target.value })
                        }
                        placeholder="Deal title"
                        className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                      />
                      <input
                        value={dealForm.description}
                        onChange={(e) =>
                          setDealForm({
                            ...dealForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Description (optional)"
                        className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                      />
                      <input
                        value={dealForm.terms}
                        onChange={(e) =>
                          setDealForm({ ...dealForm, terms: e.target.value })
                        }
                        placeholder="Terms (optional)"
                        className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDealForm(null)}
                          className="px-3 py-1.5 text-gray-400 text-xs border border-dark-border rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddDeal(venue.id)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-gold text-black text-xs font-bold rounded-lg disabled:opacity-50"
                        >
                          {saving ? "..." : "Add Deal"}
                        </button>
                      </div>
                    </div>
                  )}

                  {venuDeals.length === 0 ? (
                    <p className="text-gray-600 text-xs">
                      No deals yet. Add one above.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {venuDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="flex items-start justify-between bg-dark border border-dark-border rounded-xl px-4 py-3"
                        >
                          <div>
                            <p className="text-white text-sm font-medium">
                              {deal.title}
                            </p>
                            {deal.description && (
                              <p className="text-gray-500 text-xs mt-0.5">
                                {deal.description}
                              </p>
                            )}
                            {deal.terms && (
                              <p className="text-gray-600 text-xs italic mt-0.5">
                                {deal.terms}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-red-400/50 hover:text-red-400 text-xs ml-4 flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
