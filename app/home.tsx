import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";
import type { VenueCategory } from "@/constants/theme";
import type { Venue, Deal } from "@/lib/database.types";
import { MembershipCard } from "@/components/MembershipCard";
import { VenueCard } from "@/components/VenueCard";
import { CategoryPills } from "@/components/CategoryPills";
import { SkeletonLoader } from "@/components/SkeletonLoader";

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

  const fetchVenues = useCallback(async () => {
    const { data } = await supabase
      .from("venues")
      .select("*, deals(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) {
      setVenues(data as VenueWithDeal[]);
    }
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

        {filteredVenues.length === 0 && (
          <Text
            style={{
              color: colors.grey,
              fontSize: 14,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No venues available yet.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
