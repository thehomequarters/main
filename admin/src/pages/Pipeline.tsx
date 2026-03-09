import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../components/Toast";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  member_code: string;
  membership_status: "pending" | "open_application" | "accepted" | "active" | "rejected" | "suspended";
  city: string | null;
  industry: string | null;
  created_at: string;
  accepted_at?: string | null;
  voucher_count?: number;
}

function daysAgo(isoDate: string | null | undefined): number {
  if (!isoDate) return 0;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

function StageArrow({ fromCount, toCount }: { fromCount: number; toCount: number }) {
  const rate = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;
  return (
    <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
      <div className="text-xs font-bold text-gray-500">{rate}%</div>
      <svg className="w-6 h-6 text-gray-700 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </div>
  );
}

function MemberCard({
  member,
  sinceDate,
  onAccept,
  onActivate,
  onReject,
  updating,
}: {
  member: Profile;
  sinceDate: string | null | undefined;
  onAccept?: () => void;
  onActivate?: () => void;
  onReject?: () => void;
  updating: boolean;
}) {
  const days = daysAgo(sinceDate);
  const initials = (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");

  return (
    <div className="bg-black/40 border border-dark-border rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gold-light border border-gold/25 flex items-center justify-center flex-shrink-0">
          <span className="text-gold text-xs font-bold">{initials.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">
            {member.first_name} {member.last_name}
          </p>
          <p className="text-gray-600 text-xs truncate">{member.email}</p>
        </div>
        <span className="text-gray-600 text-xs flex-shrink-0">{days}d</span>
      </div>

      {(member.city || member.industry) && (
        <p className="text-gray-600 text-xs truncate">
          {[member.city, member.industry].filter(Boolean).join(" · ")}
        </p>
      )}

      {member.membership_status === "pending" && typeof member.voucher_count === "number" && (
        <div className={`text-xs font-semibold px-2 py-0.5 rounded inline-block ${member.voucher_count >= 2 ? "bg-green-900/40 text-green-400" : "bg-yellow-900/40 text-yellow-400"}`}>
          {member.voucher_count}/2 nominations
        </div>
      )}

      {(onAccept || onActivate || onReject) && (
        <div className="flex gap-1.5 pt-1">
          {onAccept && (
            <button
              onClick={onAccept}
              disabled={updating}
              className="flex-1 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/25 transition-colors disabled:opacity-50"
            >
              {updating ? "…" : "Accept"}
            </button>
          )}
          {onActivate && (
            <button
              onClick={onActivate}
              disabled={updating}
              className="flex-1 py-1.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/25 transition-colors disabled:opacity-50"
            >
              {updating ? "…" : "Activate"}
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              disabled={updating}
              className="flex-1 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Pipeline() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "profiles"), orderBy("created_at", "desc")),
      (snap) => {
        setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Profile));
        setLoading(false);
      },
      (e) => {
        console.error("Pipeline listener error:", e);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const { pending, accepted, active } = useMemo(() => ({
    pending: members.filter((m) => m.membership_status === "pending" || m.membership_status === "open_application"),
    accepted: members.filter((m) => m.membership_status === "accepted"),
    active: members.filter((m) => m.membership_status === "active"),
  }), [members]);

  const handleStatus = async (memberId: string, newStatus: Profile["membership_status"]) => {
    setUpdating(memberId);
    try {
      const payload: Record<string, unknown> = { membership_status: newStatus };
      if (newStatus === "accepted") payload.accepted_at = new Date().toISOString();
      await updateDoc(doc(db, "profiles", memberId), payload);
      toast(`Status updated to ${newStatus}`);
    } catch {
      toast("Failed to update status", "error");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-dark rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  const totalActive = members.filter((m) =>
    ["pending", "open_application", "accepted", "active"].includes(m.membership_status)
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Pipeline</h1>
        <p className="text-gray-500 text-sm mt-1">
          {totalActive} members in pipeline · {active.length} active
        </p>
      </div>

      {/* Funnel summary */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-white font-bold text-lg">{pending.length}</span>
          <span className="text-gray-500 text-sm">Pending</span>
        </div>
        <StageArrow fromCount={pending.length} toCount={accepted.length} />
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-white font-bold text-lg">{accepted.length}</span>
          <span className="text-gray-500 text-sm">Trial</span>
        </div>
        <StageArrow fromCount={accepted.length} toCount={active.length} />
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-white font-bold text-lg">{active.length}</span>
          <span className="text-gray-500 text-sm">Active</span>
        </div>
      </div>

      {/* Stage columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Pending Nomination */}
        <div className="bg-dark border border-yellow-400/15 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-dark-border flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-sm">Pending Nomination</h2>
              <p className="text-gray-600 text-xs mt-0.5">awaiting 2 nominations or review</p>
            </div>
            <span className="text-yellow-400 font-bold text-lg">{pending.length}</span>
          </div>
          <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
            {pending.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-8">No pending applications</p>
            ) : (
              pending.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  sinceDate={m.created_at}
                  onAccept={() => handleStatus(m.id, "accepted")}
                  onReject={() => handleStatus(m.id, "rejected")}
                  updating={updating === m.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Accepted / Trial */}
        <div className="bg-dark border border-amber-500/15 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-dark-border flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-sm">Accepted — Trial</h2>
              <p className="text-gray-600 text-xs mt-0.5">payment setup in progress</p>
            </div>
            <span className="text-amber-400 font-bold text-lg">{accepted.length}</span>
          </div>
          <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
            {accepted.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-8">No members in trial</p>
            ) : (
              accepted.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  sinceDate={m.accepted_at}
                  onActivate={() => handleStatus(m.id, "active")}
                  updating={updating === m.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-dark border border-green-500/15 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-dark-border flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-sm">Active Members</h2>
              <p className="text-gray-600 text-xs mt-0.5">fully onboarded and paying</p>
            </div>
            <span className="text-green-400 font-bold text-lg">{active.length}</span>
          </div>
          <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
            {active.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-8">No active members yet</p>
            ) : (
              active.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  sinceDate={m.accepted_at}
                  updating={updating === m.id}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
