import React from "react";
import { View, Text, Image, Pressable, Dimensions } from "react-native";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { HQEvent } from "@/lib/database.types";

interface EventCardProps {
  event: HQEvent;
  variant?: "compact" | "full";
  attendees?: number;
  isBooked?: boolean;
  onPress?: () => void;
  onBook?: () => void;
}

function formatDate(dateStr: string): { day: string; month: string; weekday: string } {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDate().toString();
  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return { day, month, weekday };
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export function EventCard({
  event,
  variant = "full",
  attendees = 0,
  isBooked = false,
  onPress,
  onBook,
}: EventCardProps) {
  const screenWidth = Dimensions.get("window").width;
  const isCompact = variant === "compact";
  const cardWidth = isCompact ? screenWidth * 0.72 : screenWidth - 40;
  const { day, month, weekday } = formatDate(event.date);
  const spotsLeft = event.capacity - attendees;

  const cardStyle = {
    width: cardWidth,
    borderRadius: 16,
    overflow: "hidden" as const,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: isCompact ? 16 : 0,
    marginBottom: isCompact ? 0 : 20,
  };

  const inner = (
    <>
      {/* Image */}
      <View style={{ height: isCompact ? 140 : 180, position: "relative" }}>
        <Image
          source={{ uri: event.image_url }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        {/* Gradient */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />

        {/* Date badge — dark bg, white text, top-left */}
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: colors.dark,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 6,
            alignItems: "center",
            minWidth: 48,
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 18,
              fontWeight: "800",
              lineHeight: 20,
            }}
          >
            {day}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 9,
              fontWeight: "600",
              letterSpacing: 1,
            }}
          >
            {month}
          </Text>
        </View>

        {/* Category badge — sand bg, dark text, top-right */}
        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: colors.sand,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              color: colors.dark,
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {event.category}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            color: colors.dark,
            fontSize: isCompact ? 16 : 18,
            fontWeight: "700",
            marginBottom: 6,
          }}
          numberOfLines={isCompact ? 1 : 2}
        >
          {event.title}
        </Text>

        {/* Venue & time */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: isCompact ? 0 : 12,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons
              name="location-outline"
              size={13}
              color={colors.stone}
            />
            <Text style={{ color: colors.stone, fontSize: 12 }}>
              {event.venue}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="time-outline" size={13} color={colors.stone} />
            <Text style={{ color: colors.stone, fontSize: 12 }}>
              {weekday} {formatTime(event.time)}
            </Text>
          </View>
        </View>

        {/* Bottom row (full only) */}
        {!isCompact && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            {/* Attendees */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={colors.stone}
                />
                <Text
                  style={{
                    color: colors.stone,
                    fontSize: 12,
                    marginLeft: 4,
                  }}
                >
                  {attendees} going
                </Text>
              </View>
              <Text style={{ color: colors.border, fontSize: 12 }}>
                ·
              </Text>
              <Text
                style={{
                  color: spotsLeft < 10 ? colors.red : colors.stone,
                  fontSize: 12,
                }}
              >
                {spotsLeft} spots left
              </Text>
            </View>

            {/* Book button */}
            <Pressable
              onPress={onBook}
              style={{
                backgroundColor: isBooked
                  ? "rgba(46, 125, 50, 0.12)"
                  : colors.dark,
                borderWidth: isBooked ? 1 : 0,
                borderColor: isBooked
                  ? "rgba(46, 125, 50, 0.3)"
                  : "transparent",
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  color: isBooked ? colors.green : colors.white,
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                }}
              >
                {isBooked ? "Booked" : "Book"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={cardStyle}>
        {inner}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      {inner}
    </View>
  );
}
