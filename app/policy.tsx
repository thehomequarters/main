import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "1. Who We Are",
    body: "HomeQuarters (\"HQ\", \"we\", \"us\", \"our\") is a private members' community operated by HomeQuarters Ltd, registered in England and Wales. We are the data controller for the personal data you provide when using our mobile application.\n\nThis Privacy Policy explains what personal data we collect, the legal basis on which we process it, how we use and protect it, and your rights. It applies to all members and applicants worldwide.",
  },
  {
    title: "2. Who Can Use HQ",
    body: "HomeQuarters is open to adults aged 21 and over only. We do not knowingly collect personal data from persons under 21. If you believe a user under 21 has registered, please contact hello@thehomequarters.com immediately and we will take action within 24 hours, including deleting any data collected.",
  },
  {
    title: "3. Data We Collect",
    body: "We collect the following categories of personal data:\n\n• Identity data: first name, last name, profile photo\n• Contact data: email address, phone number (optional)\n• Profile data: title, bio, city, industry, interests, Instagram handle, LinkedIn handle\n• Membership data: member code, membership tier, membership status, invitation code used, vouch history\n• Device data: push notification token (only if you grant permission)\n• Usage data: deal redemption history, connection activity, message metadata (not message content)\n• Communication preferences: marketing opt-in status\n• Payment data: subscription tier, billing status, and Stripe customer ID (payment card details are processed entirely by Stripe and never stored by HQ)\n\nWe do not collect sensitive special-category data (such as health, religion, or biometric data). We do not collect data from children under 21.",
  },
  {
    title: "4. Legal Basis for Processing",
    body: "Under UK GDPR, we process your data on the following legal bases:\n\n• Contract (Article 6(1)(b)): processing necessary to provide your membership, including account management, payment processing, and displaying your profile to other members.\n\n• Legitimate interests (Article 6(1)(f)): maintaining the security and integrity of the platform, preventing fraud, and operating the nomination/vouching system. We have assessed that our legitimate interests are not overridden by your rights.\n\n• Consent (Article 6(1)(a)): sending marketing communications where you opted in during your application. You may withdraw this consent at any time.\n\n• Legal obligation (Article 6(1)(c)): retaining billing records as required by UK tax law.",
  },
  {
    title: "5. How We Use Your Data",
    body: "We use your personal data to:\n\n• Create and manage your membership account\n• Verify your eligibility and process your application\n• Display your profile to other active members (subject to your privacy settings)\n• Process subscription payments and manage billing via Stripe\n• Send push notifications about messages, connection requests, and membership updates\n• Facilitate deal redemptions and benefit access\n• Send transactional emails about your membership (e.g. approval, suspension, billing)\n• Send marketing emails if you opted in (you may opt out at any time)\n• Maintain the safety, integrity, and quality of the community\n• Comply with legal obligations\n\nWe do not use your data for advertising, profiling for commercial purposes, or sell your data to any third party.",
  },
  {
    title: "6. Your Privacy Controls",
    body: "You control what other members can see about you. From Account > Privacy you can:\n\n• Set profile visibility to Everyone or Connections only\n• Hide your city from other members\n• Hide your industry from other members\n• Hide your interests from other members\n• Hide your Instagram and LinkedIn links\n• Restrict direct messages to connections only\n\nYour first name and profile photo are always visible to active members as part of the community experience and cannot be hidden. You may update your profile information at any time from Account > Edit Profile.",
  },
  {
    title: "7. Third-Party Data Processors",
    body: "We share limited personal data with the following trusted processors, each bound by data processing agreements:\n\n• Google Firebase (Google LLC, USA) — secure storage of profile and account data in Firestore and Firebase Storage. Data is transferred to the USA under Google's Standard Contractual Clauses.\n\n• Stripe (Stripe, Inc., USA) — payment processing. Stripe processes payment card details; HQ only receives your Stripe customer ID and subscription status. Transferred under Stripe's Standard Contractual Clauses.\n\n• Resend (Resend Inc., USA) — transactional and marketing email delivery. We share your email address and name for the purpose of sending emails on our behalf.\n\n• Expo / Expo Push Notifications — delivery of push notifications to your device using your push token.\n\n• Airalo — eSIM fulfilment for eligible Platinum members who opt in. We share your email address with Airalo solely for eSIM delivery.\n\n• OpenStreetMap Foundation — anonymous map tile requests for venue locations. No personal data is shared.\n\nWe do not share your data with any other third parties without your explicit consent, except where required by law.",
  },
  {
    title: "8. International Data Transfers",
    body: "HQ is based in England and Wales. Some of our third-party processors (including Google Firebase, Stripe, and Resend) are based in the USA. When we transfer your data outside the UK, we ensure appropriate safeguards are in place, specifically Standard Contractual Clauses approved by the UK Information Commissioner's Office (ICO) or an equivalent transfer mechanism. By using HomeQuarters you acknowledge that your data may be transferred to and processed in the United States and other countries.",
  },
  {
    title: "9. Data Retention",
    body: "We retain your personal data for as long as your membership is active. If you cancel your membership or your account is terminated:\n\n• Your profile data and usage data will be deleted or anonymised within 90 days\n• Your email address will be retained on a suppression list to honour any opt-out preferences\n• Billing and transaction records will be retained for 7 years as required by UK tax law\n• Where your account was terminated due to a breach, we may retain a record of the termination for up to 3 years for the purpose of preventing re-registration\n\nYou may request earlier deletion of your data by contacting hello@thehomequarters.com (subject to legal retention obligations).",
  },
  {
    title: "10. Your Rights",
    body: "Under UK GDPR you have the following rights regarding your personal data:\n\n• Right of access — request a copy of the data we hold about you\n• Right to rectification — request correction of inaccurate or incomplete data\n• Right to erasure — request deletion of your data in certain circumstances\n• Right to restrict processing — request that we limit how we use your data\n• Right to data portability — receive your data in a structured, machine-readable format\n• Right to object — object to processing based on legitimate interests or for direct marketing\n• Right to withdraw consent — withdraw marketing consent at any time without affecting prior processing\n\nTo exercise any of these rights, email hello@thehomequarters.com. We will respond within 30 days. We may need to verify your identity before acting on a request.",
  },
  {
    title: "11. Right to Complain",
    body: "If you are based in the UK and believe we have not handled your personal data in accordance with UK GDPR, you have the right to lodge a complaint with the Information Commissioner's Office (ICO):\n\nWebsite: ico.org.uk\nPhone: 0303 123 1113\n\nWe would appreciate the opportunity to address your concern before you contact the ICO — please email hello@thehomequarters.com first.",
  },
  {
    title: "12. Data Security",
    body: "We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. These include:\n\n• HTTPS/TLS encryption for all data in transit\n• Firebase Security Rules restricting data access to authenticated users only\n• Role-based access controls so only authorised HQ administrators can access member data\n• Stripe's PCI-DSS compliant infrastructure for all payment data\n\nNo system is completely secure. In the unlikely event of a data breach that poses a risk to your rights and freedoms, we will notify you and the ICO within 72 hours as required by law.",
  },
  {
    title: "13. Push Notifications",
    body: "If you grant notification permission, we store your device push token in Firestore to send you alerts about messages, connection requests, and membership updates. This is a transactional use based on your membership contract. You can revoke notification permission at any time in your device Settings > Notifications. Revoking permission does not cancel your membership.",
  },
  {
    title: "14. Marketing Communications",
    body: "If you opted in during your application, we will send you occasional marketing emails such as event announcements, community updates, and new feature news. You may withdraw consent at any time by:\n\n• Using the unsubscribe link in any marketing email\n• Contacting hello@thehomequarters.com\n\nWithdrawing marketing consent will not affect transactional emails required to operate your membership (e.g. billing confirmations, account suspension notices).",
  },
  {
    title: "15. Automated Decision-Making",
    body: "We do not make any decisions about you that are based solely on automated processing and that produce legal or similarly significant effects on you. Membership applications are reviewed by a human HQ administrator before a decision is made.",
  },
  {
    title: "16. Links & Third-Party Content",
    body: "The app may display links to third-party websites (e.g. partner venue websites, Instagram profiles). HQ is not responsible for the privacy practices of those third parties. We encourage you to review their privacy policies before sharing personal data with them.",
  },
  {
    title: "17. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. When we make material changes, we will notify you via the app with at least 14 days' notice. The date shown at the top of this page indicates when the policy was last updated. Continued use of HomeQuarters after changes take effect constitutes your acknowledgement of the updated policy.",
  },
  {
    title: "18. Contact Us",
    body: "For questions, concerns, or to exercise your data rights, please contact:\n\nHomeQuarters Ltd\nEmail: hello@thehomequarters.com\n\nWe aim to respond to all data-related enquiries within 5 business days and will always resolve them within 30 days.",
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
          the legal basis we rely on, how we use and protect it, and your rights
          under UK GDPR. HomeQuarters is for adults aged 21 and over only.
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
