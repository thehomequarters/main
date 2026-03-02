import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "Information We Collect",
    content:
      "We collect information you provide when creating your account, including your name, email address, phone number, city, industry, and profile photo. We also collect data about your activity within the app, including event bookings, venue redemptions, connections, and messages.",
  },
  {
    title: "How We Use Your Information",
    content:
      "Your information is used to provide and improve the HomeQuarters service, facilitate connections between members, process event bookings and venue benefit redemptions, and communicate important updates about your membership.",
  },
  {
    title: "Information Sharing",
    content:
      "Your profile information (name, title, city, industry, and interests) is visible to other active HQ members to facilitate networking. We do not sell your personal data to third parties. We may share anonymised, aggregated data with partner venues to improve the member experience.",
  },
  {
    title: "Data Storage & Security",
    content:
      "Your data is stored securely using Google Firebase infrastructure, which provides enterprise-grade security, encryption at rest and in transit, and compliance with international data protection standards.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, correct, or delete your personal data at any time. You can update your profile information directly in the app, or contact us to request full account deletion. We will process deletion requests within 30 days.",
  },
  {
    title: "Messages & Communications",
    content:
      "Direct messages between members are stored to provide the messaging service. We do not read or monitor private conversations. Message data is deleted if you request account deletion.",
  },
  {
    title: "Cookies & Analytics",
    content:
      "We use basic analytics to understand app usage patterns and improve the service. We do not use third-party advertising trackers. You can opt out of analytics in your device settings.",
  },
  {
    title: "Changes to This Policy",
    content:
      "We may update this privacy policy from time to time. You will be notified of significant changes through the app. Continued use of HomeQuarters after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact Us",
    content:
      "For privacy-related questions or to exercise your data rights, contact us at privacy@homequarters.app.",
  },
];

export default function PrivacyScreen() {
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
            Privacy Policy
          </Text>
          <Text style={{ color: colors.grey, fontSize: 13, marginTop: 2 }}>
            How we handle your data
          </Text>
        </View>
      </View>

      {/* Last updated */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 20,
          marginBottom: 24,
          backgroundColor: "rgba(201, 168, 76, 0.08)",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "rgba(201, 168, 76, 0.15)",
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Ionicons name="shield-checkmark" size={18} color={colors.gold} />
        <Text style={{ color: colors.gold, fontSize: 13, fontWeight: "500" }}>
          Last updated: March 2026
        </Text>
      </View>

      {/* Sections */}
      {SECTIONS.map((section, index) => (
        <View
          key={section.title}
          style={{
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            {index + 1}. {section.title}
          </Text>
          <Text
            style={{
              color: colors.grey,
              fontSize: 13,
              lineHeight: 21,
            }}
          >
            {section.content}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
