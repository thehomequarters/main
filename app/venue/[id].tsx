import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  FlatList,
  Linking,
  Share,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Circle } from "react-native-svg";

const PLACEHOLDER_IMAGES: Record<string, string> = {
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  bar: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
  cafe: "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800&q=80",
  experience:
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
};


export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapFailed, setMapFailed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const screenWidth = Dimensions.get("window").width;

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
        setDeals(dealsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deal));
      }
      setLoading(false);
    };
    fetchVenue();
  }, [id]);

  const openMap = () => {
    if (!venue) return;
    const label = encodeURIComponent(venue.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${venue.latitude},${venue.longitude}`,
      default: `geo:${venue.latitude},${venue.longitude}?q=${venue.latitude},${venue.longitude}(${label})`,
    });
    Linking.openURL(url!);
  };

  const callVenue = () => {
    if (!venue?.phone) return;
    Linking.openURL(`tel:${venue.phone}`);
  };

  const openMenu = () => {
    if (!venue?.menu_url) return;
    Linking.openURL(venue.menu_url);
  };

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActiveSlide(index);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SkeletonLoader width={screenWidth} height={300} borderRadius={0} />
        <View style={{ padding: 20 }}>
          <SkeletonLoader width="60%" height={24} style={{ marginBottom: 12 }} />
          <SkeletonLoader width="30%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="80%" height={14} />
        </View>
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.stone }}>Venue not found.</Text>
      </View>
    );
  }

  // Build the carousel image list
  const carouselImages: string[] =
    venue.image_urls && venue.image_urls.length > 0
      ? venue.image_urls
      : venue.image_url
      ? [venue.image_url]
      : [PLACEHOLDER_IMAGES[venue.category] ?? PLACEHOLDER_IMAGES.restaurant];

  const hasStories = Boolean(venue.logo_url); // logo present means stories may exist

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Hero Carousel ── */}
        <View
          style={{
            width: screenWidth,
            height: 300,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            overflow: "hidden",
          }}
        >
          <FlatList
            data={carouselImages}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: screenWidth, height: 300 }}
                resizeMode="cover"
              />
            )}
          />

          {/* Dot indicators (only if multiple images) */}
          {carouselImages.length > 1 && (
            <View
              style={{
                position: "absolute",
                bottom: 12,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                pointerEvents: "none",
              }}
            >
              {carouselImages.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === activeSlide ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor:
                      i === activeSlide
                        ? colors.white
                        : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Back button (floating) */}
        <Pressable
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: 54,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.white,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </Pressable>

        {/* ── Logo avatar + venue info row ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: venue.logo_url ? 0 : 20 }}>
          {venue.logo_url && (
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: -28, marginBottom: 14 }}>
              <Pressable
                onPress={() =>
                  router.push(
                    `/stories/${id}?venueName=${encodeURIComponent(venue.name)}` as any
                  )
                }
                style={{ width: 72, height: 72, position: "relative" }}
              >
                {/* Instagram-style gradient glow ring */}
                <Svg width={72} height={72} style={{ position: "absolute", top: 0, left: 0 }}>
                  <Defs>
                    <SvgGradient id="storyRing" x1="0%" y1="100%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#F5831F" />
                      <Stop offset="40%" stopColor="#E1306C" />
                      <Stop offset="80%" stopColor="#833AB4" />
                      <Stop offset="100%" stopColor="#FCAF45" />
                    </SvgGradient>
                  </Defs>
                  <Circle cx={36} cy={36} r={34} fill="none" stroke="url(#storyRing)" strokeWidth={3} />
                </Svg>
                <View
                  style={{
                    position: "absolute",
                    top: 4, left: 4,
                    width: 64, height: 64,
                    borderRadius: 32,
                    overflow: "hidden",
                    backgroundColor: colors.white,
                    borderWidth: 2,
                    borderColor: colors.bg,
                  }}
                >
                  <Image
                    source={{ uri: venue.logo_url }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
              </Pressable>
              <Text
                style={{
                  color: colors.stone,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginLeft: 10,
                  marginBottom: 4,
                }}
              >
                Tap for stories
              </Text>
            </View>
          )}

          {/* Category */}
          <Text
            style={{
              color: colors.stone,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {venue.category}
          </Text>

          {/* Name */}
          <Text
            style={{
              color: colors.dark,
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 10,
            }}
          >
            {venue.name}
          </Text>

          {/* ── Tags ── */}
          {venue.tags && venue.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginBottom: 14 }}
            >
              {venue.tags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    backgroundColor: colors.sand,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={{ color: colors.stone, fontSize: 12, fontWeight: "500" }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          {venue.description ? (
            <Text
              style={{
                color: colors.stone,
                fontSize: 14,
                lineHeight: 22,
                marginBottom: 24,
              }}
            >
              {venue.description}
            </Text>
          ) : null}

          {/* Location card with static map preview */}
          {venue.latitude != null && venue.longitude != null && (
            <Pressable
              onPress={openMap}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              {/* Static map image */}
              <Image
                source={{
                  uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${venue.latitude},${venue.longitude}&zoom=15&size=600x200&markers=${venue.latitude},${venue.longitude},red-marker-m`,
                }}
                style={{ width: "100%", height: 140 }}
                resizeMode="cover"
              />
              {/* Address row below map */}
              <View
                style={{
                  backgroundColor: colors.sand,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Ionicons name="location-outline" size={18} color={colors.dark} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "600" }}>
                    {venue.address}
                  </Text>
                  <Text style={{ color: colors.stone, fontSize: 12, marginTop: 1 }}>
                    {venue.city}, {venue.country}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.dark,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons name="navigate-outline" size={11} color={colors.white} />
                  <Text style={{ color: colors.white, fontSize: 12, fontWeight: "700" }}>
                    Directions
                  </Text>
                </View>
              </View>
            </Pressable>
          )}

          {/* Opening hours */}
          {venue.opening_hours && (
            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.sand,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="time-outline" size={18} color={colors.dark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "600", marginBottom: 3 }}>
                  Opening Hours
                </Text>
                <Text style={{ color: colors.stone, fontSize: 13, lineHeight: 20 }}>
                  {venue.opening_hours}
                </Text>
              </View>
            </View>
          )}

          {/* Booking reminder */}
          {venue.phone && (
            <Pressable
              onPress={callVenue}
              style={{
                backgroundColor: colors.sand,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                marginBottom: 24,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="call-outline" size={17} color={colors.dark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "600", marginBottom: 3 }}>
                  Reservations — mention HomeQuarters
                </Text>
                <Text style={{ color: colors.stone, fontSize: 13, lineHeight: 20 }}>
                  Call ahead to book your table. Always mention HomeQuarters to ensure your member benefit is applied.
                </Text>
                <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "600", marginTop: 6 }}>
                  {venue.phone}
                </Text>
              </View>
            </Pressable>
          )}

          {/* Share + Menu quick actions */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            {venue.menu_url && (
              <Pressable
                onPress={openMenu}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 13,
                }}
              >
                <Ionicons name="restaurant-outline" size={16} color={colors.dark} />
                <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "600" }}>Menu</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() =>
                Share.share({
                  message: `Check out ${venue.name} on HomeQuarters — ${venue.address}, ${venue.city}`,
                })
              }
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                backgroundColor: colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 13,
              }}
            >
              <Ionicons name="share-outline" size={16} color={colors.dark} />
              <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "600" }}>Share</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 24 }} />

          {/* Your Benefits */}
          {deals.length > 0 && (
            <>
              <Text
                style={{
                  color: colors.dark,
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
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: colors.dark,
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
                        color: colors.stone,
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
                        color: colors.stone,
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

      {/* Redeem Benefit button */}
      {deals.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: 36,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={() =>
              router.push(
                `/qr?venueId=${venue.id}&venueName=${encodeURIComponent(venue.name)}&dealTitle=${encodeURIComponent(deals[0].title)}&dealId=${deals[0].id}`
              )
            }
            style={{
              backgroundColor: colors.dark,
              borderRadius: 12,
              paddingVertical: 16,
            }}
          >
            <Text
              style={{
                color: colors.white,
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
