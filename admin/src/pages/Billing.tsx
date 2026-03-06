import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../components/Toast";

type MembershipTier = "gold_card" | "platinum_card" | "founding_member" | "committee_member";

interface PaymentRecord {
  id: string;
  stripe_customer_id: string;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  user_id: string | null;
  user_name: string | null;
  email: string | null;
  amount: number; // pence
  currency: string;
  membership_tier: MembershipTier | null;
  status: "succeeded" | "failed";
  created_at: string;
}

type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";

interface BillingProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  member_code: string;
  membership_status: string;
  membership_tier: MembershipTier;
  created_at: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: SubscriptionStatus | null;
  current_period_end?: string | null;
}

const SUB_STATUS_BADGE: Record<SubscriptionStatus, string> = {
  active: "bg-green-500/15 text-green-400",
  past_due: "bg-amber-500/15 text-amber-400",
  canceled: "bg-red-500/15 text-red-400",
  trialing: "bg-blue-500/15 text-blue-400",
};

const TIER_PRICE: Record<MembershipTier, number | null> = {
  gold_card: 5,
  platinum_card: 15,
  founding_member: null,
  committee_member: 0,
};

const TIER_LABEL: Record<MembershipTier, string> = {
  gold_card: "Gold Card",
  platinum_card: "Platinum Card",
  founding_member: "Founding Member",
  committee_member: "Committee",
};

const TIER_BADGE: Record<MembershipTier, string> = {
  gold_card: "bg-gold/15 text-gold",
  platinum_card: "bg-purple-500/15 text-purple-400",
  founding_member: "bg-teal-500/15 text-teal-400",
  committee_member: "bg-gray-500/15 text-gray-400",
};

