import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { useToast } from "../components/Toast";

interface Broadcast {
  id: string;
  title: string;
  body: string;
  type: string;
  sent_to: number;
  failed: number;
  total_tokens: number;
  sent_at: string;
}

const PRESETS = [
  {
    type: "new_venue",
    label: "New Venue",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    title: "New Venue Just Dropped ✦",
    body: "A new partner venue is now live. Open the app to explore and unlock your member benefits.",
  },
  {
    type: "new_deal",
    label: "New Deal",
    icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-7-7 7V5a2 2 0 012-2h10a2 2 0 012 2v16z",
    color: "text-gold bg-gold/10 border-gold/20",
    title: "New Member Deal Live ✦",
    body: "A new exclusive deal is now available at one of your member venues. Don't miss out.",
  },
  {
    type: "new_event",
    label: "New Event",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    color: "text-green-400 bg-green-400/10 border-green-400/20",
    title: "New Event Open for Booking ✦",
    body: "A new HomeQuarters event has just been announced. Spots are limited — book yours now.",
  },
  {
    type: "custom",
    label: "Custom",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    color: "text-gray-400 bg-white/5 border-white/10",
    title: "",
    body: "",
  },
];

export default function Notifications() {
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [title, setTitle] = useState(PRESETS[0].title);
  const [body, setBody] = useState(PRESETS[0].body);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeCount, setActiveCount] = useState<number | null>(null);

  // Live count of members with push tokens
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "profiles"),
      (snap) => {
        const count = snap.docs.filter(
          (d) => d.data().membership_status === "active" && d.data().push_token
        ).length;
        setActiveCount(count);
      }
    );
    return () => unsub();
  }, []);

  // Broadcast history
  useEffect(() => {
    const q = query(
      collection(db, "broadcast_notifications"),
      orderBy("sent_at", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Broadcast)));
      setLoadingHistory(false);
    });
    return () => unsub();
  }, []);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setSelectedPreset(preset);
    setTitle(preset.title);
    setBody(preset.body);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast("Title and message are required.", "error");
      return;
    }
    if (activeCount === 0) {
      toast("No active members with push tokens to notify.", "error");
      return;
    }
    setSending(true);
    try {
      const fn = httpsCallable<
        { title: string; body: string; type: string },
        { sent: number; failed: number }
      >(functions, "sendBroadcastNotification");
      const result = await fn({ title: title.trim(), body: body.trim(), type: selectedPreset.type });
      toast(
        `Sent to ${result.data.sent} member${result.data.sent !== 1 ? "s" : ""}${result.data.failed > 0 ? ` · ${result.data.failed} failed` : ""}`,
        "success"
      );
      // Reset to preset defaults after send
      if (selectedPreset.type !== "custom") {
        setTitle(selectedPreset.title);
        setBody(selectedPreset.body);
      } else {
        setTitle("");
        setBody("");
      }
    } catch (err: any) {
      toast(err.message ?? "Failed to send notification.", "error");
    } finally {
      setSending(false);
    }
  };

  const typeLabel: Record<string, string> = {
    new_venue: "New Venue",
    new_deal: "New Deal",
    new_event: "New Event",
    custom: "Custom",
  };

  const typeColor: Record<string, string> = {
    new_venue: "text-blue-400 bg-blue-400/10",
    new_deal: "text-yellow-400 bg-yellow-400/10",
    new_event: "text-green-400 bg-green-400/10",
    custom: "text-gray-400 bg-white/5",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Push Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            Broadcast to all active members
            {activeCount !== null && (
              <span className="ml-2 text-gold font-medium">
                · {activeCount} recipient{activeCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose panel */}
        <div className="lg:col-span-3 space-y-5">

          {/* Preset selector */}
          <div className="bg-dark border border-dark-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Template
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.type}
                  onClick={() => handlePresetSelect(p)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                    selectedPreset.type === p.type
                      ? p.color + " border-opacity-60"
                      : "text-gray-500 bg-white/5 border-white/5 hover:border-white/15 hover:text-gray-300"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                  </svg>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="bg-dark border border-dark-border rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Message
            </p>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Notification title"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="What do you want to tell your members?"
                className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/50 transition-colors resize-none"
              />
              <p className="text-right text-xs text-gray-600 mt-1">{body.length}/200</p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-dark border border-dark-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Preview
            </p>
            <div className="bg-black rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-extrabold text-xs">HQ</span>
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold leading-tight">
                    {title || <span className="text-gray-600 font-normal italic">Title appears here</span>}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    {body || <span className="text-gray-600 italic">Message appears here</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gold text-black font-bold text-sm transition-opacity disabled:opacity-40"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send to {activeCount !== null ? `${activeCount} member${activeCount !== 1 ? "s" : ""}` : "all members"}
              </>
            )}
          </button>
        </div>

        {/* History panel */}
        <div className="lg:col-span-2">
          <div className="bg-dark border border-dark-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-border">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Recent Broadcasts
              </p>
            </div>

            {loadingHistory ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 text-sm">No broadcasts yet</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
                {history.map((item) => (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-white text-sm font-semibold leading-tight line-clamp-1">
                        {item.title}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${typeColor[item.type] ?? "text-gray-400 bg-white/5"}`}>
                        {typeLabel[item.type] ?? item.type}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs line-clamp-2 mb-2">{item.body}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-400 font-medium">✓ {item.sent_to} sent</span>
                      {item.failed > 0 && (
                        <span className="text-red-400 font-medium">✗ {item.failed} failed</span>
                      )}
                      <span className="text-gray-600 ml-auto">
                        {new Date(item.sent_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
