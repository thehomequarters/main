import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";

// Placeholder payment URLs — swap for real Stripe / payment links
const PAYMENT_URLS: Record<string, string> = {
  gold: "https://buy.stripe.com/placeholder_gold",
  platinum: "https://buy.stripe.com/placeholder_platinum",
};

const GOLD_FEATURES = [
  { icon: "storefront-outline" as const, text: "Deals at 15+ partner venues across the UK" },
  { icon: "people-outline" as const, text: "Connect & Discover — full community access" },
  { icon: "calendar-outline" as const, text: "Members-only events & social nights" },
  { icon: "card-outline" as const, text: "Digital HQ membership card" },
  { icon: "star-outline" as const, text: "Nominate friends to join the community" },
];

const PLATINUM_FEATURES = [
  { icon: "checkmark-circle-outline" as const, text: "Everything in Gold", bold: true },
  { icon: "phone-portrait-outline" as const, text: "Telecel Zimbabwe eSIM via Airalo" },
  { icon: "airplane-outline" as const, text: "Local data rates when you land in Zim" },
  { icon: "wifi-outline" as const, text: "No roaming charges — activate before you fly" },
  { icon: "flash-outline" as const, text: "Priority support & exclusive Zimbabwe perks" },
];

type Plan = "gold" | "platinum";

