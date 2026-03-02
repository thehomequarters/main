import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { colors } from "@/constants/theme";
import type { Venue, Deal } from "@/lib/database.types";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { Ionicons } from "@expo/vector-icons";

const PLACEHOLDER_IMAGES: Record<string, string> = {
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  bar: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
  cafe: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800&q=80",
  experience:
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
};

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        gap: 6,
        flex: 1,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "rgba(201, 168, 76, 0.12)",
          borderWidth: 1,
          borderColor: "rgba(201, 168, 76, 0.25)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={colors.gold} />
      </View>
      <Text
        style={{
          color: colors.grey,
          fontSize: 11,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenue = async () => {
      const venueSnap = await getDoc(doc(db, "venues", id));

      if (venueSnap.exists()) {
        setVenue({ id: venueSnap.id, ...venueSnap.data() } as Venue);

        const dealsQuery = query(
          collection(db, "deals"),
          where("venue_id", "==", id),
          where("is_active", "==", true)
        );
        const dealsSnap = await getDocs(dealsQuery);
        setDeals(
          dealsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deal)
        );
      }
      setLoading(false);
    };

    fetchVenue();
  }, [id]);

  const screenWidth = Dimensions.get("window").width;

  const openMap = () => {
    if (!venue) return;
    const label = encodeURIComponent(venue.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${venue.latitude},${venue.longitude}`,
      default: `geo:${venue.latitude},${venue.longitude}?q=${venue.latitude},${venue.longitude}(${label})`,
    });
    Linking.openURL(url);
  };

  const callVenue = () => {
    if (!venue?.phone) return;
    Linking.openURL(`tel:${venue.phone}`);
  };

  const openMenu = () => {
    if (!venue?.menu_url) return;
    Linking.openURL(venue.menu_url);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.black }}>
        <SkeletonLoader width={screenWidth} height={300} borderRadius={0} />
        <View style={{ padding: 20 }}>
          <SkeletonLoader
            width="60%"
            height={24}
            style={{ marginBottom: 12 }}
          />
          <SkeletonLoader
            width="30%"
            height={14}
            style={{ marginBottom: 8 }}
          />
          <SkeletonLoader width="80%" height={14} />
        </View>
      </View>
    );
  }

  if (!venue) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.black,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.grey }}>Venue not found.</Text>
      </View>
    );
  }

  const imageSource =
    venue.image_url ||
    PLACEHOLDER_IMAGES[venue.category] ||
    PLACEHOLDER_IMAGES.restaurant;

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Image */}
        <View style={{ width: screenWidth, height: 300 }}>
          <Image
            source={{ uri: imageSource }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          {/* Gradient overlay */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 120,
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
          />
        </View>

        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: 54,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>

        {/* Venue Info */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              color: colors.gold,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {venue.category}
          </Text>

          <Text
            style={{
              color: colors.white,
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            {venue.name}
          </Text>

          <Pressable
            onPress={openMap}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}
          >
            <Ionicons name="location-outline" size={14} color={colors.grey} />
            <Text
              style={{
                color: colors.grey,
                fontSize: 14,
              }}
            >
              {venue.address}
            </Text>
          </Pressable>

          <Text
            style={{
              color: colors.grey,
              fontSize: 14,
              marginBottom: 20,
              paddingLeft: 18,
            }}
          >
            {venue.city}, {venue.country}
          </Text>

          {venue.description ? (
            <Text
              style={{
                color: colors.grey,
                fontSize: 14,
                lineHeight: 22,
                marginBottom: 24,
              }}
            >
              {venue.description}
            </Text>
          ) : null}

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              backgroundColor: colors.dark,
              borderRadius: 14,
              paddingVertical: 18,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              marginBottom: 24,
            }}
          >
            <ActionButton icon="map-outline" label="Map" onPress={openMap} />
            <ActionButton
              icon="call-outline"
              label="Call"
              onPress={callVenue}
            />
            {venue.menu_url ? (
              <ActionButton
                icon="restaurant-outline"
                label="Menu"
                onPress={openMenu}
              />
            ) : (
              <ActionButton
                icon="share-outline"
                label="Share"
                onPress={() => {
                  /* future */
                }}
              />
            )}
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.darkBorder,
              marginBottom: 24,
            }}
          />

          {/* Your Benefits */}
          {deals.length > 0 && (
            <>
              <Text
                style={{
                  color: colors.white,
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 16,
                }}
              >
                Your Benefits
              </Text>

              {deals.map((deal) => (
                <View
                  key={deal.id}
                  style={{
                    backgroundColor: colors.dark,
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.darkBorder,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: deal.description || deal.terms ? 6 : 0,
                    }}
                  >
                    {deal.title}
                  </Text>
                  {deal.description && (
                    <Text
                      style={{
                        color: colors.grey,
                        fontSize: 13,
                        lineHeight: 20,
                        marginBottom: deal.terms ? 6 : 0,
                      }}
                    >
                      {deal.description}
                    </Text>
                  )}
                  {deal.terms && (
                    <Text
                      style={{
                        color: colors.grey,
                        fontSize: 12,
                        fontStyle: "italic",
                        opacity: 0.7,
                      }}
                    >
                      {deal.terms}
                    </Text>
                  )}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Show QR Code Button */}
      {deals.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: 36,
            backgroundColor: colors.black,
            borderTopWidth: 1,
            borderTopColor: colors.darkBorder,
          }}
        >
          <Pressable
            onPress={() =>
              router.push(
                `/qr?venueId=${venue.id}&venueName=${encodeURIComponent(venue.name)}&dealTitle=${encodeURIComponent(deals[0].title)}&dealId=${deals[0].id}`
              )
            }
            style={{
              backgroundColor: colors.gold,
              borderRadius: 12,
              paddingVertical: 16,
            }}
          >
            <Text
              style={{
                color: colors.black,
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              Redeem Benefit
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
