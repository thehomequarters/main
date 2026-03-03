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
  const imageHeight = isFeatured ? 170 : 190;

  const imgSource = imageUrl || PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.restaurant;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: cardWidth,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: isFeatured ? 16 : 0,
        marginBottom: isFeatured ? 0 : 16,
      }}
    >
      {/* Image section — no overlays */}
      <View style={{ height: imageHeight, position: "relative" }}>
        <Image
          source={{ uri: imgSource }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Category pill — top left on image */}
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: "rgba(255,255,255,0.92)",
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              color: colors.dark,
              fontSize: 11,
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {category}
          </Text>
        </View>

        {/* Action buttons — top right */}
        <View
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "rgba(255,255,255,0.92)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="share-outline" size={16} color={colors.dark} />
          </View>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "rgba(255,255,255,0.92)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="heart-outline" size={16} color={colors.dark} />
          </View>
        </View>
      </View>

      {/* Info strip */}
      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        <Text
          style={{
            color: colors.dark,
            fontSize: 15,
            fontWeight: "700",
            marginBottom: 6,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Deal pill */}
          {dealHeadline && (
            <View
              style={{
                backgroundColor: colors.sand,
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.dark, fontSize: 11, fontWeight: "600" }} numberOfLines={1}>
                {dealHeadline}
              </Text>
            </View>
          )}

          {/* Rating + members */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 12 }}>⭐</Text>
            <Text style={{ color: colors.stone, fontSize: 12 }}>4.7</Text>
            <Text style={{ color: colors.border, fontSize: 12 }}>·</Text>
            <Text style={{ color: colors.stone, fontSize: 12 }}>Members only</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
