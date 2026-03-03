import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import type { Redemption, Venue, Deal } from "@/lib/database.types";

type EnrichedRedemption = Redemption & {
  venue_name: string;
  deal_title: string;
};

export default function RedemptionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [redemptions, setRedemptions] = useState<EnrichedRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRedemptions = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const redemptionsQuery = query(
        collection(db, "redemptions"),
        where("member_id", "==", user.uid)
      );
      const redemptionsSnap = await getDocs(redemptionsQuery);
      const redemptionList = redemptionsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Redemption
      );

      const venuesSnap = await getDocs(collection(db, "venues"));
      const venuesMap: Record<string, string> = {};
      venuesSnap.docs.forEach((d) => {
        venuesMap[d.id] = (d.data() as Venue).name;
      });

      const dealsSnap = await getDocs(collection(db, "deals"));
      const dealsMap: Record<string, string> = {};
      dealsSnap.docs.forEach((d) => {
        dealsMap[d.id] = (d.data() as Deal).title;
      });

      const enriched: EnrichedRedemption[] = redemptionList
        .map((r) => ({
          ...r,
          venue_name: venuesMap[r.venue_id] ?? "Unknown Venue",
          deal_title: dealsMap[r.deal_id] ?? "Unknown Deal",
        }))
        .sort(
          (a, b) =>
            new Date(b.redeemed_at).getTime() -
            new Date(a.redeemed_at).getTime()
        );

      setRedemptions(enriched);
    } catch (e: any) {
      Alert.alert("Error", "Could not load redemption history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchRedemptions();
  }, [fetchRedemptions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRedemptions();
    setRefreshing(false);
  }, [fetchRedemptions]);

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.stone}
        />
      }
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.dark,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </Pressable>
        <View>
          <Text
            style={{
              color: colors.white,
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            Redemption History
          </Text>
          <Text style={{ color: colors.grey, fontSize: 13, marginTop: 2 }}>
            {redemptions.length} deal{redemptions.length !== 1 ? "s" : ""}{" "}
            redeemed
          </Text>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 14 }}>
          <SkeletonLoader width="100%" height={90} borderRadius={16} />
          <SkeletonLoader width="100%" height={90} borderRadius={16} />
          <SkeletonLoader width="100%" height={90} borderRadius={16} />
        </View>
      )}

      {/* Empty state */}
      {!loading && redemptions.length === 0 && (
        <View
          style={{
            alignItems: "center",
            marginTop: 80,
            paddingHorizontal: 40,
          }}
        >
          <Ionicons
            name="receipt-outline"
            size={56}
            color={colors.darkBorder}
          />
          <Text
            style={{
              color: colors.grey,
              fontSize: 16,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 22,
            }}
          >
            No redemptions yet. Visit a partner venue and redeem your first
            member benefit!
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)")}
            style={{
              marginTop: 20,
              backgroundColor: colors.stone,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                color: colors.black,
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              Explore Venues
            </Text>
          </Pressable>
        </View>
      )}

      {/* Redemption list */}
      {!loading && redemptions.length > 0 && (
        <View style={{ paddingTop: 20 }}>
          {redemptions.map((redemption, index) => (
            <View
              key={redemption.id}
              style={{
                backgroundColor: colors.dark,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.darkBorder,
                marginHorizontal: 20,
                marginBottom: 12,
                padding: 16,
                flexDirection: "row",
                gap: 14,
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(76, 175, 80, 0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.green}
                />
              </View>

              {/* Details */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 3,
                  }}
                  numberOfLines={2}
                >
                  {redemption.deal_title}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 2,
                  }}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={12}
                    color={colors.stone}
                  />
                  <Text
                    style={{
                      color: colors.stone,
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    {redemption.venue_name}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.grey,
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  {formatDate(redemption.redeemed_at)} at{" "}
                  {formatTime(redemption.redeemed_at)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
