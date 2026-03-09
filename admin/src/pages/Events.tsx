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

interface EventImport {
  id: string;
  title: string;
  description: string;
  venue: string;
  venue_address?: string;
  city?: string;
  country?: string;
  date: string;
  time: string;
  end_time: string;
  image_url: string;
  link_url: string;
  category: string;
  capacity: number;
  source: string;
  eventbrite_id?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const CATEGORIES = ["social", "dining", "wellness", "music", "arts"];

// ── CSV helpers ──────────────────────────────────────────────────────────────
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current); current = "";
    } else { current += ch; }
  }
  result.push(current);
  return result;
}

function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").replace(/^"|"$/g, "").trim(); });
    return row;
  });
}

const EVENT_TEMPLATE =
  "title,description,venue,date,time,end_time,image_url,link_url,category,capacity\n" +
  '"Members Dinner","An intimate dinner with fellow members","The Copper Pot","2025-06-15","19:00","22:00","","","dining","40"';

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
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false }));

  // CSV import
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState<{ success: number; skipped: string[] } | null>(null);

  // Eventbrite import queue
  const [eventImports, setEventImports] = useState<EventImport[]>([]);
  const [pullingEventbrite, setPullingEventbrite] = useState(false);
  const [reviewingImport, setReviewingImport] = useState<EventImport | null>(null);
  const [importEditForm, setImportEditForm] = useState(EMPTY_EVENT);
  const [approvingImport, setApprovingImport] = useState(false);
  const [rejectingImportId, setRejectingImportId] = useState<string | null>(null);
  const [showImportsQueue, setShowImportsQueue] = useState(true);

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

  // Subscribe to pending Eventbrite imports
  useEffect(() => {
    const q = query(
      collection(db, "event_imports"),
      where("status", "==", "pending")
    );
    return onSnapshot(q, (snap) => {
      setEventImports(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as EventImport)
          .sort((a, b) => a.date.localeCompare(b.date))
      );
    });
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

  const handleEventFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileError(null);
    setImportDone(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCsvText(ev.target?.result as string);
        if (rows.length === 0) { setImportFileError("No data rows found in the CSV."); return; }
        setImportRows(rows);
      } catch {
        setImportFileError("Failed to parse the CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImportEvents = async () => {
    setImporting(true);
    const skipped: string[] = [];
    let success = 0;
    for (const row of importRows) {
      if (!row.title?.trim() || !row.date?.trim() || !row.venue?.trim()) {
        skipped.push(row.title?.trim() || "(untitled)");
        continue;
      }
      try {
        await addDoc(collection(db, "events"), {
          title: row.title.trim(),
          description: row.description?.trim() || "",
          venue: row.venue.trim(),
          date: row.date.trim(),
          time: row.time?.trim() || "18:00",
          end_time: row.end_time?.trim() || "21:00",
          image_url: row.image_url?.trim() || "",
          link_url: row.link_url?.trim() || null,
          category: CATEGORIES.includes(row.category) ? row.category : "social",
          capacity: row.capacity?.trim() ? parseInt(row.capacity, 10) : 50,
          is_active: true,
          created_at: new Date().toISOString(),
        });
        success++;
      } catch {
        skipped.push(row.title.trim());
      }
    }
    setImporting(false);
    setImportDone({ success, skipped });
    setImportRows([]);
  };

  // ── Eventbrite handlers ──────────────────────────────────────────────────

  const handlePullEventbrite = async () => {
    setPullingEventbrite(true);
    try {
      const res = await fetch("/api/eventbrite", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to pull from Eventbrite");
      if (data.staged === 0) {
        toast("No new events found — all already in queue or none match.");
      } else {
        toast(`${data.staged} new event${data.staged !== 1 ? "s" : ""} added to review queue`);
        setShowImportsQueue(true);
      }
    } catch (e: any) {
      toast(e.message ?? "Failed to pull from Eventbrite", "error");
    } finally {
      setPullingEventbrite(false);
    }
  };

  const openReview = (imp: EventImport) => {
    setReviewingImport(imp);
    setImportEditForm({
      title: imp.title,
      description: imp.description,
      venue: imp.venue,
      date: imp.date,
      time: imp.time || "18:00",
      end_time: imp.end_time || "21:00",
      image_url: imp.image_url,
      link_url: imp.link_url,
      category: CATEGORIES.includes(imp.category) ? imp.category : "social",
      capacity: imp.capacity || 50,
    });
  };

  const handleApproveImport = async () => {
    if (!reviewingImport || !importEditForm.title.trim() || !importEditForm.date || !importEditForm.venue.trim()) return;
    setApprovingImport(true);
    try {
      await addDoc(collection(db, "events"), {
        title: importEditForm.title.trim(),
        description: importEditForm.description.trim(),
        venue: importEditForm.venue.trim(),
        date: importEditForm.date,
        time: importEditForm.time,
        end_time: importEditForm.end_time,
        image_url: importEditForm.image_url.trim(),
        link_url: importEditForm.link_url.trim() || null,
        category: importEditForm.category,
        capacity: Number(importEditForm.capacity) || 50,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      await updateDoc(doc(db, "event_imports", reviewingImport.id), { status: "approved" });
      setReviewingImport(null);
      toast("Event approved and published to app");
    } catch {
      toast("Failed to approve event", "error");
    } finally {
      setApprovingImport(false);
    }
  };

  const handleRejectImport = async (importId: string) => {
    setRejectingImportId(importId);
    try {
      await updateDoc(doc(db, "event_imports", importId), { status: "rejected" });
      toast("Import dismissed");
    } catch {
      toast("Failed to reject import", "error");
    } finally {
      setRejectingImportId(null);
    }
  };

  // ── Other handlers ───────────────────────────────────────────────────────

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

  const exportCSV = () => {
    const headers = ["Title", "Venue", "Date", "Start Time", "End Time", "Category", "Capacity", "Bookings", "Active", "Created At"];
    const rows = events.map((e) => [
      e.title,
      e.venue,
      e.date,
      e.time,
      e.end_time,
      e.category,
      e.capacity,
      bookingCounts[e.id] ?? 0,
      e.is_active ? "Yes" : "No",
      e.created_at ? new Date(e.created_at).toLocaleDateString("en-GB") : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hq-events-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

      {/* Eventbrite review modal */}
      {reviewingImport && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-dark border border-dark-border rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-dark-border">
              <div>
                <h2 className="text-white text-lg font-bold">Review Import</h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  Edit and approve to publish to the app
                </p>
              </div>
              <button
                onClick={() => setReviewingImport(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Eventbrite source link */}
              {reviewingImport.link_url && (
                <a
                  href={reviewingImport.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on Eventbrite
                </a>
              )}

              {/* Image preview + replacement */}
              <div>
                <label className="block text-gray-500 text-xs mb-1.5">Image URL</label>
                {importEditForm.image_url && (
                  <img
                    src={importEditForm.image_url}
                    alt="Event"
                    className="w-full h-36 object-cover rounded-xl mb-2 border border-dark-border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <input
                  value={importEditForm.image_url}
                  onChange={(e) => setImportEditForm({ ...importEditForm, image_url: e.target.value })}
                  placeholder="https://… (replace with your own image)"
                  className={`w-full bg-black border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 ${
                    importEditForm.image_url && !isValidImageUrl(importEditForm.image_url)
                      ? "border-red-500/50"
                      : "border-dark-border"
                  }`}
                />
                {importEditForm.image_url && !isValidImageUrl(importEditForm.image_url) && (
                  <p className="text-red-400 text-xs mt-1">Must be a valid https:// image URL</p>
                )}
              </div>

              <input
                value={importEditForm.title}
                onChange={(e) => setImportEditForm({ ...importEditForm, title: e.target.value })}
                placeholder="Event title"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              />
              <textarea
                value={importEditForm.description}
                onChange={(e) => setImportEditForm({ ...importEditForm, description: e.target.value })}
                placeholder="Description"
                rows={3}
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 resize-none"
              />
              <input
                value={importEditForm.venue}
                onChange={(e) => setImportEditForm({ ...importEditForm, venue: e.target.value })}
                placeholder="Venue name"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              />
              {(reviewingImport.venue_address || reviewingImport.city) && (
                <p className="text-gray-600 text-xs px-1">
                  📍 {[reviewingImport.venue_address, reviewingImport.city, reviewingImport.country].filter(Boolean).join(", ")}
                </p>
              )}
              <select
                value={importEditForm.category}
                onChange={(e) => setImportEditForm({ ...importEditForm, category: e.target.value })}
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="date"
                  value={importEditForm.date}
                  onChange={(e) => setImportEditForm({ ...importEditForm, date: e.target.value })}
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
                <input
                  type="time"
                  value={importEditForm.time}
                  onChange={(e) => setImportEditForm({ ...importEditForm, time: e.target.value })}
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
                <input
                  type="time"
                  value={importEditForm.end_time}
                  onChange={(e) => setImportEditForm({ ...importEditForm, end_time: e.target.value })}
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={importEditForm.capacity}
                  onChange={(e) => setImportEditForm({ ...importEditForm, capacity: Number(e.target.value) })}
                  placeholder="Capacity"
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
                <input
                  value={importEditForm.link_url}
                  onChange={(e) => setImportEditForm({ ...importEditForm, link_url: e.target.value })}
                  placeholder="Ticketing URL"
                  className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <div className="p-5 border-t border-dark-border flex gap-3">
              <button
                onClick={() => {
                  setReviewingImport(null);
                  handleRejectImport(reviewingImport.id);
                }}
                disabled={approvingImport}
                className="px-4 py-2.5 text-red-400 text-sm border border-red-500/25 rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                Reject
              </button>
              <button
                onClick={() => setReviewingImport(null)}
                className="px-4 py-2.5 text-gray-400 text-sm border border-dark-border rounded-xl hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveImport}
                disabled={approvingImport || !importEditForm.title.trim() || !importEditForm.date || !importEditForm.venue.trim()}
                className="flex-1 px-4 py-2.5 bg-gold text-black font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {approvingImport ? "Publishing…" : "Approve & Publish"}
              </button>
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
              {eventImports.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {eventImports.length} pending review
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePullEventbrite}
              disabled={pullingEventbrite}
              className="flex items-center gap-2 px-4 py-2.5 bg-dark border border-dark-border text-gray-400 text-sm font-medium rounded-xl hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
            >
              {pullingEventbrite ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Pulling…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                  Eventbrite
                </>
              )}
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-dark border border-dark-border text-gray-400 text-sm font-medium rounded-xl hover:text-white hover:border-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => {
                const blob = new Blob([EVENT_TEMPLATE], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "events_template.csv"; a.click(); URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-dark border border-dark-border text-gray-400 text-sm font-medium rounded-xl hover:text-white hover:border-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Template
            </button>
            <button
              onClick={() => { setShowImport(true); setImportRows([]); setImportFileError(null); setImportDone(null); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-dark border border-dark-border text-gray-400 text-sm font-medium rounded-xl hover:text-white hover:border-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12l-4.5-4.5m0 0L7.5 12m4.5-4.5V21" />
              </svg>
              Import CSV
            </button>
            <button
              onClick={() => { setEditingEvent(null); setForm(EMPTY_EVENT); setShowForm(true); }}
              className="px-5 py-2.5 bg-gold text-black font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors"
            >
              + Add Event
            </button>
          </div>
        </div>

        {/* ── CSV import modal ── */}
        {showImport && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-dark border border-dark-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-dark-border">
                <div>
                  <h2 className="text-white text-lg font-bold">Import Events</h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    CSV columns: title, description, venue, date (YYYY-MM-DD), time, end_time, image_url, link_url, category, capacity
                  </p>
                </div>
                <button onClick={() => setShowImport(false)} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">✕</button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {!importDone ? (
                  <>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-dark-border rounded-xl p-8 cursor-pointer hover:border-gold/40 transition-colors">
                      <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12l-4.5-4.5m0 0L7.5 12m4.5-4.5V21" />
                      </svg>
                      <span className="text-gray-400 text-sm">Click to select a CSV file</span>
                      <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleEventFileChange} />
                    </label>

                    {importFileError && <p className="text-red-400 text-sm">{importFileError}</p>}

                    {importRows.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">{importRows.length} row{importRows.length !== 1 ? "s" : ""} ready to import</p>
                        <div className="overflow-x-auto rounded-xl border border-dark-border">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-black/40">
                              <tr>
                                {["title","venue","date","time","category","capacity"].map((h) => (
                                  <th key={h} className="px-3 py-2 text-gray-500 font-medium">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {importRows.slice(0, 8).map((row, i) => (
                                <tr key={i} className={`border-t border-dark-border ${!row.title?.trim() || !row.date?.trim() || !row.venue?.trim() ? "bg-red-900/10" : ""}`}>
                                  <td className="px-3 py-2 text-white max-w-[140px] truncate">{row.title || <span className="text-red-400">missing</span>}</td>
                                  <td className="px-3 py-2 text-gray-400 max-w-[120px] truncate">{row.venue || <span className="text-red-400">missing</span>}</td>
                                  <td className="px-3 py-2 text-gray-400">{row.date || <span className="text-red-400">missing</span>}</td>
                                  <td className="px-3 py-2 text-gray-400">{row.time}</td>
                                  <td className="px-3 py-2 text-gray-400">{row.category}</td>
                                  <td className="px-3 py-2 text-gray-400">{row.capacity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {importRows.length > 8 && <p className="text-gray-600 text-xs px-3 py-2">+{importRows.length - 8} more rows</p>}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <div className="text-4xl">{importDone.skipped.length === 0 ? "✅" : "⚠️"}</div>
                    <p className="text-white font-semibold">{importDone.success} event{importDone.success !== 1 ? "s" : ""} imported successfully</p>
                    {importDone.skipped.length > 0 && (
                      <p className="text-red-400 text-sm">{importDone.skipped.length} skipped (missing title, date or venue): {importDone.skipped.join(", ")}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-dark-border flex justify-end gap-3">
                <button onClick={() => setShowImport(false)} className="px-5 py-2.5 text-gray-400 text-sm border border-dark-border rounded-xl hover:text-white transition-colors">
                  {importDone ? "Close" : "Cancel"}
                </button>
                {!importDone && (
                  <button
                    onClick={handleImportEvents}
                    disabled={importing || importRows.length === 0}
                    className="px-5 py-2.5 bg-gold text-black font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {importing ? "Importing…" : `Import ${importRows.length} event${importRows.length !== 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* ── Eventbrite pending imports queue ── */}
        {eventImports.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowImportsQueue((v) => !v)}
              className="flex items-center gap-2 mb-3 group"
            >
              <span className="text-amber-400 font-semibold text-sm">
                Pending Eventbrite Imports ({eventImports.length})
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${showImportsQueue ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showImportsQueue && (
              <div className="space-y-2">
                {eventImports.map((imp) => {
                  const d = imp.date ? new Date(imp.date) : null;
                  const day = d ? d.getDate() : "—";
                  const month = d
                    ? d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()
                    : "";

                  return (
                    <div
                      key={imp.id}
                      className="bg-dark border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4"
                    >
                      {/* Date badge */}
                      <div className="w-14 h-16 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 text-lg font-extrabold leading-none">{day}</span>
                        <span className="text-amber-400 text-[10px] font-semibold tracking-widest">{month}</span>
                      </div>

                      {/* Thumbnail */}
                      {imp.image_url && (
                        <img
                          src={imp.image_url}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover border border-dark-border flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{imp.title || "(no title)"}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Eventbrite
                          </span>
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {imp.venue}
                          {imp.city ? ` · ${imp.city}` : ""}
                          {imp.country ? `, ${imp.country}` : ""}
                        </div>
                        {imp.time && (
                          <div className="text-gray-600 text-xs mt-0.5">
                            {imp.time}{imp.end_time ? `–${imp.end_time}` : ""}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => openReview(imp)}
                          className="px-4 py-2 text-gold text-xs border border-gold/25 rounded-xl hover:bg-gold-light transition-colors font-medium"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleRejectImport(imp.id)}
                          disabled={rejectingImportId === imp.id}
                          className="px-3 py-2 text-gray-500 text-xs border border-dark-border rounded-xl hover:text-red-400 hover:border-red-500/25 transition-colors disabled:opacity-40"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
