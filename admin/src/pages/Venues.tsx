import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";
import { isValidImageUrl } from "../utils/validateImageUrl";

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
  image_urls: string[] | null;
  logo_url: string | null;
  tags: string[] | null;
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

interface VenueStory {
  id: string;
  venue_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  order: number;
  created_at: string;
}

const CATEGORIES = ["restaurant", "bar", "cafe", "experience"];

interface VenuePin {
  pin: string;
  venue_name: string;
  updated_at: string;
}

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
  image_url_2: "",
  image_url_3: "",
  logo_url: "",
  tags: "",
  latitude: "",
  longitude: "",
};

export default function Venues() {
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stories, setStories] = useState<VenueStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string; onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });
  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false }));
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState(EMPTY_VENUE);
  const [saving, setSaving] = useState(false);
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "deals" | "stories" | "pin">>({});

  // PIN management
  const [venuePins, setVenuePins] = useState<Record<string, VenuePin | null>>({});
  const [pinVisible, setPinVisible] = useState<Record<string, boolean>>({});
  const [pinSaving, setPinSaving] = useState<string | null>(null);

  // Deal form
  const [showDealForm, setShowDealForm] = useState<string | null>(null);
  const [dealForm, setDealForm] = useState({ title: "", description: "", terms: "" });

  // Story form
  const [showStoryForm, setShowStoryForm] = useState<string | null>(null);
  const [storyForm, setStoryForm] = useState({
    media_url: "",
    media_type: "image" as "image" | "video",
    caption: "",
    order: 0,
  });

  useEffect(() => {
    let venuesReady = false, dealsReady = false, storiesReady = false, pinsReady = false;
    const checkDone = () => { if (venuesReady && dealsReady && storiesReady && pinsReady) setLoading(false); };

    const u1 = onSnapshot(
      collection(db, "venues"),
      (snap) => {
        setVenues(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Venue).sort((a, b) => a.name.localeCompare(b.name)));
        venuesReady = true; checkDone();
      },
      (err) => { console.error("venues snapshot error:", err); venuesReady = true; checkDone(); }
    );
    const u2 = onSnapshot(
      collection(db, "deals"),
      (snap) => {
        setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deal));
        dealsReady = true; checkDone();
      },
      (err) => { console.error("deals snapshot error:", err); dealsReady = true; checkDone(); }
    );
    const u3 = onSnapshot(
      collection(db, "venue_stories"),
      (snap) => {
        setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VenueStory).sort((a, b) => a.order - b.order));
        storiesReady = true; checkDone();
      },
      (err) => { console.error("venue_stories snapshot error:", err); storiesReady = true; checkDone(); }
    );
    const u4 = onSnapshot(
      collection(db, "venue_pins"),
      (snap) => {
        const pins: Record<string, VenuePin | null> = {};
        snap.docs.forEach((d) => { pins[d.id] = d.data() as VenuePin; });
        setVenuePins(pins);
        pinsReady = true; checkDone();
      },
      (err) => { console.error("venue_pins snapshot error:", err); pinsReady = true; checkDone(); }
    );
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const buildImageUrls = (f: typeof form): string[] => {
    return [f.image_url, f.image_url_2, f.image_url_3]
      .map((u) => u.trim())
      .filter(Boolean);
  };

  const handleSaveVenue = async () => {
    if (!form.name.trim() || !form.address.trim()) return;
    setSaving(true);

    try {
      const imageUrls = buildImageUrls(form);
      const tagList = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const data: Record<string, any> = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        city: form.city.trim(),
        country: form.country.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || null,
        menu_url: form.menu_url.trim() || null,
        image_url: imageUrls[0] ?? null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        logo_url: form.logo_url.trim() || null,
        tags: tagList.length > 0 ? tagList : null,
        latitude: form.latitude.trim() ? parseFloat(form.latitude) : 0,
        longitude: form.longitude.trim() ? parseFloat(form.longitude) : 0,
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
      toast(editingVenue ? "Venue updated" : "Venue created");
    } catch (e) {
      console.error("Failed to save venue:", e);
      toast("Failed to save venue", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (venue: Venue) => {
    try {
      await updateDoc(doc(db, "venues", venue.id), { is_active: !venue.is_active });
      toast(venue.is_active ? "Venue disabled" : "Venue enabled");
    } catch {
      toast("Failed to update", "error");
    }
  };

  const handleDeleteVenue = (venue: Venue) => {
    setConfirmState({
      open: true,
      title: "Delete venue",
      message: `Delete "${venue.name}" and all its deals and stories? This cannot be undone.`,
      onConfirm: async () => {
        closeConfirm();
        try {
          const venueDealIds = deals.filter((d) => d.venue_id === venue.id);
          for (const deal of venueDealIds) await deleteDoc(doc(db, "deals", deal.id));
          const venueStories = stories.filter((s) => s.venue_id === venue.id);
          for (const story of venueStories) await deleteDoc(doc(db, "venue_stories", story.id));
          await deleteDoc(doc(db, "venues", venue.id));
          toast("Venue deleted");
        } catch {
          toast("Failed to delete venue", "error");
        }
      },
    });
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
      toast("Deal added");
    } catch (e) {
      console.error("Failed to add deal:", e);
      toast("Failed to add deal", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeal = (dealId: string) => {
    setConfirmState({
      open: true,
      title: "Delete deal",
      message: "Remove this deal? This cannot be undone.",
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteDoc(doc(db, "deals", dealId));
          toast("Deal removed");
        } catch {
          toast("Failed to remove deal", "error");
        }
      },
    });
  };

  const handleAddStory = async (venueId: string) => {
    if (!storyForm.media_url.trim()) return;
    setSaving(true);
    try {
      const venueStories = stories.filter((s) => s.venue_id === venueId);
      const nextOrder = venueStories.length > 0
        ? Math.max(...venueStories.map((s) => s.order)) + 1
        : 0;
      await addDoc(collection(db, "venue_stories"), {
        venue_id: venueId,
        media_url: storyForm.media_url.trim(),
        media_type: storyForm.media_type,
        caption: storyForm.caption.trim() || null,
        order: storyForm.order || nextOrder,
        created_at: new Date().toISOString(),
      });
      setShowStoryForm(null);
      setStoryForm({ media_url: "", media_type: "image", caption: "", order: 0 });
      toast("Story added");
    } catch (e) {
      console.error("Failed to add story:", e);
      toast("Failed to add story", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStory = (storyId: string) => {
    setConfirmState({
      open: true,
      title: "Delete story",
      message: "Remove this story?",
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteDoc(doc(db, "venue_stories", storyId));
          toast("Story removed");
        } catch {
          toast("Failed to remove story", "error");
        }
      },
    });
  };

  const openEdit = (venue: Venue) => {
    const urls = venue.image_urls ?? (venue.image_url ? [venue.image_url] : []);
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
      image_url: urls[0] ?? venue.image_url ?? "",
      image_url_2: urls[1] ?? "",
      image_url_3: urls[2] ?? "",
      logo_url: venue.logo_url ?? "",
      tags: (venue.tags ?? []).join(", "),
      latitude: (venue as any).latitude ? String((venue as any).latitude) : "",
      longitude: (venue as any).longitude ? String((venue as any).longitude) : "",
    });
    setShowForm(true);
  };

  const handleGeneratePin = async (venue: Venue) => {
    setPinSaving(venue.id);
    try {
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(doc(db, "venue_pins", venue.id), {
        pin: newPin,
        venue_name: venue.name,
        updated_at: new Date().toISOString(),
      });
      toast("New PIN generated");
    } catch {
      toast("Failed to generate PIN", "error");
    } finally {
      setPinSaving(null);
    }
  };

  const getTab = (venueId: string) => activeTab[venueId] ?? "deals";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-dark rounded-lg animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <>
    <ConfirmModal
      open={confirmState.open}
      title={confirmState.title}
      message={confirmState.message}
      confirmLabel="Delete"
      danger
      onConfirm={confirmState.onConfirm}
      onCancel={closeConfirm}
    />
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Venues</h1>
          <p className="text-gray-500 text-sm mt-1">
            {venues.length} partner venue{venues.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setEditingVenue(null); setForm(EMPTY_VENUE); setShowForm(true); }}
          className="px-5 py-2.5 bg-gold text-black font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors"
        >
          + Add Venue
        </button>
      </div>

      {/* ── Venue form modal ── */}
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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows={3}
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 resize-none"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
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

              {/* Lat / Long */}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Coordinates (latitude, longitude)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="Latitude e.g. -17.8292"
                    className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="Longitude e.g. 31.0522"
                    className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              {/* Cuisine / vibe tags */}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Tags (comma-separated)
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. Middle Eastern, Halal, Vegetarian"
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>

              {/* Logo */}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Logo / Avatar URL
                </label>
                <input
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://… (shown as avatar; tap opens stories)"
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>

              {/* Carousel images */}
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  Carousel Images (up to 3)
                </label>
                <div className="space-y-2">
                  <div>
                    <input
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="Image 1 URL (primary, https://…)"
                      className={`w-full bg-black border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 ${form.image_url && !isValidImageUrl(form.image_url) ? "border-red-500/50" : "border-dark-border"}`}
                    />
                    {form.image_url && !isValidImageUrl(form.image_url) && (
                      <p className="text-red-400 text-xs mt-1">Must be a valid https:// image URL</p>
                    )}
                  </div>
                  <input
                    value={form.image_url_2}
                    onChange={(e) => setForm({ ...form, image_url_2: e.target.value })}
                    placeholder="Image 2 URL (optional)"
                    className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                  <input
                    value={form.image_url_3}
                    onChange={(e) => setForm({ ...form, image_url_3: e.target.value })}
                    placeholder="Image 3 URL (optional)"
                    className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setEditingVenue(null); }}
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

      {/* ── Venue list ── */}
      <div className="space-y-3">
        {venues.map((venue) => {
          const venueDeals = deals.filter((d) => d.venue_id === venue.id);
          const venueStories = stories.filter((s) => s.venue_id === venue.id);
          const isExpanded = expandedVenue === venue.id;
          const tab = getTab(venue.id);
          const previewImage =
            (venue.image_urls && venue.image_urls[0]) ?? venue.image_url ?? null;

          return (
            <div
              key={venue.id}
              className={`bg-dark border rounded-2xl overflow-hidden ${
                venue.is_active ? "border-dark-border" : "border-red-500/20 opacity-60"
              }`}
            >
              <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3">
                {/* Logo / thumbnail */}
                <div className="flex gap-2 flex-shrink-0">
                  {venue.logo_url && (
                    <img
                      src={venue.logo_url}
                      alt="logo"
                      className="w-10 h-10 rounded-full object-cover border border-gold/30"
                    />
                  )}
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt={venue.name}
                      className="w-full md:w-16 h-32 md:h-16 rounded-xl object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{venue.name}</span>
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
                  {/* Tags */}
                  {venue.tags && venue.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {venue.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-gray-600 text-xs mt-0.5">
                    {venueDeals.length} deal{venueDeals.length !== 1 ? "s" : ""} ·{" "}
                    {venueStories.length} stor{venueStories.length !== 1 ? "ies" : "y"} ·{" "}
                    {(venue.image_urls?.length ?? (venue.image_url ? 1 : 0))} image{(venue.image_urls?.length ?? (venue.image_url ? 1 : 0)) !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={() => setExpandedVenue(isExpanded ? null : venue.id)}
                    className="px-3 py-2 text-gray-400 hover:text-white text-xs border border-dark-border rounded-xl transition-colors"
                  >
                    {isExpanded ? "Hide" : "Manage"}
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

              {/* ── Expanded: Deals / Stories tabs ── */}
              {isExpanded && (
                <div className="border-t border-dark-border bg-black/30">
                  {/* Tab strip */}
                  <div className="flex border-b border-dark-border">
                    {(["deals", "stories", "pin"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab((prev) => ({ ...prev, [venue.id]: t }))}
                        className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                          tab === t
                            ? "text-gold border-b-2 border-gold"
                            : "text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {t === "deals" ? `Deals (${venueDeals.length})` : t === "stories" ? `Stories (${venueStories.length})` : "PIN"}
                      </button>
                    ))}
                  </div>

                  <div className="px-4 md:px-5 py-4">
                    {/* ── Deals tab ── */}
                    {tab === "deals" && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white text-sm font-semibold">Deals & Benefits</span>
                          <button
                            onClick={() => { setShowDealForm(venue.id); setDealForm({ title: "", description: "", terms: "" }); }}
                            className="text-gold text-xs font-bold hover:underline"
                          >
                            + Add Deal
                          </button>
                        </div>

                        {showDealForm === venue.id && (
                          <div className="bg-dark border border-dark-border rounded-xl p-4 mb-3 space-y-2">
                            <input
                              value={dealForm.title}
                              onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                              placeholder="Deal title"
                              className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                            />
                            <input
                              value={dealForm.description}
                              onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                              placeholder="Description (optional)"
                              className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                            />
                            <input
                              value={dealForm.terms}
                              onChange={(e) => setDealForm({ ...dealForm, terms: e.target.value })}
                              placeholder="Terms (optional)"
                              className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => setShowDealForm(null)} className="px-3 py-1.5 text-gray-400 text-xs border border-dark-border rounded-lg">Cancel</button>
                              <button onClick={() => handleAddDeal(venue.id)} disabled={saving} className="px-3 py-1.5 bg-gold text-black text-xs font-bold rounded-lg disabled:opacity-50">
                                {saving ? "..." : "Add Deal"}
                              </button>
                            </div>
                          </div>
                        )}

                        {venueDeals.length === 0 ? (
                          <p className="text-gray-600 text-xs">No deals yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {venueDeals.map((deal) => (
                              <div key={deal.id} className="flex items-start justify-between bg-dark border border-dark-border rounded-xl px-4 py-3">
                                <div>
                                  <p className="text-white text-sm font-medium">{deal.title}</p>
                                  {deal.description && <p className="text-gray-500 text-xs mt-0.5">{deal.description}</p>}
                                  {deal.terms && <p className="text-gray-600 text-xs italic mt-0.5">{deal.terms}</p>}
                                </div>
                                <button onClick={() => handleDeleteDeal(deal.id)} className="text-red-400/50 hover:text-red-400 text-xs ml-4 flex-shrink-0">Remove</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── PIN tab ── */}
                    {tab === "pin" && (() => {
                      const pinData = venuePins[venue.id];
                      const isVisible = pinVisible[venue.id] ?? false;
                      const isSaving = pinSaving === venue.id;
                      return (
                        <div className="space-y-4">
                          <div>
                            <p className="text-white text-sm font-semibold mb-1">Staff Verification PIN</p>
                            <p className="text-gray-500 text-xs">
                              Staff enter this 6-digit PIN on the verify page after scanning a member's QR code.
                              Share it with venue staff privately — do not post it publicly.
                            </p>
                          </div>

                          {pinData ? (
                            <div className="bg-black border border-dark-border rounded-xl px-4 py-3 flex items-center justify-between">
                              <div>
                                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Current PIN</p>
                                <p className="text-white font-mono text-xl tracking-[0.3em] font-bold">
                                  {isVisible ? pinData.pin : "••••••"}
                                </p>
                                <p className="text-gray-600 text-[10px] mt-1">
                                  Last updated {new Date(pinData.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => setPinVisible((p) => ({ ...p, [venue.id]: !isVisible }))}
                                className="text-gold text-xs hover:underline ml-4 flex-shrink-0"
                              >
                                {isVisible ? "Hide" : "Reveal"}
                              </button>
                            </div>
                          ) : (
                            <div className="bg-black border border-dark-border rounded-xl px-4 py-3">
                              <p className="text-gray-600 text-sm">No PIN set yet.</p>
                            </div>
                          )}

                          <button
                            onClick={() => handleGeneratePin(venue)}
                            disabled={isSaving}
                            className="px-4 py-2 bg-gold text-black text-xs font-bold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50"
                          >
                            {isSaving ? "Generating…" : pinData ? "Regenerate PIN" : "Generate PIN"}
                          </button>

                          {pinData && (
                            <div className="bg-dark border border-dark-border rounded-xl px-4 py-3">
                              <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">How it works</p>
                              <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                                <li>Member opens a deal in the app and taps to generate their QR code</li>
                                <li>Staff scan the QR with their phone camera — it opens the verify page automatically</li>
                                <li>Staff enter this PIN to confirm the redemption</li>
                                <li>The page shows the member's name, tier, and deal confirmed</li>
                              </ol>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── Stories tab ── */}
                    {tab === "stories" && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white text-sm font-semibold">Stories</span>
                          <button
                            onClick={() => { setShowStoryForm(venue.id); setStoryForm({ media_url: "", media_type: "image", caption: "", order: venueStories.length }); }}
                            className="text-gold text-xs font-bold hover:underline"
                          >
                            + Add Story
                          </button>
                        </div>

                        {showStoryForm === venue.id && (
                          <div className="bg-dark border border-dark-border rounded-xl p-4 mb-3 space-y-2">
                            <input
                              value={storyForm.media_url}
                              onChange={(e) => setStoryForm({ ...storyForm, media_url: e.target.value })}
                              placeholder="Image URL (https://…)"
                              className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                            />
                            <select
                              value={storyForm.media_type}
                              onChange={(e) => setStoryForm({ ...storyForm, media_type: e.target.value as "image" | "video" })}
                              className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                            >
                              <option value="image">Image</option>
                              <option value="video">Video (requires expo-av in app)</option>
                            </select>
                            <input
                              value={storyForm.caption}
                              onChange={(e) => setStoryForm({ ...storyForm, caption: e.target.value })}
                              placeholder="Caption (optional)"
                              className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                            />
                            <div className="flex items-center gap-2">
                              <label className="text-gray-500 text-xs">Order:</label>
                              <input
                                type="number"
                                value={storyForm.order}
                                onChange={(e) => setStoryForm({ ...storyForm, order: Number(e.target.value) })}
                                className="w-20 bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setShowStoryForm(null)} className="px-3 py-1.5 text-gray-400 text-xs border border-dark-border rounded-lg">Cancel</button>
                              <button onClick={() => handleAddStory(venue.id)} disabled={saving} className="px-3 py-1.5 bg-gold text-black text-xs font-bold rounded-lg disabled:opacity-50">
                                {saving ? "..." : "Add Story"}
                              </button>
                            </div>
                          </div>
                        )}

                        {venueStories.length === 0 ? (
                          <p className="text-gray-600 text-xs">No stories yet. Add image URLs above.</p>
                        ) : (
                          <div className="space-y-2">
                            {venueStories.map((story) => (
                              <div key={story.id} className="flex items-center gap-3 bg-dark border border-dark-border rounded-xl px-4 py-3">
                                <img
                                  src={story.media_url}
                                  alt=""
                                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-400 text-xs">
                                    #{story.order} · <span className="text-gold">{story.media_type}</span>
                                  </p>
                                  {story.caption && <p className="text-white text-xs mt-0.5 truncate">{story.caption}</p>}
                                </div>
                                <button onClick={() => handleDeleteStory(story.id)} className="text-red-400/50 hover:text-red-400 text-xs flex-shrink-0">Remove</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
