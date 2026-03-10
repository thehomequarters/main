import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  Linking,
  Alert,
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
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import * as Haptics from "expo-haptics";
import { useToast } from "@/components/Toast";
import { colors } from "@/constants/theme";
import type { HQEvent, Booking } from "@/lib/database.types";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { Ionicons } from "@expo/vector-icons";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  social: "#7B68EE",
  dining: "#C9A84C",
  wellness: "#4ECDC4",
  music: "#E91E63",
  arts: "#FF7043",
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isGrace = profile?.membership_status === "accepted";

  const [event, setEvent] = useState<HQEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [userBooking, setUserBooking] = useState<Booking | null>(null);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [booking, setBooking] = useState(false);

  const screenWidth = Dimensions.get("window").width;

  const fetchData = async () => {
    const eventSnap = await getDoc(doc(db, "events", id));
    if (!eventSnap.exists()) {
      setLoading(false);
      return;
    }
    const eventData = { id: eventSnap.id, ...eventSnap.data() } as HQEvent;
    setEvent(eventData);

    // Attendee count
    const allBookingsSnap = await getDocs(
      query(collection(db, "bookings"), where("event_id", "==", id))
    );
    setAttendeeCount(allBookingsSnap.size);

    // User's booking
    if (user?.uid) {
      const userBookingSnap = await getDocs(
        query(
          collection(db, "bookings"),
          where("event_id", "==", id),
          where("member_id", "==", user.uid)
        )
      );
      if (!userBookingSnap.empty) {
        setUserBooking({
          id: userBookingSnap.docs[0].id,
          ...userBookingSnap.docs[0].data(),
        } as Booking);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleBook = async () => {
    if (!user?.uid || !event) return;

    if (userBooking) {
      Alert.alert("Cancel Booking", `Remove your booking for "${event.title}"?`, [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            setBooking(true);
            await deleteDoc(doc(db, "bookings", userBooking.id));
            setUserBooking(null);
            setAttendeeCount((c) => Math.max(0, c - 1));
            setBooking(false);
          },
        },
      ]);
      return;
    }

    if (attendeeCount >= event.capacity) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast("This event has reached capacity.", "error");
      return;
    }

    Alert.alert("Book Event", `Book your spot at "${event.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Book",
        onPress: async () => {
          setBooking(true);
          const ref = await addDoc(collection(db, "bookings"), {
            member_id: user.uid,
            event_id: id,
            created_at: new Date().toISOString(),
          });
          setUserBooking({ id: ref.id, member_id: user.uid!, event_id: id, created_at: new Date().toISOString() });
          setAttendeeCount((c) => c + 1);
          setBooking(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast("You're on the list!", "success");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.black }}>
        <SkeletonLoader width={screenWidth} height={280} borderRadius={0} />
        <View style={{ padding: 20, gap: 12 }}>
          <SkeletonLoader width="70%" height={28} />
          <SkeletonLoader width="40%" height={14} />
          <SkeletonLoader width="100%" height={14} />
          <SkeletonLoader width="90%" height={14} />
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.black, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.grey }}>Event not found.</Text>
      </View>
    );
  }

  const spotsLeft = event.capacity - attendeeCount;
  const isFull = spotsLeft <= 0;
  const catColor = CATEGORY_COLORS[event.category] ?? colors.stone;

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Hero image */}
        <View style={{ width: screenWidth, height: 280 }}>
          <Image
            source={{ uri: event.image_url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 140,
              backgroundColor: "rgba(0,0,0,0.65)",
            }}
            pointerEvents="none"
          />

          {/* Category badge */}
          <View
            style={{
              position: "absolute",
              top: 54,
              right: 16,
              backgroundColor: `${catColor}33`,
              borderWidth: 1,
              borderColor: `${catColor}66`,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text
              style={{
                color: catColor,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              {event.category}
            </Text>
          </View>
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

        <View style={{ padding: 20 }}>
          {/* Title */}
          <Text
            style={{
              color: colors.white,
              fontSize: 26,
              fontWeight: "700",
              lineHeight: 32,
              marginBottom: 16,
            }}
          >
            {event.title}
          </Text>

          {/* Meta row */}
          <View
            style={{
              backgroundColor: colors.dark,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              padding: 16,
              gap: 12,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "rgba(201,168,76,0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.stone} />
              </View>
              <Text style={{ color: colors.white, fontSize: 14, fontWeight: "500" }}>
                {formatDate(event.date)}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "rgba(201,168,76,0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="time-outline" size={16} color={colors.stone} />
              </View>
              <Text style={{ color: colors.white, fontSize: 14, fontWeight: "500" }}>
                {formatTime(event.time)} – {formatTime(event.end_time)}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "rgba(201,168,76,0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="location-outline" size={16} color={colors.stone} />
              </View>
              <Text style={{ color: colors.white, fontSize: 14, fontWeight: "500" }}>
                {event.venue}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "rgba(201,168,76,0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="people-outline" size={16} color={colors.stone} />
              </View>
              <Text
                style={{
                  color: isFull ? colors.red : spotsLeft < 10 ? colors.red : colors.white,
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                {attendeeCount} going ·{" "}
                {isFull ? "No spots left" : `${spotsLeft} spots left`}
              </Text>
            </View>
          </View>

          {/* Location map card */}
          {event.venue ? (
            <Pressable
              onPress={() => {
                const query = encodeURIComponent(event.venue);
                const url = Platform.select({
                  ios: `maps:?q=${query}`,
                  default: `geo:0,0?q=${query}`,
                });
                Linking.openURL(url!).catch(() =>
                  Linking.openURL(`https://maps.google.com/?q=${query}`)
                );
              }}
              style={{
                backgroundColor: colors.dark,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.darkBorder,
                marginBottom: 20,
                overflow: "hidden",
              }}
            >
              {/* Map placeholder visual */}
              <View
                style={{
                  height: 90,
                  backgroundColor: "#0d1117",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.darkBorder,
                }}
              >
                {[0.33, 0.67].map((f) => (
                  <View key={`h${f}`} style={{ position: "absolute", left: 0, right: 0, top: `${f * 100}%`, height: 1, backgroundColor: "rgba(255,255,255,0.04)" }} />
                ))}
                {[0.25, 0.5, 0.75].map((f) => (
                  <View key={`v${f}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${f * 100}%`, width: 1, backgroundColor: "rgba(255,255,255,0.04)" }} />
                ))}
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: `${catColor}22`,
                    borderWidth: 1.5,
                    borderColor: `${catColor}55`,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="location" size={16} color={catColor} />
                </View>
              </View>

              {/* Footer row */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Ionicons name="navigate-outline" size={16} color={colors.stone} />
                  <Text style={{ color: colors.white, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>
                    {event.venue}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(201,168,76,0.1)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: colors.stone, fontSize: 12, fontWeight: "600" }}>Directions</Text>
                  <Ionicons name="open-outline" size={12} color={colors.stone} />
                </View>
              </View>
            </Pressable>
          ) : null}

          {/* Description */}
          {event.description ? (
            <>
              <Text
                style={{
                  color: colors.white,
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 10,
                }}
              >
                About this Event
              </Text>
              <Text
                style={{
                  color: colors.grey,
                  fontSize: 14,
                  lineHeight: 22,
                  marginBottom: 20,
                }}
              >
                {event.description}
              </Text>
            </>
          ) : null}

          {/* External link */}
          {event.link_url ? (
            <Pressable
              onPress={() => Linking.openURL(event.link_url!)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.dark,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.darkBorder,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="open-outline" size={18} color={colors.stone} />
                <Text style={{ color: colors.stone, fontSize: 14, fontWeight: "600" }}>
                  Read More / Event Page
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.darkBorder} />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {/* Booking button */}
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
            <Text style={{ color: "#3D2800", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 }}>
              Activate to Book
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleBook}
            disabled={booking || (isFull && !userBooking)}
            style={{
              backgroundColor: userBooking
                ? "rgba(76,175,80,0.15)"
                : isFull
                ? "rgba(160,160,160,0.1)"
                : colors.stone,
              borderWidth: userBooking ? 1 : 0,
              borderColor: userBooking ? "rgba(76,175,80,0.4)" : undefined,
              borderRadius: 12,
              paddingVertical: 16,
              opacity: booking ? 0.7 : 1,
            }}
          >
            <Text
              style={{
                color: userBooking ? colors.green : isFull ? colors.grey : colors.black,
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              {booking ? "Please wait..." : userBooking ? "Booked — Cancel?" : isFull ? "Event Full" : "Book My Spot"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
