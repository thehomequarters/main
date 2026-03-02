import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";

interface Invite {
  id: string;
  code: string;
  created_by: string;
  created_at: string;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  note: string | null;
}

function generateCode(): string {
  const seg = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HQ-${seg()}-${seg()}`;
}

export default function Invites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInvites = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "invites"), orderBy("created_at", "desc"))
      );
      setInvites(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invite)
      );
    } catch (e) {
      console.error("Failed to load invites:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const code = generateCode();
      const invite: Omit<Invite, "id"> = {
        code,
        created_by: user.uid,
        created_at: new Date().toISOString(),
        used: false,
        used_by: null,
        used_at: null,
        note: note.trim() || null,
      };
      const ref = await addDoc(collection(db, "invites"), invite);
      setInvites((prev) => [{ id: ref.id, ...invite }, ...prev]);
      setNote("");
      setShowForm(false);
    } catch (e) {
      console.error("Failed to create invite:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this invite code? This cannot be undone.")) return;
    setRevoking(id);
    try {
      await deleteDoc(doc(db, "invites", id));
      setInvites((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error("Failed to revoke invite:", e);
    } finally {
      setRevoking(null);
    }
  };

  const handleCopy = (invite: Invite) => {
    navigator.clipboard.writeText(invite.code);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const unused = invites.filter((i) => !i.used);
  const used = invites.filter((i) => i.used);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-dark rounded-lg animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-16"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Invite Codes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {unused.length} active · {used.length} used
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-5 py-2.5 bg-gold-light border border-gold/25 text-gold text-sm font-bold rounded-xl hover:bg-gold/20 transition-colors"
        >
          + Generate Invite
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-dark border border-gold/20 rounded-2xl p-5 mb-6">
          <p className="text-white font-semibold mb-3">New Invite Code</p>
          <input
            type="text"
            placeholder="Note (optional) — e.g. 'For Amara'"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-gold/40 mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-5 py-2.5 bg-gold text-black text-sm font-bold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {creating ? "Generating..." : "Generate Code"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-dark border border-dark-border text-gray-400 text-sm font-medium rounded-xl hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active invites */}
      {unused.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Active
          </h2>
          <div className="space-y-3">
            {unused.map((invite) => (
              <div
                key={invite.id}
                className="bg-dark border border-dark-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gold font-bold text-base tracking-widest">
                      {invite.code}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-500/15 text-green-400">
                      Active
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    Created{" "}
                    {new Date(invite.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {invite.note && (
                      <span className="text-gray-500"> · {invite.note}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(invite)}
                    className="px-3 py-1.5 bg-white/5 border border-dark-border text-gray-300 text-xs font-medium rounded-lg hover:text-white transition-colors"
                  >
                    {copiedId === invite.id ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleRevoke(invite.id)}
                    disabled={revoking === invite.id}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {revoking === invite.id ? "..." : "Revoke"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used invites */}
      {used.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Used
          </h2>
          <div className="space-y-2">
            {used.map((invite) => (
              <div
                key={invite.id}
                className="bg-dark border border-dark-border rounded-2xl p-4 flex items-center gap-3 opacity-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-500 font-bold text-base tracking-widest">
                      {invite.code}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-500/15 text-gray-500">
                      Used
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    Used{" "}
                    {invite.used_at
                      ? new Date(invite.used_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                    {invite.note && (
                      <span className="text-gray-600"> · {invite.note}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invites.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-sm">No invite codes yet.</p>
          <p className="text-gray-600 text-xs mt-1">
            Generate a code to invite someone to HomeQuarters.
          </p>
        </div>
      )}
    </div>
  );
}
