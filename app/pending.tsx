import React from "react";
import { View, Text } from "react-native";
import { colors } from "@/constants/theme";

export default function PendingScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.black,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
      }}
    >
      <Text
        style={{
          color: colors.gold,
          fontSize: 40,
          fontWeight: "700",
          letterSpacing: 8,
          marginBottom: 48,
        }}
      >
        HQ
      </Text>

      <Text
        style={{
          color: colors.white,
          fontSize: 20,
          fontWeight: "600",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Your application is under review.
      </Text>

      <Text
        style={{
          color: colors.grey,
          fontSize: 14,
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        We will be in touch.
      </Text>
    </View>
  );
}
