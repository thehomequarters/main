import React from "react";
import { View, Text, Image, Pressable, Dimensions } from "react-native";
import { colors } from "@/constants/theme";

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
  const cardHeight = isFeatured ? 200 : 220;

  const imgSource = imageUrl || PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.restaurant;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: cardWidth,
        height: cardHeight,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: colors.dark,
        marginRight: isFeatured ? 16 : 0,
        marginBottom: isFeatured ? 0 : 16,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Image
        source={{ uri: imgSource }}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
        resizeMode="cover"
      />

      {/* Gradient overlay */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60%",
          backgroundColor: "rgba(0,0,0,0.65)",
        }}
      />

      {/* Content overlay */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
        }}
      >
        <Text
          style={{
            color: colors.gold,
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {category}
        </Text>
        <Text
          style={{
            color: colors.white,
            fontSize: 18,
            fontWeight: "700",
            marginBottom: dealHeadline ? 4 : 0,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        {dealHeadline && (
          <Text
            style={{
              color: colors.grey,
              fontSize: 13,
            }}
            numberOfLines={1}
          >
            {dealHeadline}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
