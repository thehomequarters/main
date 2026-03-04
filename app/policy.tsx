import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "1. Who We Are",
    body: "HomeQuarters (\"HQ\", \"we\", \"us\") is a private members' community operated by HomeQuarters Ltd, registered in England and Wales. This Privacy Policy explains how we collect, use, and protect your personal data when you use our mobile application.",
  },
  {
    title: "2. Who Can Use HQ",
    body: "HomeQuarters is open to adults aged 21 and over only. We do not knowingly collect personal data from persons under 21. If you believe a user under 21 has registered, please contact us at hello@homequarters.co.uk and we will take immediate action.",
  },
  {
    title: "3. Data We Collect",
    body: "We collect the following information when you apply for and use a membership:\n\n• Identity data: first name, last name\n• Contact data: email address, phone number (optional)\n• Profile data: title, bio, city, industry, interests, Instagram handle, LinkedIn handle, profile photo\n• Membership data: member code, membership tier, membership status, invitation code used\n• Device data: push notification token (if permission granted)\n• Usage data: deal redemption history, event bookings, connection activity\n• Payment data: subscription tier and status (payment card details are handled entirely by Stripe and are never stored by HQ)\n\nAll data is stored securely in Google Firebase (Firestore and Storage).",
  },
  {
    title: "4. How We Use Your Data",
    body: "We use your data to:\n\n• Operate and maintain your membership account\n• Display your profile to other active members (subject to your privacy settings)\n• Process subscription payments via Stripe\n• Send push notifications about messages, connection requests, and membership updates\n• Facilitate event bookings and deal redemptions\n• Communicate with you about your membership\n• Maintain the safety and integrity of the community\n\nWe do not use your data for advertising, and we do not sell your data to third parties.",
  },
  {
    title: "5. Your Privacy Controls",
    body: "You control what other members can see about you. From Account > Privacy you can:\n\n• Hide your city from other members\n• Hide your industry from other members\n• Hide your interests from other members\n• Hide your Instagram and LinkedIn links\n• Restrict direct messages to connections only\n\nYour name and profile photo are always visible to active members as part of the community experience.",
  },
  {
    title: "6. Third-Party Services",
    body: "We share limited data with the following trusted third parties:\n\n• Google Firebase — secure storage of all profile and account data\n• Stripe — payment processing (card details never touch our servers)\n• Airalo — eSIM fulfilment for Platinum members who opt in\n• OpenStreetMap — anonymous venue map requests\n• Unsplash — venue imagery CDN\n\nEach provider operates under its own privacy policy and data processing agreements.",
  },
  {
    title: "7. Data Retention",
    body: "We retain your personal data for as long as your membership is active. If you cancel your membership or your account is terminated, we will delete or anonymise your personal data within 90 days, except where we are required by law to retain it for longer (e.g. billing records, which we retain for 7 years under UK tax law).",
  },
  {
    title: "8. Your Rights",
    body: "Under UK GDPR you have the right to:\n\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your data (right to erasure)\n• Object to or restrict certain processing\n• Data portability\n\nTo exercise any of these rights, email hello@homequarters.co.uk. We will respond within 30 days.",
  },
  {
    title: "9. Data Security",
    body: "We take reasonable technical and organisational measures to protect your data, including HTTPS for all data in transit and Firebase security rules to restrict access. However, no system is completely secure and we cannot guarantee the absolute security of your information.",
  },
  {
    title: "10. Push Notifications",
    body: "If you grant notification permission, we store your device push token in Firestore to send you alerts about messages, connection requests, and membership updates. You can revoke notification permission at any time in your device settings.",
  },
  {
    title: "11. Content Policy",
    body: "HomeQuarters is not an adult-content platform. All content shared within the app must be appropriate for a professional social setting. No sexually explicit material, graphic violence, or illegal content is permitted. Violations result in immediate account termination.",
  },
  {
    title: "12. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you via the app when we make material changes. The date at the top of this page shows when the policy was last updated.",
  },
  {
    title: "13. Contact Us",
    body: "If you have questions or concerns about this Privacy Policy or how we handle your data, please contact:\n\nHomeQuarters Ltd\nhello@homequarters.co.uk",
  },
];

export default function PolicyScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
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
            backgroundColor: colors.sand,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.dark} />
        </Pressable>
        <View>
          <Text style={{ color: colors.dark, fontSize: 24, fontWeight: "700" }}>
            Privacy Policy
          </Text>
          <Text style={{ color: colors.stone, fontSize: 13, marginTop: 2 }}>
            Last updated March 2026
          </Text>
        </View>
      </View>

      {/* Intro banner */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 20,
          marginBottom: 24,
          backgroundColor: colors.sand,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 18,
        }}
      >
        <Text
          style={{
            color: colors.dark,
            fontSize: 14,
            lineHeight: 21,
            fontWeight: "500",
          }}
        >
          Your privacy matters to us. This policy explains what data we collect,
          why we collect it, and how you stay in control. HomeQuarters is for
          adults aged 21 and over and is not an adult-content platform.
        </Text>
      </View>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <View
          key={section.title}
          style={{
            marginHorizontal: 20,
            marginBottom: 12,
            backgroundColor: colors.white,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
          }}
        >
          <Text
            style={{
              color: colors.dark,
              fontSize: 14,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            {section.title}
          </Text>
          <Text
            style={{
              color: colors.stone,
              fontSize: 13,
              lineHeight: 20,
            }}
          >
            {section.body}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
