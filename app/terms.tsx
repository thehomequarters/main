import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "1. Eligibility",
    body: "HomeQuarters (\"HQ\") is an adults-only private members' community. You must be at least 21 years of age to apply for or hold membership. By submitting an application you confirm that you meet this requirement. HQ does not knowingly collect data from or grant access to persons under 21. If we become aware that a member is under 21, their account will be suspended immediately and the subscription cancelled with a pro-rata refund.",
  },
  {
    title: "2. Content Standards",
    body: "HomeQuarters is not an adult-content platform. All content shared within the app — including profile photos, messages, and any community contributions — must be suitable for a professional social setting. Sexually explicit material, graphic violence, hate speech, and harassment are strictly prohibited and will result in immediate permanent removal. No exceptions.",
  },
  {
    title: "3. Invitation & Application",
    body: "Membership requires a valid personal invitation from a current HQ member. Invitation codes are strictly non-transferable and single-use. Submitting false information during your application, or obtaining an invitation code by deception, constitutes grounds for immediate termination of membership.",
  },
  {
    title: "4. Membership Tiers & Billing",
    body: "HQ offers two recurring monthly subscription tiers: Gold (£5/month) and Platinum (£15/month). Subscriptions are billed monthly in advance. You may cancel at any time; cancellation takes effect at the end of the current billing period. HQ reserves the right to change pricing with 30 days' notice. Continued use after a price change constitutes acceptance of the new price.",
  },
  {
    title: "5. Benefits & Redemption",
    body: "Membership benefits — including venue deals, event access, and the Telecel Zimbabwe eSIM — are for your personal use only. Benefits may not be resold, gifted, or shared. One redemption per benefit per visit unless the specific benefit states otherwise. HQ partner venues and benefit offerings may change at any time without prior notice.",
  },
  {
    title: "6. Acceptable Use",
    body: "You agree not to use HomeQuarters to: send unsolicited commercial messages (spam); harass, threaten, or intimidate other members; impersonate any person or entity; collect or harvest other members' personal data; circumvent or abuse the nomination system; or engage in any activity that violates applicable UK, Zimbabwean, or local laws.",
  },
  {
    title: "7. Termination",
    body: "HQ may suspend or permanently revoke your membership at any time for breach of these Terms, the House Rules, or conduct deemed detrimental to the community — at HQ's sole discretion. Upon termination you will lose access to all membership benefits immediately. No refund is due for the remaining days of a billing period where termination results from a breach.",
  },
  {
    title: "8. Intellectual Property",
    body: "All content, branding, and design within the HomeQuarters app is the property of HomeQuarters Ltd. You may not reproduce, distribute, or create derivative works without express written permission. Your profile content remains yours; by posting it you grant HQ a limited licence to display it to other members within the platform.",
  },
  {
    title: "9. Limitation of Liability",
    body: "HomeQuarters is provided on an 'as is' basis. To the maximum extent permitted by law, HQ shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app or attendance at events. Our aggregate liability to you shall not exceed the total subscription fees paid in the 3 months preceding any claim.",
  },
  {
    title: "10. Governing Law",
    body: "These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the English courts. If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force.",
  },
  {
    title: "11. Changes to These Terms",
    body: "We may update these Terms from time to time. When we do, we will notify you via the app and update the date below. Continued use of HomeQuarters after changes take effect constitutes your acceptance of the revised Terms.",
  },
];

export default function TermsScreen() {
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
            Terms of Service
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
          By applying for or maintaining a HomeQuarters membership you agree to
          these Terms of Service and our House Rules. Please read them carefully.
          Membership is open to adults aged 21 and over only.
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

      {/* Contact */}
      <Text
        style={{
          color: colors.stone,
          fontSize: 12,
          textAlign: "center",
          marginTop: 12,
          paddingHorizontal: 40,
          lineHeight: 18,
          opacity: 0.7,
        }}
      >
        Questions about these Terms?{"\n"}Contact us at hello@homequarters.co.uk
      </Text>
    </ScrollView>
  );
}
