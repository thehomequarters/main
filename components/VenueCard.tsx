import React, { useState } from "react";
import { View, Text, Image, Pressable, Dimensions } from "react-native";
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

interface VenueCardProps {
  name: string;
  category: string;
  imageUrl: string | null;
  dealHeadline?: string;
  tags?: string[] | null;
  onPress: () => void;
  variant?: "featured" | "list";
  venueId?: string;
  initialLiked?: boolean;
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
  tags,
  onPress,
  variant = "list",
  venueId,
  initialLiked = false,
}: VenueCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const screenWidth = Dimensions.get("window").width;
  const isFeatured = variant === "featured";
  const cardWidth = isFeatured ? screenWidth * 0.72 : screenWidth - 40;
  const imageHeight = isFeatured ? 220 : 250;

  const imgSource = imageUrl || PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.restaurant;
  const allTags = tags ?? [];
  const visibleTags = allTags.slice(0, 2);
  const extraTags = allTags.length > 2 ? allTags.length - 2 : 0;

  const handleLike = async () => {
    if (!user?.uid || !venueId) return;
    const newLiked = !liked;
    setLiked(newLiked);
    try {
      if (newLiked) {
        await addDoc(collection(db, "venue_likes"), {
          venue_id: venueId,
          member_id: user.uid,
          created_at: new Date().toISOString(),
        });
      } else {
        const q = query(
          collection(db, "venue_likes"),
          where("venue_id", "==", venueId),
          where("member_id", "==", user.uid)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, "venue_likes", d.id));
        }
      }
    } catch {
      setLiked(!newLiked); // revert on error
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: cardWidth,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: colors.white,
        marginRight: isFeatured ? 16 : 0,
        marginBottom: isFeatured ? 0 : 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      {/* Image section */}
      <View style={{ height: imageHeight, position: "relative" }}>
        <Image
          source={{ uri: imgSource }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Subtle bottom fade */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            backgroundColor: "rgba(0,0,0,0.15)",
          }}
        />

        {/* Like button — top right */}
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); handleLike(); }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: "rgba(255,255,255,0.85)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={14}
            color={liked ? colors.red : colors.dark}
          />
        </Pressable>

        {/* Category label — bottom left, on image */}
        <View
          style={{
            position: "absolute",
            bottom: 10,
            left: 14,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 9,
              fontFamily: fonts.semibold,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {category}
          </Text>
        </View>
      </View>

      {/* Info strip */}
      <View style={{ paddingHorizontal: 16, paddingTop: 13, paddingBottom: 14 }}>
        {/* Venue name */}
        <Text
          style={{
            color: colors.ink,
            fontSize: isFeatured ? 16 : 18,
            fontFamily: fonts.display,
            marginBottom: visibleTags.length > 0 || dealHeadline ? 8 : 0,
            lineHeight: isFeatured ? 20 : 22,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>

        {/* Tags + deal row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {visibleTags.map((tag) => (
            <Text
              key={tag}
              style={{
                color: colors.stone,
                fontSize: 11,
                fontFamily: fonts.body,
              }}
            >
              {tag}
            </Text>
          ))}
          {visibleTags.length > 0 && dealHeadline && (
            <Text style={{ color: colors.border, fontSize: 11 }}>·</Text>
          )}
          {dealHeadline && (
            <Text
              style={{
                color: colors.gold,
                fontSize: 11,
                fontFamily: fonts.medium,
              }}
              numberOfLines={1}
            >
              {dealHeadline}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
