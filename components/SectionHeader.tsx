import React from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "@/constants/theme";

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
          color: colors.dark,
          fontSize: 20,
          fontWeight: "700",
          letterSpacing: 0.3,
        }}
      >
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text
            style={{
              color: colors.stone,
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
