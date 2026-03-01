import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
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
import type { VenueCategory } from "@/constants/theme";
import type { Venue, Deal } from "@/lib/database.types";
import { MembershipCard } from "@/components/MembershipCard";
import { VenueCard } from "@/components/VenueCard";
import { CategoryPills } from "@/components/CategoryPills";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { seedDatabase } from "@/lib/seed";

interface VenueWithDeal extends Venue {
  deals: Deal[];
}

export default function HomeScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [venues, setVenues] = useState<VenueWithDeal[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<VenueCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchVenues = useCallback(async () => {
    // Fetch active venues, sort client-side to avoid composite index
    const venuesQuery = query(
      collection(db, "venues"),
      where("is_active", "==", true)
    );
    const venuesSnap = await getDocs(venuesQuery);
    const venueList: VenueWithDeal[] = [];

    for (const venueDoc of venuesSnap.docs) {
      const venueData = { id: venueDoc.id, ...venueDoc.data() } as Venue;

      // Fetch deals for this venue
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

    venueList.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    setVenues(venueList);
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
      Alert.alert("Done", `Added ${count} venues with deals.`);
      await fetchVenues();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSeeding(false);
    }
  };

  const featuredVenues = venues.slice(0, 5);
  const filteredVenues = selectedCategory
    ? venues.filter((v) => v.category === selectedCategory)
    : venues;

  const navigateToVenue = (venueId: string) => {
    router.push(`/venue/${venueId}`);
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
        <SkeletonLoader width="50%" height={20} style={{ marginBottom: 24 }} />
        <SkeletonLoader
          width="100%"
          height={180}
          borderRadius={16}
          style={{ marginBottom: 32 }}
        />
        <SkeletonLoader
          width="40%"
          height={16}
          style={{ marginBottom: 16 }}
        />
        <SkeletonLoader
          width="100%"
          height={200}
          borderRadius={12}
          style={{ marginBottom: 16 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 40 }}
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
          paddingTop: 70,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: colors.white,
            fontSize: 18,
            fontWeight: "400",
          }}
        >
          Welcome, {profile?.first_name}.
        </Text>
        <Pressable onPress={signOut}>
          <Text style={{ color: colors.grey, fontSize: 13 }}>Sign Out</Text>
        </Pressable>
      </View>

      {/* Membership Card */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 36 }}>
        <MembershipCard
          firstName={profile?.first_name ?? ""}
          lastName={profile?.last_name ?? ""}
          memberCode={profile?.member_code ?? ""}
          status={profile?.membership_status ?? "pending"}
        />
      </View>

      {/* Featured Section */}
      {featuredVenues.length > 0 && (
        <View style={{ marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              Featured
            </Text>
            <Pressable onPress={() => setSelectedCategory(null)}>
              <Text style={{ color: colors.gold, fontSize: 13 }}>See All</Text>
            </Pressable>
          </View>

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
                onPress={() => navigateToVenue(item.id)}
                variant="featured"
              />
            )}
          />
        </View>
      )}

      {/* Categories */}
      <View style={{ marginBottom: 24 }}>
        <CategoryPills
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>

      {/* Venue List */}
      <View style={{ paddingHorizontal: 20 }}>
        {filteredVenues.map((venue) => (
          <VenueCard
            key={venue.id}
            name={venue.name}
            category={venue.category}
            imageUrl={venue.image_url}
            dealHeadline={venue.deals?.[0]?.title}
            onPress={() => navigateToVenue(venue.id)}
            variant="list"
          />
        ))}

        {filteredVenues.length === 0 && venues.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40, gap: 16 }}>
            <Text
              style={{
                color: colors.grey,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              No venues yet. Load sample data to get started.
            </Text>
            <Pressable
              onPress={handleSeed}
              disabled={seeding}
              style={({ pressed }) => ({
                backgroundColor: colors.gold,
                borderRadius: 10,
                paddingVertical: 14,
                paddingHorizontal: 32,
                opacity: seeding ? 0.6 : pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  color: colors.black,
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                {seeding ? "Loading venues..." : "Load Sample Venues"}
              </Text>
            </Pressable>
          </View>
        )}
        {filteredVenues.length === 0 && venues.length > 0 && (
          <Text
            style={{
              color: colors.grey,
              fontSize: 14,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No venues in this category.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
