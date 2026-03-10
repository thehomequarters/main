import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

interface ProfileStub {
  membership_status: string;
  created_at: string;
}

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

export default function Dashboard() {
  const [profiles, setProfiles] = useState<ProfileStub[]>([]);
  const [activeVenues, setActiveVenues] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalRedemptions, setTotalRedemptions] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalConnections, setTotalConnections] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let resolved = 0;
    const total = 7;
    const done = () => {
      resolved++;
      if (resolved >= total) setLoading(false);
    };

    const unsubs = [
      onSnapshot(collection(db, "profiles"), (snap) => {
        setProfiles(snap.docs.map((d) => d.data() as ProfileStub));
        done();
      }),
      onSnapshot(
        query(collection(db, "venues"), where("is_active", "==", true)),
        (snap) => { setActiveVenues(snap.size); done(); }
      ),
      onSnapshot(collection(db, "events"), (snap) => { setTotalEvents(snap.size); done(); }),
      onSnapshot(collection(db, "bookings"), (snap) => { setTotalBookings(snap.size); done(); }),
      onSnapshot(collection(db, "redemptions"), (snap) => { setTotalRedemptions(snap.size); done(); }),
      onSnapshot(collection(db, "posts"), (snap) => { setTotalPosts(snap.size); done(); }),
      onSnapshot(collection(db, "connections"), (snap) => { setTotalConnections(snap.size); done(); }),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);

  const totalMembers = profiles.filter((p) => p.membership_status === "active").length;
  const pendingApplications = profiles.filter((p) => p.membership_status === "pending").length;
  const acceptedMembers = profiles.filter((p) => p.membership_status === "accepted").length;

  // 30-day new member sparkline
  const sparkSeries = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      const dayStr = d.toISOString().slice(0, 10);
      return profiles.filter(
        (p) => p.created_at?.slice(0, 10) === dayStr
      ).length;
    });
  }, [profiles]);

  const sparkTotal = sparkSeries.reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-dark rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-dark border border-dark-border rounded-2xl p-6 animate-pulse"
            >
              <div className="h-8 w-16 bg-dark-border rounded mb-2" />
              <div className="h-4 w-24 bg-dark-border rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const STAT_CARDS = [
    {
      label: "Active Members",
      value: totalMembers,
      color: "text-gold",
      stroke: "#C9A84C",
      bg: "bg-gold-light",
      spark: true,
    },
    {
      label: "Pending Applications",
      value: pendingApplications,
      color: "text-amber-400",
      stroke: "#fbbf24",
      bg: "bg-amber-400/10",
      highlight: pendingApplications > 0,
    },
    {
      label: "Grace Period",
      value: acceptedMembers,
      color: "text-orange-400",
      stroke: "#fb923c",
      bg: "bg-orange-400/10",
    },
    {
      label: "Partner Venues",
      value: activeVenues,
      color: "text-teal-400",
      stroke: "#2dd4bf",
      bg: "bg-teal-400/10",
    },
    {
      label: "Events",
      value: totalEvents,
      color: "text-purple-400",
      stroke: "#c084fc",
      bg: "bg-purple-400/10",
    },
    {
      label: "Event Bookings",
      value: totalBookings,
      color: "text-blue-400",
      stroke: "#60a5fa",
      bg: "bg-blue-400/10",
    },
    {
      label: "Redemptions",
      value: totalRedemptions,
      color: "text-green-400",
      stroke: "#4ade80",
      bg: "bg-green-400/10",
    },
    {
      label: "Community Posts",
      value: totalPosts,
      color: "text-rose-400",
      stroke: "#fb7185",
      bg: "bg-rose-400/10",
    },
    {
      label: "Connections Made",
      value: totalConnections,
      color: "text-indigo-400",
      stroke: "#818cf8",
      bg: "bg-indigo-400/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          HomeQuarters · live overview
        </p>
      </div>

      {/* Member growth chart */}
      <div className="bg-dark border border-dark-border rounded-2xl p-5 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-semibold text-sm">Member Growth</span>
          <span className="text-gray-500 text-xs">Last 30 days</span>
        </div>
        <p className="text-gray-500 text-xs mb-1">
          {sparkTotal} new sign-up{sparkTotal !== 1 ? "s" : ""} · {profiles.length} total accounts
        </p>
        <Sparkline data={sparkSeries} color="#C9A84C" />
        <div className="flex justify-between mt-1">
          <span className="text-gray-700 text-[10px]">30d ago</span>
          <span className="text-gray-700 text-[10px]">Today</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className={`bg-dark border rounded-2xl p-5 md:p-6 ${
              card.highlight ? "border-amber-400/30" : "border-dark-border"
            }`}
          >
            <div className={`text-2xl md:text-3xl font-extrabold ${card.color}`}>
              {card.value}
            </div>
            <div className="text-gray-400 text-xs md:text-sm font-medium mt-1">
              {card.label}
            </div>
            {card.highlight && (
              <div className="mt-2 inline-flex items-center gap-1 bg-amber-400/10 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Needs review
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
