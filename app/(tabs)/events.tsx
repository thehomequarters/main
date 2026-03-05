import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { EventCard } from "@/components/EventCard";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useToast } from "@/components/Toast";
import { useRouter } from "expo-router";
import type { HQEvent, Booking, EventCategory } from "@/lib/database.types";

const EVENT_CATEGORIES: { key: EventCategory | null; label: string }[] = [
  { key: null, label: "All" },
  { key: "social", label: "Social" },
  { key: "dining", label: "Dining" },
  { key: "wellness", label: "Wellness" },
  { key: "music", label: "Music" },
  { key: "arts", label: "Arts" },
];

export default function EventsTab() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<HQEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>(
    {}
  );
  const [selectedCategory, setSelectedCategory] =
    useState<EventCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    // Fetch all active events
    const eventsQuery = query(
      collection(db, "events"),
      where("is_active", "==", true)
    );
    const eventsSnap = await getDocs(eventsQuery);
    const eventList = eventsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as HQEvent)
      .sort((a, b) => a.date.localeCompare(b.date));
    setEvents(eventList);

    // Fetch current user's bookings
    if (user?.uid) {
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("member_id", "==", user.uid)
      );
      const bookingsSnap = await getDocs(bookingsQuery);
      setBookings(
        bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)
      );
    }

    // Fetch booking counts per event
    const allBookingsSnap = await getDocs(collection(db, "bookings"));
    const counts: Record<string, number> = {};
    allBookingsSnap.docs.forEach((d) => {
      const eventId = d.data().event_id;
      counts[eventId] = (counts[eventId] || 0) + 1;
    });
    setBookingCounts(counts);

    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const isEventBooked = (eventId: string) =>
    bookings.some((b) => b.event_id === eventId);

  const handleBook = async (event: HQEvent) => {
    if (!user?.uid) return;

    if (isEventBooked(event.id)) {
      // Cancel booking
      Alert.alert(
        "Cancel Booking",
        `Remove your booking for "${event.title}"?`,
        [
          { text: "Keep", style: "cancel" },
          {
            text: "Cancel Booking",
            style: "destructive",
            onPress: async () => {
              const booking = bookings.find(
                (b) => b.event_id === event.id
              );
              if (booking) {
                await deleteDoc(doc(db, "bookings", booking.id));
                await fetchEvents();
              }
            },
          },
        ]
      );
      return;
    }

    // Check capacity
    const currentCount = bookingCounts[event.id] || 0;
    if (currentCount >= event.capacity) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast("This event has reached capacity.", "error");
      return;
    }

    Alert.alert(
      "Book Event",
      `Book your spot at "${event.title}" at ${event.venue}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Book",
          onPress: async () => {
            await addDoc(collection(db, "bookings"), {
              member_id: user.uid,
              event_id: event.id,
              created_at: new Date().toISOString(),
            });
            await fetchEvents();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast("You're on the list!", "success");
          },
        },
      ]
    );
  };

  // Split events into this week vs later this month
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

  const filteredEvents = selectedCategory
    ? events.filter((e) => e.category === selectedCategory)
    : events;

  const thisWeek = filteredEvents.filter(
    (e) => new Date(e.date) <= endOfWeek
  );
  const thisMonth = filteredEvents.filter(
    (e) => new Date(e.date) > endOfWeek
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: 80,
          paddingHorizontal: 20,
        }}
      >
        <SkeletonLoader width="40%" height={28} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="60%" height={14} style={{ marginBottom: 28 }} />
        <SkeletonLoader
          width="100%"
          height={280}
          borderRadius={16}
          style={{ marginBottom: 20 }}
        />
        <SkeletonLoader
          width="100%"
          height={280}
          borderRadius={16}
          style={{ marginBottom: 20 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.stone}
        />
      }
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 66,
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              color: colors.ink,
              fontSize: 34,
              fontFamily: fonts.display,
            }}
          >
            Events
          </Text>
          <Text
            style={{
              color: colors.stone,
              fontSize: 14,
              fontFamily: fonts.body,
              marginTop: 4,
            }}
          >
            Discover what's on
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/account" as any)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.sand,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "700" }}>
            {(profile?.first_name?.[0] ?? "")}{(profile?.last_name?.[0] ?? "")}
          </Text>
        </Pressable>
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 4,
          marginBottom: 28,
        }}
      >
        {EVENT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.label}
              onPress={() => setSelectedCategory(cat.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: isSelected ? 2 : 0,
                borderBottomColor: colors.gold,
              }}
            >
              <Text
                style={{
                  color: isSelected ? colors.ink : colors.stone,
                  fontSize: 13,
                  fontFamily: isSelected ? fonts.semibold : fonts.medium,
                }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* This Week */}
      {thisWeek.length > 0 && (
        <View style={{ marginBottom: 32 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text
              style={{
                color: colors.stone,
                fontSize: 10,
                fontFamily: fonts.semibold,
                textTransform: "uppercase",
                letterSpacing: 2.5,
              }}
            >
              This Week
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {thisWeek.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="full"
                attendees={bookingCounts[event.id] || 0}
                isBooked={isEventBooked(event.id)}
                onPress={() => router.push(`/event/${event.id}` as any)}
                onBook={() => handleBook(event)}
              />
            ))}
          </View>
        </View>
      )}

      {/* This Month */}
      {thisMonth.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text
              style={{
                color: colors.stone,
                fontSize: 10,
                fontFamily: fonts.semibold,
                textTransform: "uppercase",
                letterSpacing: 2.5,
              }}
            >
              Later This Month
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {thisMonth.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="full"
                attendees={bookingCounts[event.id] || 0}
                isBooked={isEventBooked(event.id)}
                onPress={() => router.push(`/event/${event.id}` as any)}
                onBook={() => handleBook(event)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Empty state */}
      {filteredEvents.length === 0 && (
        <View
          style={{
            alignItems: "center",
            marginTop: 60,
            paddingHorizontal: 40,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={48}
            color={colors.border}
          />
          <Text
            style={{
              color: colors.stone,
              fontSize: 15,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            No events in this category yet.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
