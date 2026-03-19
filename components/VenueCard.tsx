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
  city?: string;
  onPress: () => void;
  variant?: "featured" | "list";
  venueId?: string;
  initialLiked?: boolean;
  onLikeChange?: (liked: boolean) => void;
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
  city,
  onPress,
  variant = "list",
  venueId,
  initialLiked = false,
  onLikeChange,
}: VenueCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const screenWidth = Dimensions.get("window").width;
  const isFeatured = variant === "featured";

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
      onLikeChange?.(newLiked);
    } catch {
      setLiked(!newLiked); // revert on error
    }
  };

  // ── Featured variant (carousel card) ────────────────────────────────────────
  if (isFeatured) {
    const cardWidth = screenWidth * 0.72;
    return (
      <Pressable
        onPress={onPress}
        style={{
          width: cardWidth,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.white,
          marginRight: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View style={{ height: 220, position: "relative" }}>
          <Image
            source={{ uri: imgSource }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
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
          <View style={{ position: "absolute", bottom: 10, left: 14 }}>
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
        <View style={{ paddingHorizontal: 16, paddingTop: 13, paddingBottom: 14 }}>
          <Text
            style={{
              color: colors.ink,
              fontSize: 16,
              fontFamily: fonts.display,
              marginBottom: visibleTags.length > 0 || dealHeadline ? 8 : 0,
              lineHeight: 20,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {visibleTags.map((tag) => (
              <Text key={tag} style={{ color: colors.stone, fontSize: 11, fontFamily: fonts.body }}>
                {tag}
              </Text>
            ))}
            {visibleTags.length > 0 && dealHeadline && (
              <Text style={{ color: colors.border, fontSize: 11 }}>·</Text>
            )}
            {dealHeadline && (
              <Text
                style={{ color: colors.gold, fontSize: 11, fontFamily: fonts.medium }}
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

  // ── List variant — full-bleed with image overlay ─────────────────────────────
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: screenWidth,
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
        marginBottom: 2,
      }}
    >
      {/* Full-bleed image */}
      <View style={{ height: 300, position: "relative" }}>
        <Image
          source={{ uri: imgSource }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Top-to-bottom dark scrim for readability */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.18)",
          }}
        />

        {/* Bottom gradient (stronger) */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "65%",
            backgroundColor: "rgba(0,0,0,0.52)",
          }}
        />

        {/* Like button — top right */}
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); handleLike(); }}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.18)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={15}
            color={liked ? colors.red : "rgba(255,255,255,0.9)"}
          />
        </Pressable>

        {/* Centered name + deal overlay */}
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 26,
              fontFamily: fonts.display,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 30,
              marginBottom: dealHeadline ? 6 : 0,
            }}
            numberOfLines={2}
          >
            {name}
          </Text>
          {dealHeadline && (
            <Text
              style={{
                color: "rgba(255,255,255,0.88)",
                fontSize: 14,
                fontFamily: fonts.body,
                textAlign: "center",
                lineHeight: 20,
              }}
              numberOfLines={2}
            >
              {dealHeadline}
            </Text>
          )}
        </View>
      </View>

      {/* Info strip — dark background */}
      <View
        style={{
          backgroundColor: "#111111",
          paddingHorizontal: 18,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
        }}
      >
        {city && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
            <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.45)" />
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 12,
                fontFamily: fonts.body,
              }}
              numberOfLines={1}
            >
              {city}
            </Text>
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
          <Ionicons name="restaurant-outline" size={12} color="rgba(255,255,255,0.45)" />
          <Text
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 12,
              fontFamily: fonts.body,
              textTransform: "capitalize",
            }}
            numberOfLines={1}
          >
            {allTags.length > 0 ? allTags[0] : category}
          </Text>
        </View>
        {allTags.length > 1 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                fontFamily: fonts.body,
              }}
              numberOfLines={1}
            >
              {allTags[1]}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
