import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

interface Stats {
  totalMembers: number;
  pendingApplications: number;
  activeVenues: number;
  totalEvents: number;
  totalBookings: number;
  totalRedemptions: number;
  totalPosts: number;
  totalConnections: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          profilesSnap,
          pendingSnap,
          venuesSnap,
          eventsSnap,
          bookingsSnap,
          redemptionsSnap,
          postsSnap,
          connectionsSnap,
        ] = await Promise.all([
          getDocs(
            query(
              collection(db, "profiles"),
              where("membership_status", "==", "active")
            )
          ),
          getDocs(
            query(
              collection(db, "profiles"),
              where("membership_status", "==", "pending")
            )
          ),
          getDocs(
            query(collection(db, "venues"), where("is_active", "==", true))
          ),
          getDocs(collection(db, "events")),
          getDocs(collection(db, "bookings")),
          getDocs(collection(db, "redemptions")),
          getDocs(collection(db, "posts")),
          getDocs(collection(db, "connections")),
        ]);

        setStats({
          totalMembers: profilesSnap.size,
          pendingApplications: pendingSnap.size,
          activeVenues: venuesSnap.size,
          totalEvents: eventsSnap.size,
          totalBookings: bookingsSnap.size,
          totalRedemptions: redemptionsSnap.size,
          totalPosts: postsSnap.size,
          totalConnections: connectionsSnap.size,
        });
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
      value: stats?.totalMembers ?? 0,
      color: "text-gold",
      bg: "bg-gold-light",
    },
    {
      label: "Pending Applications",
      value: stats?.pendingApplications ?? 0,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      highlight: (stats?.pendingApplications ?? 0) > 0,
    },
    {
      label: "Partner Venues",
      value: stats?.activeVenues ?? 0,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
    },
    {
      label: "Events",
      value: stats?.totalEvents ?? 0,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Event Bookings",
      value: stats?.totalBookings ?? 0,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Redemptions",
      value: stats?.totalRedemptions ?? 0,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Community Posts",
      value: stats?.totalPosts ?? 0,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
    },
    {
      label: "Connections Made",
      value: stats?.totalConnections ?? 0,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          HomeQuarters overview at a glance
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className={`bg-dark border rounded-2xl p-5 md:p-6 ${
              card.highlight
                ? "border-amber-400/30"
                : "border-dark-border"
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
