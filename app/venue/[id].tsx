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
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import * as Haptics from "expo-haptics";
import { useToast } from "@/components/Toast";
import { colors } from "@/constants/theme";
import type { Venue, Deal, Recommendation } from "@/lib/database.types";
import { RecommendationCard } from "@/components/RecommendationCard";
import { pickPostImage, uploadRecommendationImage } from "@/lib/storage";
import { Modal, TextInput, KeyboardAvoidingView, ActivityIndicator } from "react-native";
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
  const { profile } = useAuth();
  const { toast } = useToast();
  const isGrace = profile?.membership_status === "accepted";
  const [venue, setVenue] = useState<Venue | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVisited, setIsVisited] = useState(false);
  const [visitLoading, setVisitLoading] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hasRecommended, setHasRecommended] = useState(false);
  const [showRecModal, setShowRecModal] = useState(false);
  const [recText, setRecText] = useState("");
  const [recImageUri, setRecImageUri] = useState<string | null>(null);
  const [recSubmitting, setRecSubmitting] = useState(false);

  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    const fetchVenue = async () => {
      try {
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
          if (profile?.id) {
            const visitSnap = await getDoc(doc(db, "venue_visits", `${profile.id}_${id}`));
            setIsVisited(visitSnap.exists());
          }
        }
      } catch (e) {
        console.warn("fetchVenue error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchVenue();
  }, [id]);

  // Live recommendations listener
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "recommendations"),
      where("venue_id", "==", id),
      orderBy("created_at", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const recs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Recommendation);
      setRecommendations(recs);
      if (profile?.id) {
        setHasRecommended(recs.some((r) => r.author_id === profile.id));
      }
    });
    return unsub;
  }, [id, profile?.id]);

  const handleSubmitRecommendation = async () => {
    if (!profile || !venue) return;
    setRecSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (recImageUri) {
        imageUrl = await uploadRecommendationImage(`${profile.id}_${id}`, recImageUri);
      }
      const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();
      await addDoc(collection(db, "recommendations"), {
        author_id: profile.id,
        author_name: `${profile.first_name} ${profile.last_name}`,
        author_initials: initials,
        author_tier: profile.membership_tier ?? null,
        venue_id: id,
        venue_name: venue.name,
        text: recText.trim() || null,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      });
      setShowRecModal(false);
      setRecText("");
      setRecImageUri(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast("Recommendation added!");
    } catch (e) {
      console.error("handleSubmitRecommendation error:", e);
      Alert.alert("Error", "Failed to submit recommendation. Please try again.");
    } finally {
      setRecSubmitting(false);
    }
  };

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

  const handleMarkVisited = async () => {
    if (!profile?.id || visitLoading || isVisited) return;
    const visitRef = doc(db, "venue_visits", `${profile.id}_${id}`);
    setVisitLoading(true);
    try {
      await setDoc(visitRef, {
        member_id: profile.id,
        venue_id: id,
        visited_at: new Date().toISOString(),
      });
      setIsVisited(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast("Added to your places ✦", "success");
    } catch {
      toast("Couldn't save visit. Try again.", "error");
    } finally {
      setVisitLoading(false);
    }
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
                  isGrace
                    ? router.push("/activate")
                    : router.push(
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

          {/* ── Your Benefits (above the map) ── */}
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

              <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 24 }} />
            </>
          )}

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
              {/* Map preview */}
              <MapView
                style={{ width: "100%", height: 140 }}
                region={{
                  latitude: venue.latitude,
                  longitude: venue.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
                  title={venue.name}
                />
              </MapView>
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
                  Reservations - mention HomeQuarters
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

          {/* Share + Menu + Visited quick actions */}
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
                  message: `Check out ${venue.name} on HomeQuarters - ${venue.address}, ${venue.city}`,
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
            <Pressable
              onPress={handleMarkVisited}
              disabled={visitLoading || isVisited}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                backgroundColor: isVisited ? "rgba(201,168,76,0.1)" : colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isVisited ? "rgba(201,168,76,0.4)" : colors.border,
                paddingVertical: 13,
                opacity: visitLoading ? 0.6 : 1,
              }}
            >
              <Ionicons
                name={isVisited ? "checkmark-circle" : "checkmark-circle-outline"}
                size={16}
                color={isVisited ? "#C9A84C" : colors.dark}
              />
              <Text style={{ color: isVisited ? "#C9A84C" : colors.dark, fontSize: 13, fontWeight: "600" }}>
                {isVisited ? "Visited" : "Been here"}
              </Text>
            </Pressable>

            {/* Recommend button */}
            <Pressable
              onPress={() => isGrace ? router.push("/activate") : setShowRecModal(true)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                backgroundColor: hasRecommended ? "rgba(201,168,76,0.08)" : colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: hasRecommended ? "rgba(201,168,76,0.35)" : colors.border,
                paddingVertical: 13,
              }}
            >
              <Ionicons name="star" size={16} color={hasRecommended ? "#C9A84C" : colors.dark} />
              <Text style={{ color: hasRecommended ? "#C9A84C" : colors.dark, fontSize: 13, fontWeight: "600" }}>
                {hasRecommended ? "Recommended" : "Recommend"}
              </Text>
            </Pressable>
          </View>

          {/* Recommendations section */}
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
                Member Recommendations
              </Text>
              {recommendations.length > 0 && (
                <View style={{ backgroundColor: "rgba(201,168,76,0.10)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(201,168,76,0.25)", paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: "#C9A84C", fontSize: 12, fontWeight: "700" }}>{recommendations.length}</Text>
                </View>
              )}
            </View>

            {recommendations.length === 0 ? (
              <View style={{ backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: "center" }}>
                <Ionicons name="star-outline" size={28} color={colors.border} style={{ marginBottom: 10 }} />
                <Text style={{ color: colors.stone, fontSize: 13, textAlign: "center" }}>
                  No recommendations yet.{"\n"}Be the first to recommend this venue.
                </Text>
              </View>
            ) : (
              recommendations.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))
            )}
          </View>

        </View>
      </ScrollView>

      {/* Create Recommendation Modal */}
      <Modal
        visible={showRecModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.bg }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Modal header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Pressable onPress={() => { setShowRecModal(false); setRecText(""); setRecImageUri(null); }}>
              <Text style={{ color: colors.stone, fontSize: 15 }}>Cancel</Text>
            </Pressable>
            <Text style={{ color: colors.dark, fontSize: 16, fontWeight: "700" }}>Recommend</Text>
            <Pressable
              onPress={handleSubmitRecommendation}
              disabled={recSubmitting}
              style={{ opacity: recSubmitting ? 0.4 : 1 }}
            >
              {recSubmitting
                ? <ActivityIndicator size="small" color={colors.dark} />
                : <Text style={{ color: colors.dark, fontSize: 15, fontWeight: "700" }}>Post</Text>
              }
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Venue name */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Ionicons name="star" size={16} color="#C9A84C" />
              <Text style={{ color: colors.dark, fontSize: 14, fontWeight: "600" }}>{venue?.name}</Text>
            </View>

            {/* Text input */}
            <TextInput
              value={recText}
              onChangeText={setRecText}
              placeholder="Share what you love about this venue… (optional)"
              placeholderTextColor={colors.stone}
              multiline
              style={{
                backgroundColor: colors.white,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                fontSize: 15,
                color: colors.dark,
                minHeight: 120,
                textAlignVertical: "top",
                marginBottom: 16,
              }}
            />

            {/* Image picker */}
            {recImageUri ? (
              <View style={{ marginBottom: 16 }}>
                <Image source={{ uri: recImageUri }} style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 10 }} resizeMode="cover" />
                <Pressable onPress={() => setRecImageUri(null)}>
                  <Text style={{ color: colors.stone, fontSize: 13, textAlign: "center" }}>Remove photo</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={async () => {
                  const uri = await pickPostImage();
                  if (uri) setRecImageUri(uri);
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}
              >
                <Ionicons name="camera-outline" size={20} color={colors.stone} />
                <Text style={{ color: colors.stone, fontSize: 14 }}>Add a photo (optional)</Text>
              </Pressable>
            )}

            <Text style={{ color: colors.stone, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
              Your recommendation will appear on this venue's page{"\n"}and on your member profile.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

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
          {isGrace ? (
            <Pressable
              onPress={() => router.push("/activate")}
              style={{
                backgroundColor: "#F5A623",
                borderRadius: 12,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="lock-closed-outline" size={16} color="#3D2800" />
              <Text
                style={{
                  color: "#3D2800",
                  fontSize: 16,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                }}
              >
                Activate to Redeem
              </Text>
            </Pressable>
          ) : (
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
          )}
        </View>
      )}
    </View>
  );
}