const ALL_TIERS: MembershipTier[] = [
  "gold_card",
  "platinum_card",
  "founding_member",
  "committee_member",
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 100;
  const h = 40;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const area = `M0,${h} L${data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" L")} L${w},${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-10 mt-3"
    >
      <path d={area} fill={color} fillOpacity="0.1" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Billing() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<BillingProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | MembershipTier>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "profiles"), (snap) => {
      setProfiles(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as BillingProfile))
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "payments"),
      orderBy("created_at", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPayments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord))
      );
    });
    return () => unsub();
  }, []);

  const activeMembers = useMemo(
    () => profiles.filter((p) => p.membership_status === "active"),
    [profiles]
  );

  const goldCount = activeMembers.filter((p) => p.membership_tier === "gold_card").length;
  const platinumCount = activeMembers.filter((p) => p.membership_tier === "platinum_card").length;
  const foundingCount = activeMembers.filter((p) => p.membership_tier === "founding_member").length;
  const committeeCount = activeMembers.filter((p) => p.membership_tier === "committee_member").length;

  const mrr = goldCount * 5 + platinumCount * 15;
  const arr = mrr * 12;

  // New MRR added per day over last 30 days
  const mrrSparkline = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      const dayStr = d.toISOString().slice(0, 10);
      return activeMembers
        .filter(
          (p) =>
            p.created_at?.slice(0, 10) === dayStr &&
            (p.membership_tier === "gold_card" || p.membership_tier === "platinum_card")
        )
        .reduce((sum, p) => sum + (TIER_PRICE[p.membership_tier] ?? 0), 0);
    });
  }, [activeMembers]);

  const mrrSparkTotal = mrrSparkline.reduce((a, b) => a + b, 0);

  const filteredMembers = useMemo(() => {
    return activeMembers
      .filter((p) => {
        const matchSearch =
          !search ||
          `${p.first_name} ${p.last_name} ${p.email} ${p.member_code}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchTier =
          tierFilter === "all" || p.membership_tier === tierFilter;
        return matchSearch && matchTier;
      })
      .sort((a, b) => {
        // Platinum first, then gold, then founding, then committee
        const order: Record<MembershipTier, number> = {
          platinum_card: 0,
          gold_card: 1,
          founding_member: 2,
          committee_member: 3,
        };
        return order[a.membership_tier] - order[b.membership_tier];
      });
  }, [activeMembers, search, tierFilter]);

  const handleTierChange = async (profileId: string, newTier: MembershipTier) => {
    setUpdatingId(profileId);
    try {
      await updateDoc(doc(db, "profiles", profileId), {
        membership_tier: newTier,
      });
      toast("Membership tier updated", "success");
    } catch {
      toast("Failed to update tier", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-dark rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-dark border border-dark-border rounded-2xl p-6 animate-pulse"
            >
              <div className="h-8 w-20 bg-dark-border rounded mb-2" />
              <div className="h-4 w-28 bg-dark-border rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Billing & Revenue
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Estimated revenue from active memberships · Gold £5/mo · Platinum £15/mo
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#635BFF]/10 border border-[#635BFF]/30 text-[#635BFF] rounded-xl text-sm font-semibold hover:bg-[#635BFF]/20 transition-colors whitespace-nowrap"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
          Stripe Dashboard
        </a>
      </div>

      {/* Revenue KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark border border-dark-border rounded-2xl p-5 md:p-6">
          <div className="text-2xl md:text-3xl font-extrabold text-gold">
            £{mrr.toLocaleString()}
          </div>
          <div className="text-gray-400 text-xs md:text-sm font-medium mt-1">
            Monthly Revenue
          </div>
          <div className="text-gray-600 text-xs mt-0.5">estimated MRR</div>
        </div>

        <div className="bg-dark border border-dark-border rounded-2xl p-5 md:p-6">
          <div className="text-2xl md:text-3xl font-extrabold text-green-400">
            £{arr.toLocaleString()}
          </div>
          <div className="text-gray-400 text-xs md:text-sm font-medium mt-1">
            Annual Revenue
          </div>
          <div className="text-gray-600 text-xs mt-0.5">estimated ARR</div>
        </div>

        <div className="bg-dark border border-dark-border rounded-2xl p-5 md:p-6">
          <div className="text-2xl md:text-3xl font-extrabold text-gold">
            {goldCount}
          </div>
          <div className="text-gray-400 text-xs md:text-sm font-medium mt-1">
            Gold Card
          </div>
          <div className="text-gray-600 text-xs mt-0.5">
            £{(goldCount * 5).toLocaleString()}/mo
          </div>
        </div>

        <div className="bg-dark border border-dark-border rounded-2xl p-5 md:p-6">
          <div className="text-2xl md:text-3xl font-extrabold text-purple-400">
            {platinumCount}
          </div>
          <div className="text-gray-400 text-xs md:text-sm font-medium mt-1">
            Platinum Card
          </div>
          <div className="text-gray-600 text-xs mt-0.5">
            £{(platinumCount * 15).toLocaleString()}/mo
          </div>
        </div>
      </div>

      {/* MRR growth sparkline */}
      <div className="bg-dark border border-dark-border rounded-2xl p-5 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-semibold text-sm">New MRR Added</span>
          <span className="text-gray-500 text-xs">Last 30 days</span>
        </div>
        <p className="text-gray-500 text-xs mb-1">
          £{mrrSparkTotal}/mo new revenue from{" "}
          {mrrSparkline.filter((v) => v > 0).length} active day
          {mrrSparkline.filter((v) => v > 0).length !== 1 ? "s" : ""}
        </p>
        <Sparkline data={mrrSparkline} color="#C9A84C" />
        <div className="flex justify-between mt-1">
          <span className="text-gray-700 text-[10px]">30d ago</span>
          <span className="text-gray-700 text-[10px]">Today</span>
        </div>
      </div>

      {/* Tier breakdown */}
      <div className="bg-dark border border-dark-border rounded-2xl p-5 md:p-6 mb-6">
        <h2 className="text-white font-semibold text-sm mb-4">Membership Breakdown</h2>
        <div className="space-y-3">
          {[
            {
              tier: "platinum_card" as MembershipTier,
              count: platinumCount,
              price: 15,
              color: "bg-purple-400",
              barColor: "bg-purple-400",
            },
            {
              tier: "gold_card" as MembershipTier,
              count: goldCount,
              price: 5,
              color: "bg-gold",
              barColor: "bg-gold",
            },
            {
              tier: "founding_member" as MembershipTier,
              count: foundingCount,
              price: null,
              color: "bg-teal-400",
              barColor: "bg-teal-400",
            },
            {
              tier: "committee_member" as MembershipTier,
              count: committeeCount,
              price: 0,
              color: "bg-gray-500",
              barColor: "bg-gray-600",
            },
          ].map(({ tier, count, price, barColor }) => {
            const total = activeMembers.length || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={tier} className="flex items-center gap-3">
                <div className="w-32 text-gray-400 text-xs font-medium shrink-0">
                  {TIER_LABEL[tier]}
                </div>
                <div className="flex-1 bg-dark-border rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-8 text-right text-white text-xs font-bold shrink-0">
                  {count}
                </div>
                <div className="w-20 text-right text-gray-500 text-xs shrink-0">
                  {price === null
                    ? "custom"
                    : price === 0
                    ? "complimentary"
                    : `£${(count * price).toLocaleString()}/mo`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member table */}
      <div className="bg-dark border border-dark-border rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="p-4 md:p-5 border-b border-dark-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black border border-dark-border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/40"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
            className="px-3 py-2 bg-black border border-dark-border rounded-xl text-sm text-gray-300 focus:outline-none focus:border-gold/40"
          >
            <option value="all">All tiers</option>
            {ALL_TIERS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]}
              </option>
            ))}
          </select>
          <div className="flex items-center text-gray-500 text-sm shrink-0">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  Member
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  Code
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  Tier
                </th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium">
                  Monthly
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  Joined
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  Subscription
                </th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium">
                  Change Tier
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-gray-600 text-sm"
                  >
                    No members match your filters
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const price = TIER_PRICE[member.membership_tier];
                  return (
                    <tr
                      key={member.id}
                      className="border-b border-dark-border/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-white">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {member.email}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">
                        {member.member_code}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            TIER_BADGE[member.membership_tier]
                          }`}
                        >
                          {TIER_LABEL[member.membership_tier]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {price === null ? (
                          <span className="text-teal-400 text-xs font-medium">
                            custom
                          </span>
                        ) : price === 0 ? (
                          <span className="text-gray-500 text-xs">—</span>
                        ) : (
                          <span className="text-white font-semibold">
                            £{price}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {member.created_at
                          ? new Date(member.created_at).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "short", year: "numeric" }
                            )
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {member.subscription_status ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                SUB_STATUS_BADGE[member.subscription_status] ?? "bg-gray-500/15 text-gray-400"
                              }`}
                            >
                              {member.subscription_status === "past_due" ? "Past due" : member.subscription_status.charAt(0).toUpperCase() + member.subscription_status.slice(1)}
                            </span>
                            {member.current_period_end && (
                              <div className="text-gray-600 text-[10px]">
                                {member.subscription_status === "active" ? "Renews " : "Ended "}
                                {new Date(member.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </div>
                            )}
                            {member.stripe_customer_id && (
                              <a
                                href={`https://dashboard.stripe.com/customers/${member.stripe_customer_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#635BFF] text-[10px] hover:underline block"
                              >
                                View in Stripe ↗
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">No subscription</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          disabled={updatingId === member.id}
                          value={member.membership_tier}
                          onChange={(e) =>
                            handleTierChange(
                              member.id,
                              e.target.value as MembershipTier
                            )
                          }
                          className="px-2 py-1 bg-black border border-dark-border rounded-lg text-xs text-gray-300 focus:outline-none focus:border-gold/40 disabled:opacity-40"
                        >
                          {ALL_TIERS.map((t) => (
                            <option key={t} value={t}>
                              {TIER_LABEL[t]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-dark-border">
          {filteredMembers.length === 0 ? (
            <p className="text-center py-12 text-gray-600 text-sm">
              No members match your filters
            </p>
          ) : (
            filteredMembers.map((member) => {
              const price = TIER_PRICE[member.membership_tier];
              return (
                <div key={member.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-gray-500 text-xs">{member.email}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        TIER_BADGE[member.membership_tier]
                      }`}
                    >
                      {TIER_LABEL[member.membership_tier]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-mono">
                      {member.member_code}
                    </span>
                    <span className="text-white font-semibold text-sm">
                      {price === null
                        ? "custom pricing"
                        : price === 0
                        ? "complimentary"
                        : `£${price}/mo`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-gray-600 text-xs">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" }
                          )
                        : "—"}
                    </span>
                    <select
                      disabled={updatingId === member.id}
                      value={member.membership_tier}
                      onChange={(e) =>
                        handleTierChange(
                          member.id,
                          e.target.value as MembershipTier
                        )
                      }
                      className="px-2 py-1 bg-black border border-dark-border rounded-lg text-xs text-gray-300 focus:outline-none focus:border-gold/40 disabled:opacity-40"
                    >
                      {ALL_TIERS.map((t) => (
                        <option key={t} value={t}>
                          {TIER_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-dark border border-dark-border rounded-2xl overflow-hidden mt-6">
        <div className="p-4 md:p-5 border-b border-dark-border flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-sm">Recent Transactions</h2>
            <p className="text-gray-500 text-xs mt-0.5">Last 50 payments via Stripe webhook</p>
          </div>
          <span className="text-gray-500 text-xs">{payments.length} record{payments.length !== 1 ? "s" : ""}</span>
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center text-gray-600 text-sm">
            No transactions yet — new payments will appear here automatically
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Member</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Tier</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Amount</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-dark-border/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-white">{p.user_name ?? "—"}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{p.email ?? "—"}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.membership_tier ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${TIER_BADGE[p.membership_tier]}`}>
                            {TIER_LABEL[p.membership_tier]}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white">
                        £{(p.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.status === "succeeded"
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                        }`}>
                          {p.status === "succeeded" ? "Succeeded" : "Failed"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {new Date(p.created_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.stripe_invoice_id ? (
                          <a
                            href={`https://dashboard.stripe.com/invoices/${p.stripe_invoice_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#635BFF] text-xs hover:underline"
                          >
                            {p.stripe_invoice_id.slice(-8)} ↗
                          </a>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-dark-border">
              {payments.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{p.user_name ?? "—"}</p>
                      <p className="text-gray-500 text-xs">{p.email ?? "—"}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.status === "succeeded"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-red-500/15 text-red-400"
                    }`}>
                      {p.status === "succeeded" ? "Succeeded" : "Failed"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">
                      {new Date(p.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className="text-white font-semibold text-sm">
                      £{(p.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  {p.membership_tier && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${TIER_BADGE[p.membership_tier]}`}>
                      {TIER_LABEL[p.membership_tier]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-gray-700 text-xs mt-4 text-center">
        Revenue figures are estimates based on membership tiers. Transaction history is recorded from webhook events going forward.
      </p>
    </div>
  );
}
