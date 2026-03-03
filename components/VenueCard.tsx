import React from "react";
import { View, Text, Image, Pressable, Dimensions } from "react-native";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

interface VenueCardProps {
  name: string;
  category: string;
  imageUrl: string | null;
  dealHeadline?: string;
  onPress: () => void;
  variant?: "featured" | "list";
}

const PLACEHOLDER_IMAGES: Record<string, string> = {
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
  bar: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80",
  cafe: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=600&q=80",
  experience:
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
};

export function VenueCard({
  name,
  category,
  imageUrl,
  dealHeadline,
  onPress,
  variant = "list",
}: VenueCardProps) {
  const screenWidth = Dimensions.get("window").width;
  const isFeatured = variant === "featured";
  const cardWidth = isFeatured ? screenWidth * 0.72 : screenWidth - 40;
  const cardHeight = isFeatured ? 260 : 240;

  const imgSource = imageUrl || PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.restaurant;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.dark,
        marginRight: isFeatured ? 16 : 0,
        marginBottom: isFeatured ? 0 : 16,
      }}
    >
      {/* Full-bleed image */}
      <Image
        source={{ uri: imgSource }}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
        resizeMode="cover"
      />

      {/* Top gradient overlay (light fade for top buttons) */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: "rgba(0,0,0,0.25)",
        }}
      />

      {/* Bottom gradient overlay */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "55%",
          backgroundColor: "rgba(0,0,0,0.60)",
        }}
      />

      {/* Top-left: Venue name + location */}
      <View
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 100,
        }}
      >
        <Text
          style={{
            color: colors.white,
            fontSize: 17,
            fontWeight: "700",
            textShadowColor: "rgba(0,0,0,0.4)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 }}>
          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.8)" />
          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 11,
              fontWeight: "500",
              textTransform: "capitalize",
            }}
          >
            {category}
          </Text>
        </View>
      </View>

      {/* Top-right: share + heart buttons */}
      <View
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.92)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="share-outline" size={17} color={colors.dark} />
        </View>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.92)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="heart-outline" size={17} color={colors.dark} />
        </View>
      </View>

      {/* Bottom strip */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 14,
          paddingBottom: 16,
        }}
      >
        {/* Deal/category row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          {/* Gold circle with $ icon */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.gold,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.white, fontSize: 13, fontWeight: "700" }}>
              $
            </Text>
          </View>
          <Text
            style={{
              color: colors.white,
              fontSize: 13,
              fontWeight: "600",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {dealHeadline || "Member Benefit"}
          </Text>
        </View>

        {/* Rating + capacity row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 12 }}>⭐</Text>
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: "600" }}>
              4.7
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
              Members only
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
