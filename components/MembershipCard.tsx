import React from "react";
import { View, Text } from "react-native";
import { colors } from "@/constants/theme";

interface MembershipCardProps {
  firstName: string;
  lastName: string;
  memberCode: string;
  status: string;
}

export function MembershipCard({
  firstName,
  lastName,
  memberCode,
  status,
}: MembershipCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.dark,
        borderRadius: 16,
        padding: 28,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* HQ Logo */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        <Text
          style={{
            color: colors.gold,
            fontSize: 28,
            fontWeight: "700",
            letterSpacing: 4,
          }}
        >
          HQ
        </Text>
        <View
          style={{
            backgroundColor: status === "active" ? "rgba(76, 175, 80, 0.15)" : "rgba(201, 168, 76, 0.15)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              color: status === "active" ? colors.green : colors.gold,
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {status}
          </Text>
        </View>
      </View>

      {/* Member Name */}
      <Text
        style={{
          color: colors.white,
          fontSize: 20,
          fontWeight: "600",
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {firstName} {lastName}
      </Text>

      {/* Member Code */}
      <Text
        style={{
          color: colors.grey,
          fontSize: 13,
          letterSpacing: 2,
          fontWeight: "400",
        }}
      >
        {memberCode}
      </Text>

      {/* Bottom accent line */}
      <View
        style={{
          height: 2,
          backgroundColor: colors.gold,
          borderRadius: 1,
          marginTop: 24,
          opacity: 0.4,
        }}
      />
    </View>
  );
}
