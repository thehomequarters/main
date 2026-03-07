import React from "react";
import { View, Text, Pressable } from "react-native";
import { colors, fonts } from "@/constants/theme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          color: colors.stone,
          fontSize: 10,
          fontFamily: fonts.semibold,
          textTransform: "uppercase",
          letterSpacing: 2.5,
        }}
      >
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text
            style={{
              color: colors.gold,
              fontSize: 10,
              fontFamily: fonts.semibold,
              textTransform: "uppercase",
              letterSpacing: 2.5,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
