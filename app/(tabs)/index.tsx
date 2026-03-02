import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import type { Venue, Deal, HQEvent } from "@/lib/database.types";
import { MembershipCard } from "@/components/MembershipCard";
import { VenueCard } from "@/components/VenueCard";
import { EventCard } from "@/components/EventCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { seedDatabase } from "@/lib/seed";
import { Ionicons } from "@expo/vector-icons";

interface VenueWithDeal extends Venue {
  deals: Deal[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeTab() {
  const { profile } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<VenueWithDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<HQEvent[]>([]);

  const fetchVenues = useCallback(async () => {
    const venuesQuery = query(
      collection(db, "venues"),
      where("is_active", "==", true)
    );
    const venuesSnap = await getDocs(venuesQuery);
    const venueList: VenueWithDeal[] = [];

    for (const venueDoc of venuesSnap.docs) {
      const venueData = { id: venueDoc.id, ...venueDoc.data() } as Venue;
      const dealsQuery = query(
        collection(db, "deals"),
        where("venue_id", "==", venueDoc.id),
        where("is_active", "==", true)
      );
      const dealsSnap = await getDocs(dealsQuery);
      const deals = dealsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Deal
      );
      venueList.push({ ...venueData, deals });
    }

    venueList.sort(
      (a, b) => (b.created_at || "").localeCompare(a.created_at || "")
    );
    setVenues(venueList);

    // Fetch upcoming events from Firestore
    const eventsQuery = query(
      collection(db, "events"),
      where("is_active", "==", true)
    );
    const eventsSnap = await getDocs(eventsQuery);
    const eventList = eventsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as HQEvent)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
    setUpcomingEvents(eventList);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVenues();
    setRefreshing(false);
  }, [fetchVenues]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedDatabase();
      Alert.alert("Done", `Added ${count} venues with deals, events, posts & groups.`);
      await fetchVenues();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSeeding(false);
    }
  };

  const featuredVenues = venues.slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.black,
          paddingTop: 80,
          paddingHorizontal: 20,
        }}
      >
        <SkeletonLoader width="60%" height={24} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="40%" height={16} style={{ marginBottom: 32 }} />
        <SkeletonLoader
          width="100%"
          height={200}
          borderRadius={16}
          style={{ marginBottom: 32 }}
        />
        <SkeletonLoader width="30%" height={18} style={{ marginBottom: 16 }} />
        <SkeletonLoader
          width="100%"
          height={180}
          borderRadius={12}
          style={{ marginBottom: 16 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.gold}
        />
      }
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 66,
          paddingHorizontal: 20,
          paddingBottom: 6,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View>
          <Text
            style={{
              color: colors.grey,
              fontSize: 13,
              fontWeight: "400",
              marginBottom: 4,
              letterSpacing: 0.5,
            }}
          >
            {getGreeting()}
          </Text>
          <Text
            style={{
              color: colors.white,
              fontSize: 26,
              fontWeight: "700",
              letterSpacing: 0.3,
            }}
          >
            {profile?.first_name}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 }}>
          {/* Notifications bell */}
          <Pressable
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colors.dark,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.white} />
          </Pressable>

          {/* Profile avatar */}
          <Pressable
            onPress={() => router.push("/profile")}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(201, 168, 76, 0.15)",
              borderWidth: 1,
              borderColor: "rgba(201, 168, 76, 0.3)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.gold,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              {(profile?.first_name?.[0] ?? "")}
              {(profile?.last_name?.[0] ?? "")}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Membership Card */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 32 }}>
        <MembershipCard
          firstName={profile?.first_name ?? ""}
          lastName={profile?.last_name ?? ""}
          memberCode={profile?.member_code ?? ""}
          status={profile?.membership_status ?? "pending"}
        />
      </View>

      {/* Quick Actions */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          gap: 12,
          marginBottom: 32,
        }}
      >
        {[
          { icon: "qr-code-outline" as const, label: "QR Code", route: "/qr" },
          { icon: "calendar-outline" as const, label: "Book Event", route: "/(tabs)/events" },
          { icon: "people-outline" as const, label: "Connect", route: "/(tabs)/connect" },
          { icon: "compass-outline" as const, label: "Discover", route: "/(tabs)/discover" },
        ].map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.route as any)}
            style={{
              flex: 1,
              backgroundColor: colors.dark,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              paddingVertical: 14,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons name={action.icon} size={20} color={colors.gold} />
            <Text
              style={{
                color: colors.grey,
                fontSize: 10,
                fontWeight: "600",
                letterSpacing: 0.3,
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <View style={{ marginBottom: 32 }}>
          <SectionHeader
            title="Upcoming Events"
            actionLabel="See All"
            onAction={() => router.push("/(tabs)/events" as any)}
          />
          <FlatList
            horizontal
            data={upcomingEvents}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <EventCard event={item} variant="compact" />
            )}
          />
        </View>
      )}

      {/* Featured Venues */}
      {featuredVenues.length > 0 && (
        <View style={{ marginBottom: 32 }}>
          <SectionHeader title="Featured Venues" actionLabel="See All" />
          <FlatList
            horizontal
            data={featuredVenues}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <VenueCard
                name={item.name}
                category={item.category}
                imageUrl={item.image_url}
                dealHeadline={item.deals?.[0]?.title}
                onPress={() => router.push(`/venue/${item.id}`)}
                variant="featured"
              />
            )}
          />
        </View>
      )}

      {/* All Venues */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text
          style={{
            color: colors.white,
            fontSize: 20,
            fontWeight: "700",
            letterSpacing: 0.3,
            marginBottom: 16,
          }}
        >
          All Venues
        </Text>
        {venues.map((venue) => (
          <VenueCard
            key={venue.id}
            name={venue.name}
            category={venue.category}
            imageUrl={venue.image_url}
            dealHeadline={venue.deals?.[0]?.title}
            onPress={() => router.push(`/venue/${venue.id}`)}
            variant="list"
          />
        ))}

        {venues.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40, gap: 16 }}>
            <Text
              style={{
                color: colors.grey,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              No data yet. Load sample venues, events, posts & groups.
            </Text>
            <Pressable
              onPress={handleSeed}
              disabled={seeding}
              style={{
                backgroundColor: colors.gold,
                borderRadius: 10,
                paddingVertical: 14,
                paddingHorizontal: 32,
                opacity: seeding ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  color: colors.black,
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                {seeding ? "Loading data..." : "Load Sample Data"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
