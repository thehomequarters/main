import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";

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

interface ProfileStub {
  first_name: string;
  last_name: string;
  email: string;
}

function generateCode(): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HQ-${seg()}-${seg()}`;
}

export default function Invites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileStub>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string; onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });
  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false }));

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "invites"), orderBy("created_at", "desc")),
      (snap) => {
        setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invite));
        setLoading(false);
      },
      (e) => {
        console.error("Invites listener error:", e);
        setLoading(false);
      }
    );

    // Load profiles once for used_by name resolution
    getDocs(collection(db, "profiles")).then((snap) => {
      const map: Record<string, ProfileStub> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = {
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          email: data.email ?? "",
        };
      });
      setProfiles(map);
    });

    return unsub;
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
      await addDoc(collection(db, "invites"), invite);
      setNote("");
      setShowForm(false);
      toast(`Code ${code} generated`);
    } catch (e) {
      console.error("Failed to create invite:", e);
      toast("Failed to generate code", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = (id: string, code: string) => {
    setConfirmState({
      open: true,
      title: "Revoke invite",
      message: `Revoke code ${code}? This cannot be undone.`,
      onConfirm: async () => {
        closeConfirm();
        setRevoking(id);
        try {
          await deleteDoc(doc(db, "invites", id));
          toast("Invite revoked");
        } catch {
          toast("Failed to revoke", "error");
        } finally {
          setRevoking(null);
        }
      },
    });
  };

  const handleCopy = (invite: Invite) => {
    navigator.clipboard.writeText(invite.code);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resolvedName = (uid: string | null): string => {
    if (!uid) return "";
    const p = profiles[uid];
    if (!p) return uid.slice(0, 8) + "…";
    return `${p.first_name} ${p.last_name}`.trim() || p.email;
  };

  const unused = invites.filter((i) => !i.used);
  const used = invites.filter((i) => i.used);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-dark rounded-lg animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-16" />
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
        confirmLabel="Revoke"
        danger
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      <div>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Invite Codes</h1>
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
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-gold/40 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-5 py-2.5 bg-gold text-black text-sm font-bold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {creating ? "Generating…" : "Generate Code"}
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
              Active ({unused.length})
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
                        day: "numeric", month: "short", year: "numeric",
                      })}
                      {invite.note && <span className="text-gray-500"> · {invite.note}</span>}
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
                      onClick={() => handleRevoke(invite.id, invite.code)}
                      disabled={revoking === invite.id}
                      className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {revoking === invite.id ? "…" : "Revoke"}
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
              Used ({used.length})
            </h2>
            <div className="space-y-2">
              {used.map((invite) => {
                const memberName = resolvedName(invite.used_by);
                return (
                  <div
                    key={invite.id}
                    className="bg-dark border border-dark-border rounded-2xl p-4 flex items-center gap-3 opacity-60"
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
                      <div className="text-gray-600 text-xs mt-1 flex flex-wrap gap-x-2">
                        {invite.used_at && (
                          <span>
                            Used{" "}
                            {new Date(invite.used_at).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        )}
                        {memberName && (
                          <span className="text-gray-500">by {memberName}</span>
                        )}
                        {invite.note && (
                          <span className="text-gray-600">· {invite.note}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
    </>
  );
}
