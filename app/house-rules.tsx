import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const RULES = [
  {
    title: "Respect Every Member",
    description:
      "HQ is a space built on mutual respect. Treat every member, guest, and venue staff with courtesy and dignity. Discrimination, harassment, or intimidation of any kind will not be tolerated.",
    icon: "heart-outline" as const,
  },
  {
    title: "Honour the Space",
    description:
      "Our partner venues open their doors to us — treat them as you would your own home. Leave spaces as you found them, respect venue rules, and tip generously.",
    icon: "home-outline" as const,
  },
  {
    title: "Keep It Confidential",
    description:
      "What happens at HQ stays at HQ. Do not share other members' personal information, conversations, or photos without their explicit consent.",
    icon: "lock-closed-outline" as const,
  },
  {
    title: "Be Present, Be Real",
    description:
      "HQ is about genuine connection. Show up authentically, engage meaningfully, and support fellow members in their journeys. No spam, no hustling, no unsolicited pitches.",
    icon: "people-outline" as const,
  },
  {
    title: "Redeem Responsibly",
    description:
      "Member benefits are for personal use only. Do not abuse, resell, or share your QR codes. One redemption per benefit per visit unless stated otherwise.",
    icon: "qr-code-outline" as const,
  },
  {
    title: "Represent the Culture",
    description:
      "As an HQ member, you represent the community. Whether at events or partner venues, carry yourself with pride and embody the values of the diaspora.",
    icon: "flag-outline" as const,
  },
  {
    title: "Report, Don't Retaliate",
    description:
      "If you experience or witness behaviour that violates these rules, report it to the HQ team immediately. We handle all reports confidentially and fairly.",
    icon: "shield-checkmark-outline" as const,
  },
  {
    title: "Membership Can Be Revoked",
    description:
      "Violation of these rules may result in the immediate suspension or permanent revocation of your HomeQuarters membership — regardless of tier. Your access is a privilege upheld by your conduct, not a right guaranteed by your subscription.",
    icon: "ban-outline" as const,
  },
];

export default function HouseRulesScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.dark,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </Pressable>
        <View>
          <Text
            style={{
              color: colors.white,
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            House Rules
          </Text>
          <Text style={{ color: colors.grey, fontSize: 13, marginTop: 2 }}>
            The code we live by
          </Text>
        </View>
      </View>

      {/* Intro */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 20,
          marginBottom: 24,
          backgroundColor: "rgba(201, 168, 76, 0.08)",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "rgba(201, 168, 76, 0.15)",
          padding: 18,
        }}
      >
        <Text
          style={{
            color: colors.gold,
            fontSize: 14,
            lineHeight: 21,
            fontWeight: "500",
          }}
        >
          HomeQuarters is more than an app — it's a community. These rules exist
          to protect the culture we're building together. By being a member, you
          agree to uphold them.
        </Text>
      </View>

      {/* Rules */}
      {RULES.map((rule, index) => {
        const isRevocation = index === RULES.length - 1;
        return (
          <View
            key={rule.title}
            style={{
              flexDirection: "row",
              marginHorizontal: 20,
              marginBottom: 16,
              backgroundColor: isRevocation
                ? "rgba(229, 57, 53, 0.06)"
                : colors.dark,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isRevocation
                ? "rgba(229, 57, 53, 0.25)"
                : colors.darkBorder,
              padding: 16,
              gap: 14,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: isRevocation
                  ? "rgba(229, 57, 53, 0.12)"
                  : "rgba(201, 168, 76, 0.1)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={rule.icon}
                size={18}
                color={isRevocation ? "#E53935" : colors.gold}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: isRevocation ? "#E53935" : colors.white,
                  fontSize: 15,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                {index + 1}. {rule.title}
              </Text>
              <Text
                style={{
                  color: colors.grey,
                  fontSize: 13,
                  lineHeight: 20,
                }}
              >
                {rule.description}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Footer */}
      <Text
        style={{
          color: colors.grey,
          fontSize: 12,
          textAlign: "center",
          marginTop: 8,
          paddingHorizontal: 40,
          lineHeight: 18,
          opacity: 0.7,
        }}
      >
        These rules apply equally to all membership tiers — Gold Card, Platinum
        Card, Founding Member, and Committee Member. Last updated March 2026.
      </Text>
    </ScrollView>
  );
}
