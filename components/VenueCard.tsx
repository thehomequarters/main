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
  const visibleTags = allTags.slice(0, 1);
  const extraTags = allTags.length > 1 ? allTags.length - 1 : 0;

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
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: isFeatured ? 16 : 0,
        marginBottom: isFeatured ? 0 : 16,
      }}
    >
      {/* Image section */}
      <View style={{ height: imageHeight, position: "relative" }}>
        <Image
          source={{ uri: imgSource }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Like button — top right */}
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); handleLike(); }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.92)",
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
      </View>

      {/* Info strip */}
      <View style={{ paddingHorizontal: 14, paddingTop: 11, paddingBottom: 12 }}>
        {/* Venue name */}
        <Text
          style={{
            color: colors.ink,
            fontSize: isFeatured ? 16 : 18,
            fontFamily: fonts.display,
            marginBottom: visibleTags.length > 0 || dealHeadline ? 7 : 0,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>

        {/* Tags row — max 1 tag + overflow indicator */}
        {visibleTags.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, marginBottom: dealHeadline ? 6 : 0 }}>
            {visibleTags.map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: colors.sand,
                  borderRadius: 20,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: colors.stone, fontSize: 11, fontFamily: fonts.medium }}>
                  {tag}
                </Text>
              </View>
            ))}
            {extraTags > 0 && (
              <View
                style={{
                  backgroundColor: colors.sand,
                  borderRadius: 20,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: colors.stone, fontSize: 11, fontFamily: fonts.medium }}>
                  +{extraTags}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Deal pill — gold border style */}
        {dealHeadline && (
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: colors.gold,
              }}
            >
              <Text style={{ color: colors.gold, fontSize: 11, fontFamily: fonts.semibold }} numberOfLines={1}>
                {dealHeadline}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}
