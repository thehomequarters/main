import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "@/constants/theme";
import type { Recommendation } from "@/lib/database.types";

interface Props {
  rec: Recommendation;
  /** Show venue name — useful on profile view where multiple venues appear */
  showVenue?: boolean;
  onPress?: () => void;
}

/** Relative time helper */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function RecommendationCard({ rec, showVenue = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Author row */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: rec.text || rec.image_url ? 12 : 0 }}>
        {/* Avatar */}
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.sand,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
          }}
        >
          <Text style={{ color: colors.dark, fontSize: 13, fontFamily: fonts.bold }}>
            {rec.author_initials}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={{ color: colors.dark, fontSize: 13, fontFamily: fonts.semibold }}>
              {rec.author_name}
            </Text>
            {rec.author_tier === "committee_member" && (
              <Ionicons name="checkmark-circle" size={13} color="#4F8EF7" />
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {showVenue && (
              <>
                <Text style={{ color: colors.stone, fontSize: 11, fontFamily: fonts.body }}>
                  {rec.venue_name}
                </Text>
                <Text style={{ color: colors.border, fontSize: 11 }}>·</Text>
              </>
            )}
            <Text style={{ color: colors.stone, fontSize: 11, fontFamily: fonts.body }}>
              {timeAgo(rec.created_at)}
            </Text>
          </View>
        </View>

        {/* Gold star badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(201,168,76,0.10)",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(201,168,76,0.25)",
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Ionicons name="star" size={11} color="#C9A84C" />
          <Text style={{ color: "#C9A84C", fontSize: 11, fontFamily: fonts.semibold }}>
            Rec
          </Text>
        </View>
      </View>

      {/* Optional text */}
      {!!rec.text && (
        <Text
          style={{
            color: colors.dark,
            fontSize: 14,
            fontFamily: fonts.body,
            lineHeight: 21,
            marginBottom: rec.image_url ? 12 : 0,
          }}
        >
          {rec.text}
        </Text>
      )}

      {/* Optional image */}
      {!!rec.image_url && (
        <Image
          source={{ uri: rec.image_url }}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 10,
            backgroundColor: colors.sand,
          }}
          resizeMode="cover"
        />
      )}
    </Pressable>
  );
}
