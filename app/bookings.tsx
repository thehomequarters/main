import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import type { HQEvent, Booking } from "@/lib/database.types";

export default function BookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<(Booking & { event?: HQEvent })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user?.uid) return;

    // Fetch user's bookings
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("member_id", "==", user.uid)
    );
    const bookingsSnap = await getDocs(bookingsQuery);
    const bookingList = bookingsSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Booking
    );

    // Fetch all events to match
    const eventsSnap = await getDocs(collection(db, "events"));
    const eventsMap: Record<string, HQEvent> = {};
    eventsSnap.docs.forEach((d) => {
      eventsMap[d.id] = { id: d.id, ...d.data() } as HQEvent;
    });

    // Combine and sort by event date
    const combined = bookingList
      .map((b) => ({
        ...b,
        event: eventsMap[b.event_id],
      }))
      .sort((a, b) => {
        const dateA = a.event?.date ?? "";
        const dateB = b.event?.date ?? "";
        return dateA.localeCompare(dateB);
      });

    setBookings(combined);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const handleCancelBooking = (booking: Booking & { event?: HQEvent }) => {
    Alert.alert(
      "Cancel Booking",
      `Remove your booking for "${booking.event?.title ?? "this event"}"?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            await deleteDoc(doc(db, "bookings", booking.id));
            setBookings((prev) => prev.filter((b) => b.id !== booking.id));
          },
        },
      ]
    );
  };

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.event && new Date(b.event.date) >= now
  );
  const past = bookings.filter(
    (b) => b.event && new Date(b.event.date) < now
  );

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.gold}
        />
      }
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.dark,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </Pressable>
        <View>
          <Text
            style={{
              color: colors.white,
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            My Bookings
          </Text>
          <Text style={{ color: colors.grey, fontSize: 13, marginTop: 2 }}>
            {bookings.length} event{bookings.length !== 1 ? "s" : ""} booked
          </Text>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 14 }}>
          <SkeletonLoader width="100%" height={100} borderRadius={16} />
          <SkeletonLoader width="100%" height={100} borderRadius={16} />
          <SkeletonLoader width="100%" height={100} borderRadius={16} />
        </View>
      )}

      {/* Empty state */}
      {!loading && bookings.length === 0 && (
        <View
          style={{
            alignItems: "center",
            marginTop: 80,
            paddingHorizontal: 40,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={56}
            color={colors.darkBorder}
          />
          <Text
            style={{
              color: colors.grey,
              fontSize: 16,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 22,
            }}
          >
            No bookings yet. Browse events and reserve your spot!
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/events")}
            style={{
              marginTop: 20,
              backgroundColor: colors.gold,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                color: colors.black,
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              Browse Events
            </Text>
          </Pressable>
        </View>
      )}

      {/* Upcoming bookings */}
      {!loading && upcoming.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <View
            style={{
              paddingHorizontal: 20,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 4,
                height: 20,
                borderRadius: 2,
                backgroundColor: colors.gold,
              }}
            />
            <Text
              style={{
                color: colors.white,
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              Upcoming
            </Text>
          </View>

          {upcoming.map((booking) => {
            const event = booking.event!;
            const eventDate = new Date(event.date);
            const day = eventDate.getDate();
            const month = eventDate
              .toLocaleDateString("en-GB", { month: "short" })
              .toUpperCase();

            return (
              <View
                key={booking.id}
                style={{
                  backgroundColor: colors.dark,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.darkBorder,
                  marginHorizontal: 20,
                  marginBottom: 12,
                  padding: 16,
                  flexDirection: "row",
                  gap: 14,
                }}
              >
                {/* Date badge */}
                <View
                  style={{
                    width: 52,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: "rgba(201, 168, 76, 0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(201, 168, 76, 0.2)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.gold,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    {day}
                  </Text>
                  <Text
                    style={{
                      color: colors.gold,
                      fontSize: 10,
                      fontWeight: "600",
                      letterSpacing: 1,
                    }}
                  >
                    {month}
                  </Text>
                </View>

                {/* Event info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 15,
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {event.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 2,
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color={colors.grey}
                    />
                    <Text style={{ color: colors.grey, fontSize: 12 }}>
                      {event.venue}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={colors.grey}
                    />
                    <Text style={{ color: colors.grey, fontSize: 12 }}>
                      {formatDate(event.date)} · {event.time}
                    </Text>
                  </View>
                </View>

                {/* Cancel button */}
                <Pressable
                  onPress={() => handleCancelBooking(booking)}
                  style={{
                    alignSelf: "center",
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "rgba(229, 57, 53, 0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(229, 57, 53, 0.2)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="close" size={16} color={colors.red} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* Past bookings */}
      {!loading && past.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <View
            style={{
              paddingHorizontal: 20,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 4,
                height: 20,
                borderRadius: 2,
                backgroundColor: colors.grey,
              }}
            />
            <Text
              style={{
                color: colors.grey,
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              Past
            </Text>
          </View>

          {past.map((booking) => {
            const event = booking.event!;
            const eventDate = new Date(event.date);
            const day = eventDate.getDate();
            const month = eventDate
              .toLocaleDateString("en-GB", { month: "short" })
              .toUpperCase();

            return (
              <View
                key={booking.id}
                style={{
                  backgroundColor: colors.dark,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.darkBorder,
                  marginHorizontal: 20,
                  marginBottom: 12,
                  padding: 16,
                  flexDirection: "row",
                  gap: 14,
                  opacity: 0.6,
                }}
              >
                {/* Date badge */}
                <View
                  style={{
                    width: 52,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: "rgba(160, 160, 160, 0.08)",
                    borderWidth: 1,
                    borderColor: colors.darkBorder,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.grey,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    {day}
                  </Text>
                  <Text
                    style={{
                      color: colors.grey,
                      fontSize: 10,
                      fontWeight: "600",
                      letterSpacing: 1,
                    }}
                  >
                    {month}
                  </Text>
                </View>

                {/* Event info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 15,
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {event.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 2,
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color={colors.grey}
                    />
                    <Text style={{ color: colors.grey, fontSize: 12 }}>
                      {event.venue}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.grey,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {formatDate(event.date)}
                  </Text>
                </View>

                {/* Attended badge */}
                <View
                  style={{
                    alignSelf: "center",
                    backgroundColor: "rgba(76, 175, 80, 0.12)",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      color: colors.green,
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 0.5,
                    }}
                  >
                    ATTENDED
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
