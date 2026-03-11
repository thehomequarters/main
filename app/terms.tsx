import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "1. Eligibility",
    body: "HomeQuarters (\"HQ\") is an adults-only private members' community. You must be at least 21 years of age to apply for or hold membership. By submitting an application you confirm that you meet this requirement. HQ does not knowingly collect data from or grant access to persons under 21. If we become aware that a member is under 21, their account will be suspended immediately and the subscription cancelled with a pro-rata refund of any unused prepaid period.",
  },
  {
    title: "2. Content Standards",
    body: "HomeQuarters is not an adult-content platform. All content shared within the app — including profile photos, messages, and any community contributions — must be suitable for a professional social setting. Sexually explicit material, graphic violence, hate speech, and harassment are strictly prohibited and will result in immediate permanent removal with no refund. No exceptions.",
  },
  {
    title: "3. Invitation & Application",
    body: "Membership requires a valid personal invitation from a current HQ member in good standing. Invitation codes are strictly non-transferable and single-use. Submitting false, misleading, or incomplete information during your application, or obtaining an invitation code by deception or payment, constitutes grounds for immediate termination of membership without refund. HQ reserves the right to decline any application without giving reasons.",
  },
  {
    title: "4. Membership Tiers & Billing",
    body: "HQ offers the following membership tiers:\n\n• Gold — recurring monthly subscription at the published rate\n• Platinum — recurring monthly subscription at the published rate\n• Founding Member — by invitation only; fixed rate as agreed at the time of joining\n• Committee Member — by appointment only; rate and terms as agreed separately\n\nSubscriptions are billed monthly in advance via Stripe. You may cancel at any time through Account > Settings; cancellation takes effect at the end of the current billing period and no partial refunds are issued for the remaining days. HQ reserves the right to change pricing for Gold and Platinum tiers with 30 days' written notice. Continued use after a price change constitutes acceptance of the new price. Founding Member rates are fixed and not subject to change.",
  },
  {
    title: "5. Refunds",
    body: "All subscription payments are non-refundable except: (a) where required by applicable consumer protection law; (b) in the case of a billing error by HQ or Stripe; or (c) where a member under 21 is removed under clause 1. If you believe you have been charged in error, contact hello@thehomequarters.com within 14 days of the charge. HQ will investigate and, where a billing error is confirmed, issue a refund within 10 business days.",
  },
  {
    title: "6. Benefits & Redemption",
    body: "Membership benefits — including venue deals, event access, and partner offers such as the Telecel Zimbabwe eSIM for eligible Platinum members — are for your personal use only and cannot be resold, gifted, or transferred. One redemption per benefit per visit unless the specific benefit expressly states otherwise. HQ partner venues and benefit offerings may change, be withdrawn, or be substituted at any time without prior notice. HQ acts as an introducer only: the benefit is provided by the partner venue or supplier, and HQ accepts no liability for the quality, availability, or discontinuation of any third-party benefit.",
  },
  {
    title: "7. Acceptable Use",
    body: "You agree not to use HomeQuarters to: send unsolicited commercial messages (spam); harass, threaten, stalk, or intimidate other members; impersonate any person or entity; collect, harvest, or scrape other members' personal data; circumvent or abuse the nomination or vouching system; attempt to gain unauthorised access to any part of the platform; or engage in any activity that violates applicable UK, Zimbabwean, or other local laws. Violation of this clause may result in immediate suspension, permanent termination, and referral to relevant authorities where appropriate.",
  },
  {
    title: "8. Termination by HQ",
    body: "HQ may suspend or permanently revoke your membership at any time for breach of these Terms, the House Rules, or conduct deemed detrimental to the community — at HQ's sole and absolute discretion. Upon termination you will immediately lose access to all membership benefits and the app. No refund is due for the remaining days of a billing period where termination results from a breach. HQ is not required to give reasons for a termination decision.",
  },
  {
    title: "9. Termination by You",
    body: "You may cancel your membership at any time via Account > Settings > Cancel Membership. Cancellation takes effect at the end of the current billing period. You remain responsible for all charges incurred prior to cancellation. Deleting the app does not cancel your subscription; you must cancel through the app or by contacting hello@thehomequarters.com.",
  },
  {
    title: "10. Intellectual Property",
    body: "All content, branding, design, software, and materials within the HomeQuarters app are the exclusive property of HomeQuarters Ltd or its licensors. You may not reproduce, distribute, modify, reverse-engineer, or create derivative works without express prior written permission. Your profile content (photos, bio, links) remains your property; by posting it you grant HQ a non-exclusive, royalty-free licence to display it to other active members within the platform solely for the purpose of operating the service. This licence ends when your content is deleted or your membership terminates.",
  },
  {
    title: "11. Indemnification",
    body: "You agree to indemnify, defend, and hold harmless HomeQuarters Ltd, its directors, employees, and agents from and against any claims, losses, damages, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) your use of the app; (b) your breach of these Terms; (c) your violation of any third-party right including intellectual property rights; or (d) any content you post or transmit through the app.",
  },
  {
    title: "12. Limitation of Liability",
    body: "HomeQuarters is provided on an 'as is' and 'as available' basis without warranties of any kind, express or implied. To the maximum extent permitted by law, HQ shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the app, any partner venue, or any membership benefit. Our aggregate liability to you for any claim shall not exceed the total subscription fees you paid in the 3 months immediately preceding the event giving rise to the claim. Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.",
  },
  {
    title: "13. Force Majeure",
    body: "HQ shall not be liable for any failure or delay in performance of its obligations under these Terms to the extent such failure or delay is caused by circumstances beyond HQ's reasonable control, including but not limited to acts of God, pandemic, government action, civil unrest, power failure, internet outage, or third-party service failure (including Firebase or Stripe outages).",
  },
  {
    title: "14. Third-Party App Stores",
    body: "The HomeQuarters app is distributed via the Apple App Store and Google Play Store. Your download and use of the app is also subject to the terms of the relevant app store. In the event of a conflict between these Terms and the app store terms, these Terms prevail to the extent permitted by the app store provider. Apple Inc. and Google LLC are not parties to these Terms and have no obligation to provide support for the app.",
  },
  {
    title: "15. Communications & Marketing",
    body: "By creating an account you consent to receive transactional communications from HQ including membership updates, benefit notifications, and security alerts. If you opted in during your application, you will also receive occasional marketing communications such as event announcements and community updates. You may withdraw marketing consent at any time by contacting hello@thehomequarters.com or using the unsubscribe link in any email. Withdrawal of marketing consent does not affect transactional communications necessary to operate your membership.",
  },
  {
    title: "16. Governing Law & Disputes",
    body: "These Terms are governed by and construed in accordance with the laws of England and Wales. Both parties submit to the exclusive jurisdiction of the courts of England and Wales for the resolution of any dispute arising from or in connection with these Terms or your use of HomeQuarters. If you are based in Zimbabwe or another jurisdiction, you acknowledge that HQ is an English company and that English law governs your membership, though any mandatory consumer protection rights you hold under your local law are not excluded.",
  },
  {
    title: "17. General",
    body: "These Terms, together with our Privacy Policy and House Rules, constitute the entire agreement between you and HQ regarding your membership. If any provision is found to be unenforceable by a court of competent jurisdiction, that provision shall be modified to the minimum extent necessary to make it enforceable, and all other provisions shall continue in full force. No waiver by HQ of any breach shall constitute a waiver of any subsequent breach. HQ may assign its rights and obligations under these Terms to a successor entity; you may not assign your membership to any third party.",
  },
  {
    title: "18. Changes to These Terms",
    body: "We may update these Terms from time to time. When we make material changes, we will notify you via the app with at least 14 days' notice before the changes take effect. Continued use of HomeQuarters after changes take effect constitutes your acceptance of the revised Terms. If you do not accept the revised Terms, you must cancel your membership before the effective date.",
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
          these Terms of Service, our Privacy Policy, and our House Rules.
          Please read them carefully. Membership is open to adults aged 21 and over only.
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
        Questions about these Terms?{"\n"}Contact us at hello@thehomequarters.com
      </Text>
    </ScrollView>
  );
}
