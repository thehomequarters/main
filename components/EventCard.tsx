import React from "react";
import { View, Text, Image, Pressable, Dimensions } from "react-native";
import { colors, fonts } from "@/constants/theme";
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
    borderRadius: 12,
    overflow: "hidden" as const,
    backgroundColor: colors.white,
    marginRight: isCompact ? 16 : 0,
    marginBottom: isCompact ? 0 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
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

        {/* Date badge — frosted, top-left */}
        <View
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            backgroundColor: "rgba(10,10,10,0.72)",
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 7,
            alignItems: "center",
            minWidth: 46,
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: isCompact ? 20 : 24,
              fontFamily: fonts.display,
              lineHeight: isCompact ? 22 : 26,
            }}
          >
            {day}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 8,
              fontFamily: fonts.semibold,
              letterSpacing: 1.5,
            }}
          >
            {month}
          </Text>
        </View>

        {/* Category badge — top-right, text only on frosted */}
        <View
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            backgroundColor: "rgba(10,10,10,0.5)",
            borderRadius: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 8,
              fontFamily: fonts.semibold,
              letterSpacing: 2,
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
            color: colors.ink,
            fontSize: isCompact ? 16 : 20,
            fontFamily: fonts.display,
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
              <Ionicons name="people-outline" size={13} color={colors.stone} />
              <Text
                style={{
                  color: colors.stone,
                  fontSize: 11,
                  fontFamily: fonts.body,
                }}
              >
                {attendees} going · {spotsLeft < 10 ? (
                  <Text style={{ color: colors.red }}>{spotsLeft} left</Text>
                ) : `${spotsLeft} left`}
              </Text>
            </View>

            {/* Book button */}
            <Pressable
              onPress={onBook}
              style={{
                backgroundColor: isBooked ? "transparent" : colors.ink,
                borderRadius: 4,
                paddingHorizontal: 18,
                paddingVertical: 9,
              }}
            >
              <Text
                style={{
                  color: isBooked ? colors.stone : colors.white,
                  fontSize: 11,
                  fontFamily: fonts.semibold,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                {isBooked ? "Attending" : "Reserve"}
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
