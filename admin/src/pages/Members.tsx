import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  member_code: string;
  membership_status: "pending" | "active" | "rejected";
  title: string | null;
  city: string | null;
  industry: string | null;
  created_at: string;
}

type FilterTab = "all" | "pending" | "active" | "rejected";

export default function Members() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const snap = await getDocs(collection(db, "profiles"));
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Profile)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        setMembers(list);
      } catch (e) {
        console.error("Failed to load members:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const handleUpdateStatus = async (
    memberId: string,
    newStatus: "active" | "rejected"
  ) => {
    setUpdating(memberId);
    try {
      await updateDoc(doc(db, "profiles", memberId), {
        membership_status: newStatus,
      });
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, membership_status: newStatus } : m
        )
      );
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setUpdating(null);
    }
  };

  const filtered =
    filter === "all"
      ? members
      : members.filter((m) => m.membership_status === filter);

  const pendingCount = members.filter(
    (m) => m.membership_status === "pending"
  ).length;

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: members.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "active", label: "Active" },
    { key: "rejected", label: "Rejected" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-dark rounded-lg animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-20"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Members</h1>
        <p className="text-gray-500 text-sm mt-1">
          {members.length} total member{members.length !== 1 ? "s" : ""}
          {pendingCount > 0 && (
            <span className="text-amber-400">
              {" "}
              · {pendingCount} pending review
            </span>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? "bg-gold-light text-gold border border-gold/25"
                : "bg-dark border border-dark-border text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 opacity-60">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Members table / list */}
      <div className="space-y-3">
        {filtered.map((member) => {
          const initials =
            (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");
          const isPending = member.membership_status === "pending";
          const isActive = member.membership_status === "active";
          const isUpdating = updating === member.id;

          return (
            <div
              key={member.id}
              className={`bg-dark border rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 ${
                isPending ? "border-amber-400/20" : "border-dark-border"
              }`}
            >
              {/* Avatar + info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-full bg-gold-light border border-gold/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-sm font-bold">
                    {initials.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm truncate">
                      {member.first_name} {member.last_name}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isActive
                          ? "bg-green-500/15 text-green-400"
                          : isPending
                            ? "bg-amber-400/15 text-amber-400"
                            : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {member.membership_status}
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5 truncate">
                    {member.email}
                    {member.city && ` · ${member.city}`}
                    {member.industry && ` · ${member.industry}`}
                  </div>
                  <div className="text-gray-600 text-xs mt-0.5 font-mono">
                    {member.member_code}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isPending && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleUpdateStatus(member.id, "active")}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold rounded-xl hover:bg-green-500/25 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(member.id, "rejected")}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}

              {isActive && (
                <div className="flex gap-2 flex-shrink-0">
                  <span className="text-gray-600 text-xs">
                    Joined{" "}
                    {new Date(member.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No members found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
