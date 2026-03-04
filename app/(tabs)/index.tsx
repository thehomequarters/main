import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
  Image,
  Dimensions,
  Modal,
  TextInput,
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
import { colors, fonts } from "@/constants/theme";
import type { Venue, Deal, HQEvent } from "@/lib/database.types";
import { MembershipCard } from "@/components/MembershipCard";
import { VenueCard } from "@/components/VenueCard";
import { EventCard } from "@/components/EventCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { GraceBanner } from "@/components/GraceBanner";
import { PaywallSheet } from "@/components/PaywallSheet";
import { Ionicons } from "@expo/vector-icons";

interface VenueWithDeal extends Venue {
  deals: Deal[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORY_PILLS = [
  { key: "venues",  label: "Venues",  icon: "storefront-outline" as const },
  { key: "events",  label: "Events",  icon: "calendar-outline" as const },
  { key: "members", label: "Members", icon: "people-outline" as const },
];

function getGreetingPrefix(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeTab() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<VenueWithDeal[]>([]);
  const [likedVenueIds, setLikedVenueIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<HQEvent[]>([]);
  const [allEvents, setAllEvents] = useState<HQEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState("venues");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paywallVisible, setPaywallVisible] = useState(false);

  const isGrace = profile?.membership_status === "accepted";

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
        .sort((a, b) => a.date.localeCompare(b.date));
      setAllEvents(eventList);
      setUpcomingEvents(eventList.slice(0, 4));

      // Load liked venues for current user
      if (user?.uid) {
        const likesSnap = await getDocs(
          query(collection(db, "venue_likes"), where("member_id", "==", user.uid))
        );
        setLikedVenueIds(new Set(likesSnap.docs.map((d) => d.data().venue_id as string)));
      }
    } catch (e: any) {
      console.warn("Home screen load error:", e?.message ?? e);
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

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery, venues]);

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
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingBottom: 100 }}
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
          <Pressable
            onPress={() => router.push("/(tabs)/account" as any)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.sand,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.dark, fontSize: 12, fontFamily: fonts.semibold, letterSpacing: 0.5 }}>
              {(profile?.first_name?.[0] ?? "")}
              {(profile?.last_name?.[0] ?? "")}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <Pressable onPress={() => setSearchVisible(true)} hitSlop={10}>
              <Ionicons name="search-outline" size={22} color={colors.dark} />
            </Pressable>
            <Pressable onPress={() => router.push("/notifications")} hitSlop={10}>
              <Ionicons name="notifications-outline" size={22} color={colors.dark} />
            </Pressable>
          </View>
        </View>

        {/* Greeting */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 24 }}>
          <Text
            style={{
              color: colors.ink,
              fontSize: 38,
              fontFamily: fonts.display,
              lineHeight: 44,
            }}
          >
            {getGreetingPrefix()}{profile?.first_name ? (
              <Text style={{ fontFamily: fonts.displayItalic }}>
                {`, ${profile.first_name}`}
              </Text>
            ) : ""}
          </Text>
        </View>

        {/* Grace period banner */}
        <GraceBanner />

        {/* Category tabs — text only, editorial */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 0, marginBottom: 32, marginTop: 0 }}
        >
          {CATEGORY_PILLS.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => {
                  if (cat.key === "members") {
                    router.push("/(tabs)/discover" as any);
                  } else {
                    setActiveCategory(cat.key);
                  }
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: isActive ? colors.ink : "transparent",
                  marginRight: 4,
                }}
              >
                <Text
                  style={{
                    color: isActive ? colors.ink : colors.stone,
                    fontSize: 13,
                    fontFamily: isActive ? fonts.semibold : fonts.body,
                    letterSpacing: isActive ? 0.3 : 0,
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Venues content ── */}
        {activeCategory === "venues" && (
          <>
            {/* Membership Card */}
            <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
              <MembershipCard
                firstName={profile?.first_name ?? ""}
                lastName={profile?.last_name ?? ""}
                memberCode={profile?.member_code ?? ""}
                status={profile?.membership_status ?? "pending"}
                tier={profile?.membership_tier}
                acceptedAt={profile?.accepted_at}
              />
            </View>

            {/* Upcoming Events preview */}
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
                    <EventCard
                      event={item}
                      variant="compact"
                      onPress={isGrace ? () => setPaywallVisible(true) : undefined}
                    />
                  )}
                />
              </View>
            )}

            {/* All Venues */}
            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{
                  color: colors.stone,
                  fontSize: 10,
                  fontFamily: fonts.semibold,
                  textTransform: "uppercase",
                  letterSpacing: 2.5,
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
                  dealHeadline={
                    venue.deals?.[0]?.title
                      ? isGrace
                        ? "🔒 Members deal"
                        : venue.deals[0].title
                      : undefined
                  }
                  tags={venue.tags}
                  onPress={() => router.push(`/venue/${venue.id}`)}
                  variant="list"
                  venueId={venue.id}
                  initialLiked={likedVenueIds.has(venue.id)}
                />
              ))}
              {venues.length === 0 && (
                <View style={{ alignItems: "center", marginTop: 40, gap: 12 }}>
                  <Ionicons name="storefront-outline" size={48} color={colors.border} />
                  <Text style={{ color: colors.stone, fontSize: 14, textAlign: "center", paddingHorizontal: 20 }}>
                    Partner venues are being added. Check back soon!
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Events content ── */}
        {activeCategory === "events" && (
          <View style={{ paddingHorizontal: 20 }}>
            <SectionHeader
              title="Upcoming Events"
              actionLabel="See All"
              onAction={() => router.push("/(tabs)/events" as any)}
            />
            {allEvents.length > 0 ? (
              allEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="full"
                  onPress={
                    isGrace
                      ? () => setPaywallVisible(true)
                      : () => router.push(`/event/${event.id}` as any)
                  }
                />
              ))
            ) : (
              <View style={{ alignItems: "center", marginTop: 40, gap: 12 }}>
                <Ionicons name="calendar-outline" size={48} color={colors.border} />
                <Text style={{ color: colors.stone, fontSize: 14, textAlign: "center", paddingHorizontal: 20 }}>
                  No upcoming events. Check back soon!
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Events paywall for grace users */}
      <PaywallSheet
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        featureTitle="Unlock Events"
        featureDescription="Active members can RSVP and book spots at exclusive HomeQuarters events. Activate your membership to get access."
      />

      {/* Search Modal */}
      <Modal
        visible={searchVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSearchVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {/* Search header */}
          <View
            style={{
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 10,
              }}
            >
              <Ionicons name="search-outline" size={18} color={colors.stone} />
              <TextInput
                autoFocus
                placeholder="Search venues, categories, tags..."
                placeholderTextColor={colors.stone}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, color: colors.dark, fontSize: 15 }}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.stone} />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => { setSearchVisible(false); setSearchQuery(""); }}
            >
              <Text style={{ color: colors.dark, fontSize: 15, fontWeight: "600" }}>
                Cancel
              </Text>
            </Pressable>
          </View>

          {/* Results */}
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {searchQuery.trim() === "" ? (
              <Text style={{ color: colors.stone, fontSize: 14, textAlign: "center", marginTop: 32 }}>
                Start typing to search venues…
              </Text>
            ) : searchResults.length === 0 ? (
              <Text style={{ color: colors.stone, fontSize: 14, textAlign: "center", marginTop: 32 }}>
                No venues found for "{searchQuery}"
              </Text>
            ) : (
              searchResults.map((venue) => (
                <Pressable
                  key={venue.id}
                  onPress={() => {
                    setSearchVisible(false);
                    setSearchQuery("");
                    router.push(`/venue/${venue.id}`);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    backgroundColor: colors.white,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 14,
                  }}
                >
                  {/* Thumbnail */}
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      overflow: "hidden",
                      backgroundColor: colors.sand,
                    }}
                  >
                    <Image
                      source={{
                        uri:
                          venue.image_url ??
                          `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=60`,
                      }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.dark, fontSize: 15, fontWeight: "600" }}>
                      {venue.name}
                    </Text>
                    <Text style={{ color: colors.stone, fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>
                      {venue.category} · {venue.city}
                    </Text>
                    {(venue.tags?.length ?? 0) > 0 && (
                      <Text style={{ color: colors.stone, fontSize: 11, marginTop: 2 }}>
                        {venue.tags!.slice(0, 3).join(" · ")}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.border} />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