export default function BillingScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<Plan>(
    profile?.membership_tier === "platinum_card" ? "platinum" : "gold"
  );

  const isActive = profile?.membership_status === "active";
  const isGrace = profile?.membership_status === "accepted";
  const currentTier = profile?.membership_tier;

  const currentPlanLabel =
    currentTier === "platinum_card"
      ? "Platinum"
      : currentTier === "founding_member"
      ? "Founding Member"
      : currentTier === "committee_member"
      ? "Committee"
      : "Gold";

  const handleContinue = async () => {
    const url = PAYMENT_URLS[selected];
    try {
      await Linking.openURL(url);
    } catch {
      // URL not available in dev — no-op
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Nav bar */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>
        <Text style={styles.navTitle}>Membership Plans</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Text style={styles.heading}>Choose your plan</Text>
        <Text style={styles.sub}>
          {isActive
            ? `You're currently on ${currentPlanLabel}. Upgrade or manage your subscription below.`
            : isGrace
            ? "You've been accepted. Pick a plan to unlock your full membership."
            : "Select the plan that fits how you use HomeQuarters."}
        </Text>

        {/* ── GOLD CARD ── */}
        <Pressable
          onPress={() => setSelected("gold")}
          style={[styles.card, selected === "gold" && styles.cardSelected]}
        >
          {/* Current badge */}
          {isActive && currentTier === "gold_card" && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={[styles.tierDot, { backgroundColor: "#C9A84C" }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tierName}>Gold</Text>
              <Text style={styles.tierTag}>Your Diaspora Pass</Text>
            </View>
            <View style={styles.priceWrap}>
              <Text style={styles.price}>£5</Text>
              <Text style={styles.pricePer}>/mo</Text>
            </View>
          </View>

          <Text style={styles.tierDesc}>
            Built for members living in the UK. Access exclusive deals at our
            partner venues, connect with the community, and carry your HQ card
            wherever you go.
          </Text>

          <View style={styles.featureList}>
            {GOLD_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name={f.icon} size={15} color="#C9A84C" />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {selected === "gold" && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#C9A84C" />
              <Text style={[styles.selectedText, { color: "#C9A84C" }]}>Selected</Text>
            </View>
          )}
        </Pressable>

        {/* ── PLATINUM CARD ── */}
        <Pressable
          onPress={() => setSelected("platinum")}
          style={[styles.card, styles.platinumCard, selected === "platinum" && styles.platinumSelected]}
        >
          {/* Recommended pill */}
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>BEST VALUE</Text>
          </View>

          {/* Current badge */}
          {isActive && currentTier === "platinum_card" && (
            <View style={[styles.currentBadge, { top: 44 }]}>
              <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={[styles.tierDot, { backgroundColor: "#E8E8E8" }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.tierName, styles.platinumText]}>Platinum</Text>
              <Text style={[styles.tierTag, { color: "rgba(255,255,255,0.5)" }]}>Your Zimbabwe Pass</Text>
            </View>
            <View style={styles.priceWrap}>
              <Text style={[styles.price, styles.platinumText]}>£15</Text>
              <Text style={[styles.pricePer, { color: "rgba(255,255,255,0.5)" }]}>/mo</Text>
            </View>
          </View>

          <Text style={[styles.tierDesc, { color: "rgba(255,255,255,0.65)" }]}>
            For members who travel back to Zimbabwe. Includes everything in Gold
            plus a Telecel Zimbabwe eSIM through Airalo — install before you fly,
            connect the moment you land.
          </Text>

          <View style={styles.featureList}>
            {PLATINUM_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons
                  name={f.icon}
                  size={15}
                  color={i === 0 ? "rgba(255,255,255,0.4)" : "#E8E8E8"}
                />
                <Text
                  style={[
                    styles.featureText,
                    { color: i === 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)" },
                    f.bold && { fontWeight: "600" },
                  ]}
                >
                  {f.text}
                </Text>
              </View>
            ))}
          </View>

          {/* eSIM highlight pill */}
          <View style={styles.esimPill}>
            <Ionicons name="phone-portrait-outline" size={13} color="rgba(255,255,255,0.6)" />
            <Text style={styles.esimPillText}>Telecel Zimbabwe · 4G LTE · Local rates</Text>
          </View>

          {selected === "platinum" && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#E8E8E8" />
              <Text style={[styles.selectedText, { color: "#E8E8E8" }]}>Selected</Text>
            </View>
          )}
        </Pressable>

        {/* Billing note */}
        <Text style={styles.billingNote}>
          Billed monthly. Cancel anytime. Membership activates immediately on
          payment confirmation.
        </Text>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={styles.footer}>
        {isActive && currentTier === (selected === "gold" ? "gold_card" : "platinum_card") ? (
          <View style={styles.managePill}>
            <Text style={styles.managePillText}>
              ✓ You're on this plan · Contact us to make changes
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={styles.ctaBtnText}>
              {isActive ? "Switch to " : "Activate "}
              {selected === "platinum" ? "Platinum · £15/mo" : "Gold · £5/mo"}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </Pressable>
        )}
        <Text style={styles.footerNote}>
          Questions?{" "}
          <Text
            style={{ textDecorationLine: "underline" }}
            onPress={() => Linking.openURL("mailto:hello@homequarters.co.uk")}
          >
            hello@homequarters.co.uk
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sand,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heading: {
    color: colors.dark,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 8,
    marginBottom: 8,
  },
  sub: {
    color: colors.stone,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
  },

  // ── Plan cards ──
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 22,
    marginBottom: 16,
  },
  cardSelected: {
    borderColor: "#C9A84C",
  },
  platinumCard: {
    backgroundColor: "#1C1C1E",
    borderColor: "rgba(255,255,255,0.12)",
    marginTop: 8,
  },
  platinumSelected: {
    borderColor: "rgba(232,232,232,0.6)",
  },
  currentBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(76,175,80,0.12)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  currentBadgeText: {
    color: colors.green,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  recommendedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 14,
  },
  recommendedText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tierName: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  platinumText: {
    color: "#FFFFFF",
  },
  tierTag: {
    color: colors.stone,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  price: {
    color: colors.dark,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pricePer: {
    color: colors.stone,
    fontSize: 13,
    fontWeight: "500",
  },
  tierDesc: {
    color: colors.stone,
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 18,
  },
  featureList: {
    gap: 10,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureText: {
    color: colors.dark,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  esimPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  esimPillText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  selectedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  selectedText: {
    fontSize: 13,
    fontWeight: "600",
  },
  billingNote: {
    color: colors.stone,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 8,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  ctaBtn: {
    backgroundColor: colors.dark,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  managePill: {
    backgroundColor: "rgba(76,175,80,0.08)",
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.2)",
  },
  managePillText: {
    color: colors.green,
    fontSize: 13,
    fontWeight: "600",
  },
  footerNote: {
    color: colors.stone,
    fontSize: 12,
    textAlign: "center",
  },
});
