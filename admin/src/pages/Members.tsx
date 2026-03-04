import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  member_code: string;
  membership_status: "pending" | "accepted" | "active" | "rejected" | "suspended";
  title: string | null;
  bio: string | null;
  city: string | null;
  industry: string | null;
  interests: string[];
  created_at: string;
  accepted_at?: string | null;
  voucher_count?: number;
  vouchers?: string[];
  application_code?: string;
}

type FilterTab = "all" | "pending" | "accepted" | "active" | "rejected" | "suspended";

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-green-500/15 text-green-400",
  accepted:  "bg-amber-500/15 text-amber-400",
  pending:   "bg-yellow-400/15 text-yellow-400",
  rejected:  "bg-red-500/15 text-red-400",
  suspended: "bg-orange-500/15 text-orange-400",
};

export default function Members() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", confirmLabel: "Confirm", danger: false, onConfirm: () => {} });

  const closeConfirm = () =>
    setConfirmState((s) => ({ ...s, open: false }));

  const confirm = (opts: Omit<typeof confirmState, "open">) =>
    new Promise<boolean>((resolve) => {
      setConfirmState({
        ...opts,
        open: true,
        onConfirm: () => {
          closeConfirm();
          resolve(true);
        },
      });
      // Attach cancel resolve via close button's onCancel
    });

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "profiles"), orderBy("created_at", "desc")),
      (snap) => {
        setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Profile));
        setLoading(false);
      },
      (e) => {
        console.error("Members listener error:", e);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Reset page when filter/search changes
  useEffect(() => { setPage(0); }, [filter, search]);

  const filtered = useMemo(
    () =>
      members
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
        }),
    [members, filter, search]
  );

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const counts = useMemo(
    () => ({
      all: members.length,
      pending: members.filter((m) => m.membership_status === "pending").length,
      accepted: members.filter((m) => m.membership_status === "accepted").length,
      active: members.filter((m) => m.membership_status === "active").length,
      rejected: members.filter((m) => m.membership_status === "rejected").length,
      suspended: members.filter((m) => m.membership_status === "suspended").length,
    }),
    [members]
  );

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all",       label: "All"       },
    { key: "pending",   label: "Pending"   },
    { key: "accepted",  label: "Accepted"  },
    { key: "active",    label: "Active"    },
    { key: "suspended", label: "Suspended" },
    { key: "rejected",  label: "Rejected"  },
  ];

  const handleUpdateStatus = async (
    memberId: string,
    newStatus: Profile["membership_status"]
  ) => {
    setUpdating(memberId);
    try {
      const payload: Record<string, unknown> = { membership_status: newStatus };
      if (newStatus === "accepted") {
        payload.accepted_at = new Date().toISOString();
      }
      await updateDoc(doc(db, "profiles", memberId), payload);
      toast(`Status updated to ${newStatus}`);
      if (selected?.id === memberId) {
        setSelected((s) =>
          s ? { ...s, membership_status: newStatus, ...(newStatus === "accepted" ? { accepted_at: payload.accepted_at as string } : {}) } : s
        );
      }
    } catch (e) {
      console.error("Failed to update status:", e);
      toast("Failed to update status", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = (member: Profile) => {
    setConfirmState({
      open: true,
      title: "Delete account",
      message: `Permanently delete ${member.first_name} ${member.last_name}? This removes their account and cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          const deleteAuthUser = httpsCallable(functions, "deleteAuthUser");
          await deleteAuthUser({ uid: member.id });
          if (selected?.id === member.id) setSelected(null);
          toast("Account deleted");
        } catch (e: any) {
          toast("Failed to delete: " + (e.message ?? "Unknown error"), "error");
        }
      },
    });
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((m) => m.id)));
    }
  };

  const bulkUpdateStatus = async (newStatus: Profile["membership_status"]) => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const payload: Record<string, unknown> = { membership_status: newStatus };
      if (newStatus === "accepted") payload.accepted_at = new Date().toISOString();
      await updateDoc(doc(db, "profiles", id), payload);
    }
    toast(`${ids.length} member${ids.length !== 1 ? "s" : ""} updated to ${newStatus}`);
    setSelectedIds(new Set());
  };

  const bulkDelete = () => {
    const ids = Array.from(selectedIds);
    setConfirmState({
      open: true,
      title: "Delete accounts",
      message: `Permanently delete ${ids.length} account${ids.length !== 1 ? "s" : ""}? This cannot be undone.`,
      confirmLabel: "Delete All",
      danger: true,
      onConfirm: async () => {
        closeConfirm();
        const deleteAuthUser = httpsCallable(functions, "deleteAuthUser");
        let failed = 0;
        for (const uid of ids) {
          try {
            await deleteAuthUser({ uid });
          } catch {
            failed++;
          }
        }
        if (failed > 0) toast(`${failed} deletions failed`, "error");
        else toast(`${ids.length} account${ids.length !== 1 ? "s" : ""} deleted`);
        setSelectedIds(new Set());
        if (selected && ids.includes(selected.id)) setSelected(null);
      },
    });
  };

  // Edit member details
  const startEdit = () => {
    if (!selected) return;
    setEditForm({
      first_name: selected.first_name,
      last_name: selected.last_name,
      phone: selected.phone ?? "",
      city: selected.city ?? "",
      industry: selected.industry ?? "",
      title: selected.title ?? "",
      bio: selected.bio ?? "",
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, "profiles", selected.id), {
        first_name: (editForm.first_name ?? "").trim(),
        last_name: (editForm.last_name ?? "").trim(),
        phone: (editForm.phone as string)?.trim() || null,
        city: (editForm.city as string)?.trim() || null,
        industry: (editForm.industry as string)?.trim() || null,
        title: (editForm.title as string)?.trim() || null,
        bio: (editForm.bio as string)?.trim() || null,
      });
      toast("Profile updated");
      setEditMode(false);
    } catch (e) {
      toast("Failed to save", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-dark rounded-lg animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-20" />
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
        confirmLabel={confirmState.confirmLabel}
        danger={confirmState.danger}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      <div className="flex gap-6">
        {/* Main list */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Members</h1>
            <p className="text-gray-500 text-sm mt-1">
              {members.length} total
              {counts.pending > 0 && (
                <span className="text-yellow-400"> · {counts.pending} pending review</span>
              )}
              {counts.accepted > 0 && (
                <span className="text-amber-400"> · {counts.accepted} in grace period</span>
              )}
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
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
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
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

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 bg-dark border border-gold/20 rounded-xl px-4 py-3 mb-4">
              <span className="text-white text-sm font-semibold flex-1">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => bulkUpdateStatus("accepted")}
                className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/25 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => bulkUpdateStatus("active")}
                className="px-3 py-1.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/25 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => bulkUpdateStatus("rejected")}
                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={bulkDelete}
                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-gray-500 hover:text-white text-xs transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Select all row */}
          {paginated.length > 0 && (
            <div className="flex items-center gap-2 px-1 mb-2">
              <input
                type="checkbox"
                checked={selectedIds.size === paginated.length && paginated.length > 0}
                onChange={toggleSelectAll}
                className="accent-gold w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-gray-600 text-xs">
                Select all on this page
              </span>
            </div>
          )}

          {/* Members list */}
          <div className="space-y-2">
            {paginated.map((member) => {
              const initials = (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");
              const isPending   = member.membership_status === "pending";
              const isAccepted  = member.membership_status === "accepted";
              const isActive    = member.membership_status === "active";
              const isSuspended = member.membership_status === "suspended";
              const isUpdating  = updating === member.id;
              const isSelected  = selected?.id === member.id;
              const isBulkSelected = selectedIds.has(member.id);

              return (
                <div
                  key={member.id}
                  onClick={() => setSelected(isSelected ? null : member)}
                  className={`bg-dark border rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-gold/40"
                      : isBulkSelected
                      ? "border-gold/20 bg-gold-light/5"
                      : isPending
                      ? "border-amber-400/20 hover:border-amber-400/40"
                      : "border-dark-border hover:border-white/10"
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className="flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(member.id); }}
                  >
                    <input
                      type="checkbox"
                      checked={isBulkSelected}
                      onChange={() => {}}
                      className="accent-gold w-3.5 h-3.5 cursor-pointer"
                    />
                  </div>

                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gold-light border border-gold/25 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold text-xs font-bold">{initials.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">
                          {member.first_name} {member.last_name}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_COLORS[member.membership_status]}`}>
                          {member.membership_status}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5 truncate">
                        {member.email}
                        {member.city && ` · ${member.city}`}
                        {member.industry && ` · ${member.industry}`}
                      </div>
                      <div className="text-gray-600 text-xs font-mono mt-0.5 flex items-center gap-2">
                        {member.member_code}
                        {isPending && (
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${(member.voucher_count ?? 0) >= 2 ? "bg-green-900/40 text-green-400" : "bg-yellow-900/40 text-yellow-400"}`}>
                            {member.voucher_count ?? 0}/2 nominations
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isPending && (
                      <>
                        <button onClick={() => handleUpdateStatus(member.id, "accepted")} disabled={isUpdating} className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-500/25 transition-colors disabled:opacity-50">
                          {isUpdating ? "..." : "Accept"}
                        </button>
                        <button onClick={() => handleUpdateStatus(member.id, "rejected")} disabled={isUpdating} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50">
                          Reject
                        </button>
                      </>
                    )}
                    {isAccepted && (
                      <>
                        <button onClick={() => handleUpdateStatus(member.id, "active")} disabled={isUpdating} className="px-3 py-1.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold rounded-xl hover:bg-green-500/25 transition-colors disabled:opacity-50">
                          {isUpdating ? "..." : "Activate"}
                        </button>
                        <button onClick={() => handleUpdateStatus(member.id, "suspended")} disabled={isUpdating} className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-xl hover:bg-orange-500/20 transition-colors disabled:opacity-50">
                          Suspend
                        </button>
                      </>
                    )}
                    {isActive && (
                      <button onClick={() => handleUpdateStatus(member.id, "suspended")} disabled={isUpdating} className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-xl hover:bg-orange-500/20 transition-colors disabled:opacity-50">
                        {isUpdating ? "..." : "Suspend"}
                      </button>
                    )}
                    {(isSuspended || member.membership_status === "rejected") && (
                      <button onClick={() => handleUpdateStatus(member.id, "accepted")} disabled={isUpdating} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                        {isUpdating ? "..." : "Reinstate"}
                      </button>
                    )}
                    <button onClick={() => handleDelete(member)} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500">
                  {search
                    ? "No members match your search."
                    : filter === "pending"
                    ? "No pending applications — you're all caught up!"
                    : `No ${filter === "all" ? "" : filter + " "}members yet.`}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-border">
              <span className="text-gray-500 text-xs">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs border border-dark-border text-gray-400 rounded-xl hover:text-white disabled:opacity-30 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs border border-dark-border text-gray-400 rounded-xl hover:text-white disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-dark border border-dark-border rounded-2xl p-5 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-white font-semibold text-sm">
                  {editMode ? "Edit Profile" : "Member Profile"}
                </span>
                <button onClick={() => { setSelected(null); setEditMode(false); }} className="text-gray-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editMode ? (
                /* Edit form */
                <div className="space-y-3 mb-5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-600 text-xs uppercase tracking-wider block mb-1">First name</label>
                      <input
                        value={editForm.first_name ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                      />
                    </div>
                    <div>
                      <label className="text-gray-600 text-xs uppercase tracking-wider block mb-1">Last name</label>
                      <input
                        value={editForm.last_name ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs uppercase tracking-wider block mb-1">Title</label>
                    <input
                      value={editForm.title as string ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs uppercase tracking-wider block mb-1">Phone</label>
                    <input
                      value={editForm.phone as string ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs uppercase tracking-wider block mb-1">City</label>
                    <input
                      value={editForm.city as string ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs uppercase tracking-wider block mb-1">Industry</label>
                    <input
                      value={editForm.industry as string ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 text-xs uppercase tracking-wider block mb-1">Bio</label>
                    <textarea
                      value={editForm.bio as string ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      rows={3}
                      className="w-full bg-black border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/50 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(false)} className="flex-1 py-2 border border-dark-border text-gray-400 rounded-xl text-sm hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button onClick={saveEdit} disabled={savingEdit} className="flex-1 py-2 bg-gold text-black rounded-xl text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-50">
                      {savingEdit ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  {/* Avatar */}
                  <div className="flex flex-col items-center mb-5">
                    <div className="w-16 h-16 rounded-full bg-gold-light border-2 border-gold/30 flex items-center justify-center mb-3">
                      <span className="text-gold text-xl font-bold">
                        {((selected.first_name?.[0] ?? "") + (selected.last_name?.[0] ?? "")).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white font-bold text-base">
                      {selected.first_name} {selected.last_name}
                    </p>
                    {selected.title && <p className="text-gray-500 text-xs mt-1">{selected.title}</p>}
                    <div className={`mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_COLORS[selected.membership_status]}`}>
                      {selected.membership_status}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-sm mb-5">
                    <DetailRow label="Email" value={selected.email} />
                    <DetailRow label="Code" value={selected.member_code} mono />
                    {selected.membership_status === "pending" && (
                      <DetailRow
                        label="Nominations"
                        value={`${selected.voucher_count ?? 0} / 2 ${(selected.voucher_count ?? 0) >= 2 ? "✓ ready to review" : "— needs more"}`}
                      />
                    )}
                    {selected.accepted_at && (
                      <DetailRow
                        label="Accepted"
                        value={new Date(selected.accepted_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      />
                    )}
                    {selected.application_code && selected.membership_status === "pending" && (
                      <DetailRow label="App. Code" value={selected.application_code} mono />
                    )}
                    {selected.phone && <DetailRow label="Phone" value={selected.phone} />}
                    {selected.city && <DetailRow label="City" value={selected.city} />}
                    {selected.industry && <DetailRow label="Industry" value={selected.industry} />}
                    {selected.bio && <DetailRow label="Bio" value={selected.bio} />}
                    {selected.interests?.length > 0 && (
                      <DetailRow label="Interests" value={selected.interests.join(", ")} />
                    )}
                    <DetailRow
                      label="Joined"
                      value={new Date(selected.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    />
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={startEdit}
                    className="w-full mb-3 py-2.5 bg-white/5 border border-dark-border text-gray-300 text-sm font-medium rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Edit Profile Details
                  </button>

                  {/* Status actions */}
                  <div className="space-y-2">
                    {selected.membership_status === "pending" && (
                      <>
                        <button onClick={() => handleUpdateStatus(selected.id, "accepted")} disabled={updating === selected.id} className="w-full py-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-bold rounded-xl hover:bg-amber-500/25 transition-colors disabled:opacity-50">
                          {updating === selected.id ? "Updating…" : "Accept Member"}
                        </button>
                        <button onClick={() => handleUpdateStatus(selected.id, "rejected")} disabled={updating === selected.id} className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50">
                          Reject Application
                        </button>
                      </>
                    )}
                    {selected.membership_status === "accepted" && (
                      <>
                        <button onClick={() => handleUpdateStatus(selected.id, "active")} disabled={updating === selected.id} className="w-full py-2.5 bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold rounded-xl hover:bg-green-500/25 transition-colors disabled:opacity-50">
                          {updating === selected.id ? "Updating…" : "Activate Member"}
                        </button>
                        <button onClick={() => handleUpdateStatus(selected.id, "suspended")} disabled={updating === selected.id} className="w-full py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold rounded-xl hover:bg-orange-500/20 transition-colors disabled:opacity-50">
                          Suspend
                        </button>
                      </>
                    )}
                    {selected.membership_status === "active" && (
                      <button onClick={() => handleUpdateStatus(selected.id, "suspended")} disabled={updating === selected.id} className="w-full py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold rounded-xl hover:bg-orange-500/20 transition-colors disabled:opacity-50">
                        {updating === selected.id ? "Updating…" : "Suspend Member"}
                      </button>
                    )}
                    {(selected.membership_status === "suspended" || selected.membership_status === "rejected") && (
                      <button onClick={() => handleUpdateStatus(selected.id, "accepted")} disabled={updating === selected.id} className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                        {updating === selected.id ? "Updating…" : "Reinstate Member"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selected)}
                      className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-gray-600 text-xs uppercase tracking-wider">{label}</span>
      <p className={`text-gray-300 text-sm mt-0.5 break-words ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
