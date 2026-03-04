import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";
import { isValidImageUrl } from "../utils/validateImageUrl";

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

interface Booking {
  id: string;
  event_id: string;
  user_id: string;
  member_name?: string;
  member_code?: string;
  created_at?: string;
}

interface ProfileStub {
  id: string;
  first_name: string;
  last_name: string;
  member_code: string;
  email: string;
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
  const { toast } = useToast();
  const [events, setEvents] = useState<HQEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileStub>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HQEvent | null>(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [saving, setSaving] = useState(false);
  const [attendeeEvent, setAttendeeEvent] = useState<HQEvent | null>(null);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false }));

  useEffect(() => {
    let eventsReady = false, bookingsReady = false;
    const checkDone = () => {
      if (eventsReady && bookingsReady) setLoading(false);
    };

    const u1 = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as HQEvent)
          .sort((a, b) => a.date.localeCompare(b.date))
      );
      eventsReady = true;
      checkDone();
    });

    const u2 = onSnapshot(collection(db, "bookings"), (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking));
      bookingsReady = true;
      checkDone();
    });

    // Load profiles once for attendee name resolution
    getDocs(collection(db, "profiles")).then((snap) => {
      const map: Record<string, ProfileStub> = {};
      snap.docs.forEach((d) => {
        map[d.id] = { id: d.id, ...d.data() } as ProfileStub;
      });
      setProfiles(map);
    });

    return () => { u1(); u2(); };
  }, []);

  const bookingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      counts[b.event_id] = (counts[b.event_id] || 0) + 1;
    });
    return counts;
  }, [bookings]);

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
        toast("Event updated");
      } else {
        await addDoc(collection(db, "events"), { ...data, created_at: new Date().toISOString() });
        toast("Event created");
      }
      setShowForm(false);
      setEditingEvent(null);
      setForm(EMPTY_EVENT);
    } catch (e) {
      console.error("Failed to save event:", e);
      toast("Failed to save event", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = (event: HQEvent) => {
    setConfirmState({
      open: true,
      title: "Delete event",
      message: `Delete "${event.title}"? This cannot be undone.`,
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteDoc(doc(db, "events", event.id));
          toast("Event deleted");
        } catch {
          toast("Failed to delete", "error");
        }
      },
    });
  };

  const handleToggleActive = async (event: HQEvent) => {
    try {
      await updateDoc(doc(db, "events", event.id), { is_active: !event.is_active });
      toast(event.is_active ? "Event disabled" : "Event enabled");
    } catch {
      toast("Failed to update", "error");
    }
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

  const openAttendees = async (event: HQEvent) => {
    setAttendeeEvent(event);
  };

  const eventAttendees = useMemo(() => {
    if (!attendeeEvent) return [];
    return bookings
      .filter((b) => b.event_id === attendeeEvent.id)
      .map((b) => {
        const p = profiles[b.user_id];
        return {
          ...b,
          resolvedName: p ? `${p.first_name} ${p.last_name}` : b.member_name ?? b.user_id,
          resolvedCode: p?.member_code ?? b.member_code ?? "",
          resolvedEmail: p?.email ?? "",
        };
      });
  }, [attendeeEvent, bookings, profiles]);

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

      {/* Attendees modal */}
      {attendeeEvent && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-dark border border-dark-border rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-dark-border">
              <div>
                <h2 className="text-white font-bold text-base">{attendeeEvent.title}</h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  {eventAttendees.length} / {attendeeEvent.capacity} attendees
                </p>
              </div>
              <button onClick={() => setAttendeeEvent(null)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {eventAttendees.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No bookings yet.</p>
              ) : (
                <div className="space-y-2">
                  {eventAttendees.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-dark-border last:border-0">
                      <span className="text-gray-600 text-xs w-5 text-right">{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-gold-light border border-gold/25 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold text-xs font-bold">
                          {a.resolvedName.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{a.resolvedName}</p>
                        <p className="text-gray-500 text-xs truncate">
                          {a.resolvedCode && <span className="font-mono">{a.resolvedCode}</span>}
                          {a.resolvedEmail && <span> · {a.resolvedEmail}</span>}
                        </p>
                      </div>
                      {a.created_at && (
                        <span className="text-gray-600 text-xs flex-shrink-0">
                          {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Events</h1>
            <p className="text-gray-500 text-sm mt-1">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setEditingEvent(null); setForm(EMPTY_EVENT); setShowForm(true); }}
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
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 resize-none" />
                <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Venue name" className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-3">
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} placeholder="Capacity" className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
                  <div>
                  <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Image URL (https://…)" className={`w-full bg-black border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 ${form.image_url && !isValidImageUrl(form.image_url) ? "border-red-500/50" : "border-dark-border"}`} />
                  {form.image_url && !isValidImageUrl(form.image_url) && (
                    <p className="text-red-400 text-xs mt-1">Must be a valid https:// image URL</p>
                  )}
                </div>
                </div>
                <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="Ticketing URL (optional)" className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowForm(false); setEditingEvent(null); }} className="flex-1 px-4 py-3 border border-dark-border text-gray-400 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveEvent} disabled={saving || !form.title.trim()} className="flex-1 px-4 py-3 bg-gold text-black rounded-xl text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : editingEvent ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events list */}
        <div className="space-y-3">
          {events.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500">No events yet. Create your first event above.</p>
            </div>
          )}
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
                  <span className="text-gold text-lg font-extrabold leading-none">{day}</span>
                  <span className="text-gold text-[10px] font-semibold tracking-widest">{month}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{event.title}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-400/10 text-purple-400">
                      {event.category}
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {event.venue} · {event.time}–{event.end_time}
                  </div>
                  <div className="text-gray-600 text-xs mt-0.5">
                    {booked}/{event.capacity} booked
                    {booked >= event.capacity && <span className="text-amber-400 ml-1 font-semibold">FULL</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button
                    onClick={() => openAttendees(event)}
                    className="px-3 py-2 text-blue-400 text-xs border border-blue-400/20 rounded-xl hover:bg-blue-400/10 transition-colors"
                  >
                    Attendees ({booked})
                  </button>
                  <button onClick={() => openEdit(event)} className="px-3 py-2 text-gold text-xs border border-gold/25 rounded-xl hover:bg-gold-light transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleToggleActive(event)} className="px-3 py-2 text-gray-400 hover:text-white text-xs border border-dark-border rounded-xl transition-colors">
                    {event.is_active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => handleDeleteEvent(event)} className="px-3 py-2 text-red-400 text-xs border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
