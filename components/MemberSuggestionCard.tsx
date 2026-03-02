import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { MemberSuggestion } from "@/data/members";

interface MemberSuggestionCardProps {
  member: MemberSuggestion;
  onPress?: () => void;
}

export function MemberSuggestionCard({
  member,
  onPress,
}: MemberSuggestionCardProps) {
  const [connected, setConnected] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.dark,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        padding: 18,
        marginBottom: 14,
        marginHorizontal: 20,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        {/* Avatar */}
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "rgba(201, 168, 76, 0.12)",
            borderWidth: 1.5,
            borderColor: "rgba(201, 168, 76, 0.25)",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 14,
          }}
        >
          <Text
            style={{
              color: colors.gold,
              fontSize: 17,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            {member.initials}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.white,
              fontSize: 15,
              fontWeight: "600",
              marginBottom: 2,
            }}
          >
            {member.name}
          </Text>
          <Text
            style={{
              color: colors.grey,
              fontSize: 12,
              marginBottom: 6,
            }}
            numberOfLines={1}
          >
            {member.title}
          </Text>

          {/* Location + mutual */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <Ionicons
                name="location-outline"
                size={12}
                color={colors.grey}
              />
              <Text style={{ color: colors.grey, fontSize: 11 }}>
                {member.city}
              </Text>
            </View>
            {member.mutual_connections > 0 && (
              <>
                <Text
                  style={{ color: colors.darkBorder, fontSize: 11 }}
                >
                  ·
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Ionicons
                    name="people-outline"
                    size={12}
                    color={colors.gold}
                  />
                  <Text
                    style={{
                      color: colors.gold,
                      fontSize: 11,
                      fontWeight: "500",
                    }}
                  >
                    {member.mutual_connections} mutual
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Interests */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {member.interests.map((interest) => (
              <View
                key={interest}
                style={{
                  backgroundColor: "rgba(160, 160, 160, 0.1)",
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    color: colors.grey,
                    fontSize: 10,
                    fontWeight: "500",
                  }}
                >
                  {interest}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Connect button */}
        <Pressable
          onPress={() => setConnected(!connected)}
          style={{
            backgroundColor: connected
              ? "rgba(76, 175, 80, 0.15)"
              : "rgba(201, 168, 76, 0.12)",
            borderWidth: 1,
            borderColor: connected
              ? "rgba(76, 175, 80, 0.3)"
              : "rgba(201, 168, 76, 0.25)",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            marginTop: 4,
          }}
        >
          <Text
            style={{
              color: connected ? colors.green : colors.gold,
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            {connected ? "Connected" : "Connect"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
