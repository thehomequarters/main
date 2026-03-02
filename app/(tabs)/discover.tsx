import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { MemberSuggestionCard } from "@/components/MemberSuggestionCard";
import { MEMBERS, industryFilters } from "@/data/members";
import type { MemberIndustry } from "@/data/members";

export default function DiscoverTab() {
  const [selectedIndustry, setSelectedIndustry] =
    useState<MemberIndustry | null>(null);

  const filteredMembers = selectedIndustry
    ? MEMBERS.filter((m) => m.industry === selectedIndustry)
    : MEMBERS;

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
          paddingBottom: 8,
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
          Discover
        </Text>
        <Text
          style={{
            color: colors.grey,
            fontSize: 14,
            marginTop: 4,
          }}
        >
          Find and connect with fellow members
        </Text>
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 20,
          marginTop: 16,
          marginBottom: 24,
          gap: 12,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.dark,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.gold,
              fontSize: 24,
              fontWeight: "800",
            }}
          >
            {MEMBERS.length}
          </Text>
          <Text
            style={{
              color: colors.grey,
              fontSize: 11,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            Suggestions
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.dark,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 24,
              fontWeight: "800",
            }}
          >
            6
          </Text>
          <Text
            style={{
              color: colors.grey,
              fontSize: 11,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            Industries
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.dark,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 24,
              fontWeight: "800",
            }}
          >
            1
          </Text>
          <Text
            style={{
              color: colors.grey,
              fontSize: 11,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            City
          </Text>
        </View>
      </View>

      {/* Industry filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
          marginBottom: 24,
        }}
      >
        {industryFilters.map((filter) => {
          const isSelected = selectedIndustry === filter.key;
          return (
            <Pressable
              key={filter.label}
              onPress={() => setSelectedIndustry(filter.key)}
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
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Section label */}
      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 16,
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
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          Suggested for You
        </Text>
      </View>

      {/* Member list */}
      {filteredMembers.map((member) => (
        <MemberSuggestionCard key={member.id} member={member} />
      ))}

      {filteredMembers.length === 0 && (
        <View
          style={{
            alignItems: "center",
            marginTop: 48,
            paddingHorizontal: 40,
          }}
        >
          <Ionicons
            name="people-outline"
            size={48}
            color={colors.darkBorder}
          />
          <Text
            style={{
              color: colors.grey,
              fontSize: 15,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            No members found in this industry.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
