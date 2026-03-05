import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { colors, categories } from "@/constants/theme";
import type { VenueCategory } from "@/constants/theme";

interface CategoryPillsProps {
  selected: VenueCategory | null;
  onSelect: (category: VenueCategory | null) => void;
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
    >
      <Pressable
        onPress={() => onSelect(null)}
        style={{
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: selected === null ? colors.stone : colors.darkBorder,
          backgroundColor: selected === null ? "rgba(201, 168, 76, 0.1)" : "transparent",
        }}
      >
        <Text
          style={{
            color: selected === null ? colors.stone : colors.grey,
            fontSize: 13,
            fontWeight: "500",
            letterSpacing: 0.5,
          }}
        >
          All
        </Text>
      </Pressable>
      {categories.map((cat) => (
        <Pressable
          key={cat.key}
          onPress={() => onSelect(cat.key as VenueCategory)}
          style={{
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 24,
            borderWidth: 1,
            borderColor:
              selected === cat.key ? colors.stone : colors.darkBorder,
            backgroundColor:
              selected === cat.key ? "rgba(201, 168, 76, 0.1)" : "transparent",
          }}
        >
          <Text
            style={{
              color: selected === cat.key ? colors.stone : colors.grey,
              fontSize: 13,
              fontWeight: "500",
              letterSpacing: 0.5,
            }}
          >
            {cat.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
