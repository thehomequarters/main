import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/lib/auth";

// Placeholder payment URL — swap in Stripe / payment link when ready
const PAYMENT_URL = "https://homequarters.app/activate";

const BG    = "#1C1C1E";
const CARD  = "#252523";
const LINE  = "rgba(255,255,255,0.08)";
const PEARL = "rgba(255,255,255,0.82)";
const MUTED = "rgba(255,255,255,0.45)";
const WHITE = "#FFFFFF";
const AMBER = "#F5A623";

const BENEFITS = [
  { icon: "storefront-outline" as const,  label: "Exclusive deals at partner venues"   },
  { icon: "calendar-outline"  as const,  label: "RSVP to member-only events"           },
  { icon: "airplane-outline"  as const,  label: "eSIM & travel perks via Airalo"       },
  { icon: "play-circle-outline" as const, label: "Venue stories & inside access"        },
  { icon: "qr-code-outline"   as const,  label: "Membership QR for seamless redemption"},
  { icon: "people-outline"    as const,  label: "Full member directory & connections"  },
];

export default function ActivateScreen() {
  const router  = useRouter();
  const { profile } = useAuth();

  const daysLeft = useMemo(() => {
    if (!profile?.accepted_at) return 365;
    const acceptedMs = new Date(profile.accepted_at).getTime();
    const expiryMs   = acceptedMs + 365 * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((expiryMs - Date.now()) / (24 * 60 * 60 * 1000)));
  }, [profile?.accepted_at]);

  const approvedDate = profile?.accepted_at
    ? new Date(profile.accepted_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const handleActivate = () => {
    Linking.openURL(PAYMENT_URL).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={WHITE} />
        </Pressable>
        <Text style={styles.headerTitle}>Activate</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          <View style={styles.iconBadge}>
            <Ionicons name="star-outline" size={34} color={AMBER} />
          </View>
          <Text style={styles.heroTitle}>{"You're In.\nNow Unlock Everything."}</Text>
          <Text style={styles.heroSub}>
            Your application was approved — activate your membership to access the full HQ experience.
          </Text>
        </View>

        {/* Grace period context */}
        {approvedDate && (
          <View style={styles.graceCard}>
            <Ionicons name="time-outline" size={16} color={AMBER} />
            <Text style={styles.graceText}>
              Approved on {approvedDate} · {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining in grace period
            </Text>
          </View>
        )}

        {/* Benefits list */}
        <Text style={styles.sectionLabel}>What you unlock</Text>
        <View style={styles.benefitsCard}>
          {BENEFITS.map((b, i) => (
            <View
              key={b.label}
              style={[
                styles.benefitRow,
                i < BENEFITS.length - 1 && styles.benefitBorder,
              ]}
            >
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={18} color={PEARL} />
              </View>
              <Text style={styles.benefitLabel}>{b.label}</Text>
              <Ionicons name="checkmark-circle" size={18} color={AMBER} />
            </View>
          ))}
        </View>

        {/* Pricing placeholder */}
        <Text style={styles.sectionLabel}>Membership</Text>
        <View style={styles.pricingRow}>
          <View style={[styles.pricingCard, styles.pricingCardHighlight]}>
            <Text style={styles.pricingBadge}>BEST VALUE</Text>
            <Text style={styles.pricingPeriod}>Annual</Text>
            <Text style={styles.pricingAmount}>Contact us</Text>
            <Text style={styles.pricingNote}>Pay once · Full year access</Text>
          </View>
          <View style={styles.pricingCard}>
            <View style={{ height: 18 }} />
            <Text style={styles.pricingPeriod}>Monthly</Text>
            <Text style={styles.pricingAmount}>Contact us</Text>
            <Text style={styles.pricingNote}>Flexible · Cancel anytime</Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleActivate}
          style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.88 : 1 }]}
        >
          <Text style={styles.ctaBtnText}>Activate Membership</Text>
          <Ionicons name="arrow-forward" size={18} color={BG} />
        </Pressable>

        <Text style={styles.footer}>
          Membership activates immediately on payment.{"\n"}Questions?{" "}
          <Text
            style={{ color: AMBER }}
            onPress={() => Linking.openURL("mailto:hello@homequarters.app")}
          >
            Contact us
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 62 : 46,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: LINE,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 60,
  },
  heroWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(245,166,35,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    color: WHITE,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 12,
  },
  heroSub: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  graceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(245,166,35,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 32,
  },
  graceText: {
    color: AMBER,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  sectionLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  benefitsCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    marginBottom: 32,
    overflow: "hidden",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  benefitBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: LINE,
    justifyContent: "center",
    alignItems: "center",
  },
  benefitLabel: {
    color: PEARL,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  pricingRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    padding: 16,
  },
  pricingCardHighlight: {
    borderColor: "rgba(245,166,35,0.4)",
    backgroundColor: "rgba(245,166,35,0.06)",
  },
  pricingBadge: {
    color: AMBER,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  pricingPeriod: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  pricingAmount: {
    color: PEARL,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  pricingNote: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
  },
  ctaBtn: {
    backgroundColor: AMBER,
    borderRadius: 14,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  ctaBtnText: {
    color: BG,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  footer: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
});
