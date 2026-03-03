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
import { Ionicons } from "@expo/vector-icons";

interface VenueWithDeal extends Venue {
  deals: Deal[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORY_PILLS = [
  { key: "venues", label: "Venues", icon: "storefront-outline" as const },
  { key: "events", label: "Events", icon: "calendar-outline" as const },
  { key: "members", label: "Members", icon: "people-outline" as const },
];

export default function HomeTab() {
  const { profile } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<VenueWithDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<HQEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState("venues");

  const fetchVenues = useCallback(async () => {
    try {
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
    } catch (e: any) {
      Alert.alert("Error", "Could not load data. Pull down to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVenues();
    setRefreshing(false);
  }, [fetchVenues]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
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
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.stone}
        />
      }
    >
      {/* Top row: Avatar left, search + bell right */}
      <View
        style={{
          paddingTop: 66,
          paddingHorizontal: 20,
          paddingBottom: 6,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Avatar circle */}
        <Pressable
          onPress={() => router.push("/profile")}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.sand,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.dark,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            {(profile?.first_name?.[0] ?? "")}
            {(profile?.last_name?.[0] ?? "")}
          </Text>
        </Pressable>

        {/* Right icons */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: colors.white,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: colors.dark,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Ionicons name="search-outline" size={20} color={colors.dark} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/notifications")}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: colors.white,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: colors.dark,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.dark} />
          </Pressable>
        </View>
      </View>

      {/* Large bold heading */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 24 }}>
        <Text
          style={{
            color: colors.dark,
            fontSize: 34,
            fontWeight: "800",
            lineHeight: 40,
            letterSpacing: -0.5,
          }}
        >
          {"Discover Your\nCity, Members &\nMore"}
        </Text>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 10,
          marginBottom: 28,
        }}
      >
        {CATEGORY_PILLS.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setActiveCategory(cat.key)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 24,
                backgroundColor: isActive ? colors.dark : colors.white,
                borderWidth: isActive ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name={cat.icon}
                size={15}
                color={isActive ? colors.white : colors.dark}
              />
              <Text
                style={{
                  color: isActive ? colors.white : colors.dark,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Membership Card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
        <MembershipCard
          firstName={profile?.first_name ?? ""}
          lastName={profile?.last_name ?? ""}
          memberCode={profile?.member_code ?? ""}
          status={profile?.membership_status ?? "pending"}
          showReflection={false}
        />
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

      {/* All Venues */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text
          style={{
            color: colors.dark,
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
          <View style={{ alignItems: "center", marginTop: 40, gap: 12 }}>
            <Ionicons
              name="storefront-outline"
              size={48}
              color={colors.border}
            />
            <Text
              style={{
                color: colors.stone,
                fontSize: 14,
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              Partner venues are being added. Check back soon!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
