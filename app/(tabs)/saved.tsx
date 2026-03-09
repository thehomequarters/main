import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/constants/theme";
import type { Venue, Deal } from "@/lib/database.types";
import { VenueCard } from "@/components/VenueCard";
import { Ionicons } from "@expo/vector-icons";

interface VenueWithDeal extends Venue {
  deals: Deal[];
}

export default function SavedTab() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [savedVenues, setSavedVenues] = useState<VenueWithDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isGrace = profile?.membership_status === "accepted";

  const fetchSaved = useCallback(async () => {
    if (!user?.uid) { setLoading(false); return; }
    try {
      const likesSnap = await getDocs(
        query(collection(db, "venue_likes"), where("member_id", "==", user.uid))
      );
      const venueIds = likesSnap.docs.map((d) => d.data().venue_id as string);

      if (venueIds.length === 0) {
        setSavedVenues([]);
        return;
      }

      const venueList: VenueWithDeal[] = [];
      for (const vid of venueIds) {
        const venueSnap = await getDoc(doc(db, "venues", vid));
        if (!venueSnap.exists()) continue;
        const venueData = { id: venueSnap.id, ...venueSnap.data() } as Venue;
        if (!venueData.is_active) continue;

        const dealsSnap = await getDocs(
          query(
            collection(db, "deals"),
            where("venue_id", "==", vid),
            where("is_active", "==", true)
          )
        );
        const deals = dealsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deal);
        venueList.push({ ...venueData, deals });
      }

      setSavedVenues(venueList);
    } catch (e: any) {
      console.warn("Saved venues load error:", e?.message ?? e);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSaved();
    setRefreshing(false);
  }, [fetchSaved]);

  const handleUnlike = useCallback((venueId: string) => {
    setSavedVenues((prev) => prev.filter((v) => v.id !== venueId));
  }, []);

  return (
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
      {/* Header */}
      <View style={{ paddingTop: 66, paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text
          style={{
            color: colors.ink,
            fontSize: 38,
            fontFamily: fonts.display,
            lineHeight: 44,
          }}
        >
          Saved
        </Text>
        <Text
          style={{
            color: colors.stone,
            fontSize: 14,
            fontFamily: fonts.body,
            marginTop: 4,
          }}
        >
          {savedVenues.length > 0
            ? `${savedVenues.length} saved venue${savedVenues.length === 1 ? "" : "s"}`
            : "Your saved venues will appear here"}
        </Text>
      </View>

      {/* Content */}
      <View style={{ paddingHorizontal: 20 }}>
        {loading ? null : savedVenues.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60, gap: 16 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.sand,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="heart-outline" size={32} color={colors.stone} />
            </View>
            <Text
              style={{
                color: colors.ink,
                fontSize: 17,
                fontFamily: fonts.semibold,
                textAlign: "center",
              }}
            >
              No saved venues yet
            </Text>
            <Text
              style={{
                color: colors.stone,
                fontSize: 14,
                fontFamily: fonts.body,
                textAlign: "center",
                lineHeight: 20,
                paddingHorizontal: 20,
              }}
            >
              Tap the heart on any venue to save it here for easy access.
            </Text>
          </View>
        ) : (
          savedVenues.map((venue) => (
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
              initialLiked
              onLikeChange={(liked) => {
                if (!liked) handleUnlike(venue.id);
              }}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
