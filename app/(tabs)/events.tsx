import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Alert,
} from "react-native";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { EventCard } from "@/components/EventCard";
import { SectionHeader } from "@/components/SectionHeader";
import {
  EVENTS,
  getThisWeekEvents,
  getThisMonthEvents,
  eventCategories,
} from "@/data/events";
import type { EventCategory, HQEvent } from "@/data/events";

export default function EventsTab() {
  const [selectedCategory, setSelectedCategory] =
    useState<EventCategory | null>(null);

  const thisWeek = getThisWeekEvents();
  const thisMonth = getThisMonthEvents();

  const filterEvents = (events: HQEvent[]) => {
    if (!selectedCategory) return events;
    return events.filter((e) => e.category === selectedCategory);
  };

  const filteredThisWeek = filterEvents(thisWeek);
  const filteredThisMonth = filterEvents(thisMonth);

  const handleBook = (event: HQEvent) => {
    if (event.is_booked) {
      Alert.alert("Already Booked", "You've already booked this event.");
      return;
    }
    Alert.alert(
      "Book Event",
      `Would you like to book "${event.title}" at ${event.venue}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Book",
          onPress: () => Alert.alert("Confirmed", "You're on the list!"),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 66,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            color: colors.white,
            fontSize: 30,
            fontWeight: "700",
            letterSpacing: 0.3,
          }}
        >
          Events
        </Text>
        <Text
          style={{
            color: colors.grey,
            fontSize: 14,
            marginTop: 4,
          }}
        >
          Discover what's happening in Harare
        </Text>
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
          marginBottom: 28,
        }}
      >
        {eventCategories.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.label}
              onPress={() => setSelectedCategory(cat.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isSelected
                  ? colors.gold
                  : "rgba(160, 160, 160, 0.25)",
                backgroundColor: isSelected
                  ? "rgba(201, 168, 76, 0.12)"
                  : "transparent",
              }}
            >
              <Text
                style={{
                  color: isSelected ? colors.gold : colors.grey,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* This Week */}
      {filteredThisWeek.length > 0 && (
        <View style={{ marginBottom: 32 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View
              style={{
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
                  fontSize: 20,
                  fontWeight: "700",
                  letterSpacing: 0.3,
                }}
              >
                This Week
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {filteredThisWeek.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="full"
                onBook={() => handleBook(event)}
              />
            ))}
          </View>
        </View>
      )}

      {/* This Month */}
      {filteredThisMonth.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View
              style={{
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
                  color: colors.white,
                  fontSize: 20,
                  fontWeight: "700",
                  letterSpacing: 0.3,
                }}
              >
                Later This Month
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {filteredThisMonth.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="full"
                onBook={() => handleBook(event)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Empty state */}
      {filteredThisWeek.length === 0 && filteredThisMonth.length === 0 && (
        <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 40 }}>
          <Ionicons name="calendar-outline" size={48} color={colors.darkBorder} />
          <Text
            style={{
              color: colors.grey,
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
