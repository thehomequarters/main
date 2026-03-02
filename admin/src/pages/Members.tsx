import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  member_code: string;
  membership_status: "pending" | "active" | "rejected" | "suspended";
  title: string | null;
  bio: string | null;
  city: string | null;
  industry: string | null;
  interests: string[];
  created_at: string;
}

type FilterTab = "all" | "pending" | "active" | "rejected" | "suspended";

export default function Members() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "profiles"), orderBy("created_at", "desc"))
        );
        setMembers(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Profile)
        );
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
    newStatus: Profile["membership_status"]
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
      if (selected?.id === memberId) {
        setSelected((s) => s ? { ...s, membership_status: newStatus } : s);
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (member: Profile) => {
    if (
      !confirm(
        `Permanently delete ${member.first_name} ${member.last_name}? This removes their account and cannot be undone.`
      )
    )
      return;

    setDeleting(member.id);
    try {
      const deleteAuthUser = httpsCallable(functions, "deleteAuthUser");
      await deleteAuthUser({ uid: member.id });
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      if (selected?.id === member.id) setSelected(null);
    } catch (e: any) {
      console.error("Failed to delete member:", e);
      alert(
        "Failed to delete member: " + (e.message ?? "Unknown error")
      );
    } finally {
      setDeleting(null);
    }
  };

  const filtered = members
    .filter((m) => filter === "all" || m.membership_status === filter)
    .filter((m) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        m.first_name?.toLowerCase().includes(q) ||
        m.last_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q) ||
        m.industry?.toLowerCase().includes(q) ||
        m.member_code?.toLowerCase().includes(q)
      );
    });

  const counts = {
    all: members.length,
    pending: members.filter((m) => m.membership_status === "pending").length,
    active: members.filter((m) => m.membership_status === "active").length,
    rejected: members.filter((m) => m.membership_status === "rejected").length,
    suspended: members.filter((m) => m.membership_status === "suspended").length,
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "active", label: "Active" },
    { key: "suspended", label: "Suspended" },
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
    <div className="flex gap-6">
      {/* Main list */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Members</h1>
          <p className="text-gray-500 text-sm mt-1">
            {members.length} total
            {counts.pending > 0 && (
              <span className="text-amber-400"> · {counts.pending} pending review</span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, city, industry…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-gold/40"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
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
              <span className="ml-1.5 opacity-60">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {filtered.map((member) => {
            const initials =
              (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");
            const isPending = member.membership_status === "pending";
            const isActive = member.membership_status === "active";
            const isSuspended = member.membership_status === "suspended";
            const isUpdating = updating === member.id;
            const isDeleting = deleting === member.id;
            const isSelected = selected?.id === member.id;

            const statusColors = {
              active: "bg-green-500/15 text-green-400",
              pending: "bg-amber-400/15 text-amber-400",
              rejected: "bg-red-500/15 text-red-400",
              suspended: "bg-orange-500/15 text-orange-400",
            };

            return (
              <div
                key={member.id}
                onClick={() => setSelected(isSelected ? null : member)}
                className={`bg-dark border rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? "border-gold/40"
                    : isPending
                    ? "border-amber-400/20 hover:border-amber-400/40"
                    : "border-dark-border hover:border-white/10"
                }`}
              >
                {/* Avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gold-light border border-gold/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-gold text-xs font-bold">
                      {initials.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">
                        {member.first_name} {member.last_name}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          statusColors[member.membership_status]
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
                    <div className="text-gray-600 text-xs font-mono mt-0.5">
                      {member.member_code}
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div
                  className="flex gap-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(member.id, "active")}
                        disabled={isUpdating || isDeleting}
                        className="px-3 py-1.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold rounded-xl hover:bg-green-500/25 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(member.id, "rejected")}
                        disabled={isUpdating || isDeleting}
                        className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {isActive && (
                    <button
                      onClick={() => handleUpdateStatus(member.id, "suspended")}
                      disabled={isUpdating || isDeleting}
                      className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-xl hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? "..." : "Suspend"}
                    </button>
                  )}
                  {(isSuspended || member.membership_status === "rejected") && (
                    <button
                      onClick={() => handleUpdateStatus(member.id, "active")}
                      disabled={isUpdating || isDeleting}
                      className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? "..." : "Reinstate"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(member)}
                    disabled={isUpdating || isDeleting}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500">
                {search ? "No members match your search." : "No members found."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 flex-shrink-0">
          <div className="bg-dark border border-dark-border rounded-2xl p-5 sticky top-8">
            {/* Close */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-white font-semibold text-sm">
                Member Profile
              </span>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-5">
              <div className="w-16 h-16 rounded-full bg-gold-light border-2 border-gold/30 flex items-center justify-center mb-3">
                <span className="text-gold text-xl font-bold">
                  {(
                    (selected.first_name?.[0] ?? "") +
                    (selected.last_name?.[0] ?? "")
                  ).toUpperCase()}
                </span>
              </div>
              <p className="text-white font-bold text-base">
                {selected.first_name} {selected.last_name}
              </p>
              {selected.title && (
                <p className="text-gray-500 text-xs mt-1">{selected.title}</p>
              )}
              <div
                className={`mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  selected.membership_status === "active"
                    ? "bg-green-500/15 text-green-400"
                    : selected.membership_status === "pending"
                    ? "bg-amber-400/15 text-amber-400"
                    : selected.membership_status === "suspended"
                    ? "bg-orange-500/15 text-orange-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {selected.membership_status}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm mb-5">
              <DetailRow label="Email" value={selected.email} />
              <DetailRow label="Code" value={selected.member_code} mono />
              {selected.phone && (
                <DetailRow label="Phone" value={selected.phone} />
              )}
              {selected.city && (
                <DetailRow label="City" value={selected.city} />
              )}
              {selected.industry && (
                <DetailRow label="Industry" value={selected.industry} />
              )}
              {selected.bio && (
                <DetailRow label="Bio" value={selected.bio} />
              )}
              {selected.interests && selected.interests.length > 0 && (
                <DetailRow
                  label="Interests"
                  value={selected.interests.join(", ")}
                />
              )}
              <DetailRow
                label="Joined"
                value={new Date(selected.created_at).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" }
                )}
              />
            </div>

            {/* Panel actions */}
            <div className="space-y-2">
              {selected.membership_status === "pending" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selected.id, "active")}
                    disabled={updating === selected.id}
                    className="w-full py-2.5 bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold rounded-xl hover:bg-green-500/25 transition-colors disabled:opacity-50"
                  >
                    {updating === selected.id ? "Updating..." : "Approve Member"}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selected.id, "rejected")}
                    disabled={updating === selected.id}
                    className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                </>
              )}
              {selected.membership_status === "active" && (
                <button
                  onClick={() => handleUpdateStatus(selected.id, "suspended")}
                  disabled={updating === selected.id}
                  className="w-full py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold rounded-xl hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                >
                  {updating === selected.id ? "Updating..." : "Suspend Member"}
                </button>
              )}
              {(selected.membership_status === "suspended" ||
                selected.membership_status === "rejected") && (
                <button
                  onClick={() => handleUpdateStatus(selected.id, "active")}
                  disabled={updating === selected.id}
                  className="w-full py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold rounded-xl hover:bg-green-500/20 transition-colors disabled:opacity-50"
                >
                  {updating === selected.id ? "Updating..." : "Reinstate Member"}
                </button>
              )}
              <button
                onClick={() => handleDelete(selected)}
                disabled={deleting === selected.id}
                className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting === selected.id
                  ? "Deleting..."
                  : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="text-gray-600 text-xs uppercase tracking-wider">
        {label}
      </span>
      <p
        className={`text-gray-300 text-sm mt-0.5 break-words ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
