import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

interface HQEvent {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  time: string;
  end_time: string;
  image_url: string;
  category: string;
  capacity: number;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = ["social", "dining", "wellness", "music", "arts"];

const EMPTY_EVENT = {
  title: "",
  description: "",
  venue: "",
  date: "",
  time: "18:00",
  end_time: "21:00",
  image_url: "",
  link_url: "",
  category: "social",
  capacity: 50,
};

export default function Events() {
  const [events, setEvents] = useState<HQEvent[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HQEvent | null>(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsSnap, bookingsSnap] = await Promise.all([
        getDocs(collection(db, "events")),
        getDocs(collection(db, "bookings")),
      ]);

      setEvents(
        eventsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as HQEvent)
          .sort((a, b) => a.date.localeCompare(b.date))
      );

      const counts: Record<string, number> = {};
      bookingsSnap.docs.forEach((d) => {
        const eid = d.data().event_id;
        counts[eid] = (counts[eid] || 0) + 1;
      });
      setBookingCounts(counts);
    } catch (e) {
      console.error("Failed to load events:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!form.title.trim() || !form.date || !form.venue.trim()) return;
    setSaving(true);

    try {
      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        venue: form.venue.trim(),
        date: form.date,
        time: form.time,
        end_time: form.end_time,
        image_url: form.image_url.trim(),
        link_url: form.link_url.trim() || null,
        category: form.category,
        capacity: Number(form.capacity) || 50,
        is_active: true,
      };

      if (editingEvent) {
        await updateDoc(doc(db, "events", editingEvent.id), data);
      } else {
        await addDoc(collection(db, "events"), {
          ...data,
          created_at: new Date().toISOString(),
        });
      }

      setShowForm(false);
      setEditingEvent(null);
      setForm(EMPTY_EVENT);
      await fetchData();
    } catch (e) {
      console.error("Failed to save event:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (event: HQEvent) => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    await deleteDoc(doc(db, "events", event.id));
    await fetchData();
  };

  const handleToggleActive = async (event: HQEvent) => {
    await updateDoc(doc(db, "events", event.id), {
      is_active: !event.is_active,
    });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, is_active: !e.is_active } : e
      )
    );
  };

  const openEdit = (event: HQEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description,
      venue: event.venue,
      date: event.date,
      time: event.time,
      end_time: event.end_time,
      image_url: event.image_url,
      link_url: event.link_url ?? "",
      category: event.category,
      capacity: event.capacity,
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Events</h1>
          <p className="text-gray-500 text-sm mt-1">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setForm(EMPTY_EVENT);
            setShowForm(true);
          }}
          className="px-5 py-2.5 bg-gold text-black font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors"
        >
          + Add Event
        </button>
      </div>

      {/* Event form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-dark border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-white text-lg font-bold mb-4">
              {editingEvent ? "Edit Event" : "New Event"}
            </h2>

            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Event title"
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
              <input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="Venue name"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
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
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: Number(e.target.value) })
                  }
                  placeholder="Capacity"
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
                <input
                  value={form.image_url}
                  onChange={(e) =>
                    setForm({ ...form, image_url: e.target.value })
                  }
                  placeholder="Image URL"
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <input
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="Event page / ticketing URL (optional)"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
                className="flex-1 px-4 py-3 border border-dark-border text-gray-400 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={saving || !form.title.trim()}
                className="flex-1 px-4 py-3 bg-gold text-black rounded-xl text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : editingEvent ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="space-y-3">
        {events.map((event) => {
          const booked = bookingCounts[event.id] || 0;
          const d = new Date(event.date);
          const day = d.getDate();
          const month = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();

          return (
            <div
              key={event.id}
              className={`bg-dark border rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 ${
                event.is_active ? "border-dark-border" : "border-red-500/20 opacity-60"
              }`}
            >
              {/* Date badge */}
              <div className="w-14 h-16 rounded-xl bg-gold-light border border-gold/20 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-gold text-lg font-extrabold leading-none">
                  {day}
                </span>
                <span className="text-gold text-[10px] font-semibold tracking-widest">
                  {month}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">
                    {event.title}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-400/10 text-purple-400">
                    {event.category}
                  </span>
                </div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {event.venue} · {event.time}–{event.end_time}
                </div>
                <div className="text-gray-600 text-xs mt-0.5">
                  {booked}/{event.capacity} booked
                  {booked >= event.capacity && (
                    <span className="text-amber-400 ml-1">FULL</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(event)}
                  className="px-3 py-2 text-gold text-xs border border-gold/25 rounded-xl hover:bg-gold-light transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(event)}
                  className="px-3 py-2 text-gray-400 hover:text-white text-xs border border-dark-border rounded-xl transition-colors"
                >
                  {event.is_active ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => handleDeleteEvent(event)}
                  className="px-3 py-2 text-red-400 text-xs border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
