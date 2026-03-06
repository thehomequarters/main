import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "@/lib/auth";
import { functions } from "@/lib/firebase";
import { colors } from "@/constants/theme";

// ── Membership website URL ──────────────────────────────────────────────────
// Payments are handled on the website (App Store compliant for digital subs).
const MEMBERSHIP_URL = "https://homequarters-60838.web.app/membership";

// ── Apple Wallet pass endpoint ──────────────────────────────────────────────
const WALLET_PASS_BASE = "https://api.homequarters.co.uk/wallet/pass";

const GOLD_FEATURES = [
  { icon: "storefront-outline" as const, text: "Deals at 15+ partner venues across the UK" },
  { icon: "people-outline" as const, text: "Connect & Discover — full community access" },
  { icon: "calendar-outline" as const, text: "Members-only events & social nights" },
  { icon: "card-outline" as const, text: "Digital HQ membership card" },
  { icon: "star-outline" as const, text: "Nominate friends to join the community" },
];

const PLATINUM_FEATURES = [
  { icon: "checkmark-circle-outline" as const, text: "Everything in Gold", dim: true },
  { icon: "restaurant-outline" as const, text: "Member discounts at top restaurants in Zim" },
  { icon: "wine-outline" as const, text: "Exclusive rates at premium bars & lounges" },
  { icon: "sparkles-outline" as const, text: "Curated experiences — events, stays & more" },
  { icon: "phone-portrait-outline" as const, text: "Telecel Zimbabwe eSIM — arrive connected" },
];

const G = {
  bg: "#1E1500",
  border: "rgba(201,168,76,0.28)",
  borderSelected: "rgba(201,168,76,0.9)",
  title: "#F5E6A0",
  price: "#F5E6A0",
  pricePer: "rgba(245,230,160,0.45)",
  tag: "rgba(245,230,160,0.4)",
  desc: "rgba(245,230,160,0.58)",
  feature: "rgba(245,230,160,0.85)",
  icon: "#C9A84C",
  currentBg: "rgba(201,168,76,0.12)",
  currentBorder: "rgba(201,168,76,0.3)",
  currentText: "#C9A84C",
  check: "#C9A84C",
};

const SUB_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  past_due: "Payment overdue",
  canceled: "Cancelled",
  trialing: "Trial",
};

const SUB_STATUS_COLORS: Record<string, string> = {
  active: colors.green,
  past_due: "#F5A623",
  canceled: "#FF6B6B",
  trialing: "#7B9CFF",
};

type Plan = "gold" | "platinum";

export default function BillingScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [selected, setSelected] = useState<Plan>(
    profile?.membership_tier === "platinum_card" ? "platinum" : "gold"
  );
  const [loadingPortal, setLoadingPortal] = useState(false);

  const isActive = profile?.membership_status === "active";
  const isGrace = profile?.membership_status === "accepted";
  const currentTier = profile?.membership_tier;
  const subStatus = profile?.subscription_status;
  const periodEnd = profile?.current_period_end;
  const hasSubscription = !!profile?.stripe_customer_id;

  const currentPlanLabel =
    currentTier === "platinum_card" ? "Platinum"
    : currentTier === "founding_member" ? "Founding Member"
    : currentTier === "committee_member" ? "Committee"
    : "Gold";

  const handleContinue = async () => {
    try {
      await Linking.openURL(MEMBERSHIP_URL);
    } catch {
      /* dev/simulator */
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const getPortalUrl = httpsCallable<{ return_url: string }, { url: string }>(
        functions,
        "getStripePortalUrl"
      );
      const result = await getPortalUrl({ return_url: "https://homequarters.co.uk" });
      await Linking.openURL(result.data.url);
    } catch (err) {
      console.error("Failed to open billing portal:", err);
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleAddToWallet = async () => {
    const url = `${WALLET_PASS_BASE}/${profile?.member_code}`;
    try {
      await Linking.openURL(url);
    } catch {
      /* dev */
    }
  };

  const isOnSelectedPlan =
    isActive &&
    currentTier === (selected === "gold" ? "gold_card" : "platinum_card");

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Nav */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>
        <Text style={styles.navTitle}>Membership Plans</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.heading}>Choose your plan</Text>
        <Text style={styles.sub}>
          {isActive
            ? `You're currently on ${currentPlanLabel}. Upgrade or manage below.`
            : isGrace
            ? "You've been accepted. Pick a plan to unlock your full membership."
            : "Select the plan that fits how you use HomeQuarters."}
        </Text>

        {/* ── Subscription status chip (if has Stripe subscription) ── */}
        {hasSubscription && subStatus && (
          <View style={[styles.statusRow, { borderColor: (SUB_STATUS_COLORS[subStatus] ?? colors.stone) + "33" }]}>
            <View style={[styles.statusDot, { backgroundColor: SUB_STATUS_COLORS[subStatus] ?? colors.stone }]} />
            <Text style={[styles.statusText, { color: SUB_STATUS_COLORS[subStatus] ?? colors.stone }]}>
              {SUB_STATUS_LABELS[subStatus] ?? subStatus}
              {subStatus === "past_due" && " · Please update your payment method"}
              {periodEnd && subStatus === "active" && (
                ` · Renews ${new Date(periodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
              )}
            </Text>
          </View>
        )}

        {/* ── Apple Wallet — iOS only, active members ── */}
        {Platform.OS === "ios" && isActive && (
          <Pressable
            onPress={handleAddToWallet}
            style={({ pressed }) => [styles.walletRow, { opacity: pressed ? 0.82 : 1 }]}
          >
            <View style={styles.walletLeft}>
              <View style={styles.walletIconWrap}>
                <Ionicons name="wallet" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.walletLabel}>Add to Apple Wallet</Text>
                <Text style={styles.walletSub}>Save your membership pass to Wallet</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.55)" />
          </Pressable>
        )}

        {/* ── GOLD CARD ── */}
        <Pressable
          onPress={() => setSelected("gold")}
          style={[
            styles.card,
            { backgroundColor: G.bg, borderColor: G.border },
            selected === "gold" && { borderColor: G.borderSelected },
          ]}
        >
          {isActive && currentTier === "gold_card" && (
            <View style={[styles.currentBadge, { backgroundColor: G.currentBg, borderColor: G.currentBorder }]}>
              <Text style={[styles.currentBadgeText, { color: G.currentText }]}>CURRENT PLAN</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={[styles.tierDot, { backgroundColor: G.icon }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.tierName, { color: G.title }]}>Gold</Text>
              <Text style={[styles.tierTag, { color: G.tag }]}>Your Diaspora Pass</Text>
            </View>
            <View style={styles.priceWrap}>
              <Text style={[styles.price, { color: G.price }]}>£5</Text>
              <Text style={[styles.pricePer, { color: G.pricePer }]}>/mo</Text>
            </View>
          </View>

          <Text style={[styles.tierDesc, { color: G.desc }]}>
            Built for members living in the UK. Access exclusive deals at our
            partner venues, connect with the community, and carry your HQ card
            wherever you go.
          </Text>

          <View style={styles.featureList}>
            {GOLD_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name={f.icon} size={15} color={G.icon} />
                <Text style={[styles.featureText, { color: G.feature }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          {selected === "gold" && (
            <View style={styles.selectedRow}>
              <Ionicons name="checkmark-circle" size={20} color={G.check} />
              <Text style={[styles.selectedText, { color: G.check }]}>Selected</Text>
            </View>
          )}
        </Pressable>

        {/* ── PLATINUM CARD ── */}
        <Pressable
          onPress={() => setSelected("platinum")}
          style={[styles.card, styles.platCard, selected === "platinum" && styles.platSelected]}
        >
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>

          {isActive && currentTier === "platinum_card" && (
            <View style={[styles.currentBadge, { top: 44, backgroundColor: "rgba(76,175,80,0.12)", borderColor: "rgba(76,175,80,0.25)" }]}>
              <Text style={[styles.currentBadgeText, { color: colors.green }]}>CURRENT PLAN</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={[styles.tierDot, { backgroundColor: "#E8E8E8" }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.tierName, { color: "#FFFFFF" }]}>Platinum</Text>
              <Text style={[styles.tierTag, { color: "rgba(255,255,255,0.4)" }]}>Your Zimbabwe Pass</Text>
            </View>
            <View style={styles.priceWrap}>
              <Text style={[styles.price, { color: "#FFFFFF" }]}>£15</Text>
              <Text style={[styles.pricePer, { color: "rgba(255,255,255,0.4)" }]}>/mo</Text>
            </View>
          </View>

          <Text style={[styles.tierDesc, { color: "rgba(255,255,255,0.58)" }]}>
            For members heading back to Zimbabwe. Unlock member discounts at the
            best restaurants, bars, and experiences in Harare and beyond — plus
            a Telecel eSIM so you land connected.
          </Text>

          <View style={styles.featureList}>
            {PLATINUM_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons
                  name={f.icon}
                  size={15}
                  color={f.dim ? "rgba(255,255,255,0.3)" : "#E0E0E0"}
                />
                <Text style={[
                  styles.featureText,
                  { color: f.dim ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)" },
                ]}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.esimPill}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.5)" />
            <Text style={styles.esimPillText}>Harare · Bulawayo · Victoria Falls</Text>
          </View>

          {selected === "platinum" && (
            <View style={styles.selectedRow}>
              <Ionicons name="checkmark-circle" size={20} color="#E8E8E8" />
              <Text style={[styles.selectedText, { color: "#E8E8E8" }]}>Selected</Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.billingNote}>
          Membership is managed at thehomequarters.com · Cancel anytime
        </Text>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.footer}>
        {isOnSelectedPlan && hasSubscription ? (
          // On this plan and has a Stripe subscription → show manage button
          <Pressable
            onPress={handleManageSubscription}
            disabled={loadingPortal}
            style={({ pressed }) => [styles.manageBtn, { opacity: pressed || loadingPortal ? 0.75 : 1 }]}
          >
            {loadingPortal ? (
              <ActivityIndicator size="small" color={colors.dark} />
            ) : (
              <>
                <Ionicons name="settings-outline" size={16} color={colors.dark} />
                <Text style={styles.manageBtnText}>Manage Subscription</Text>
              </>
            )}
          </Pressable>
        ) : isOnSelectedPlan ? (
          // On this plan but no Stripe record (founding/committee/manually set)
          <View style={styles.managePill}>
            <Text style={styles.managePillText}>✓ You're on this plan · Contact us to make changes</Text>
          </View>
        ) : (
          // Not on this plan → open website to subscribe
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={styles.ctaBtnText}>
              {isActive ? "Change plan" : "Get membership"} · thehomequarters.com
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </Pressable>
        )}

        {/* Manage subscription link if on a different plan but has subscription */}
        {hasSubscription && !isOnSelectedPlan && (
          <Pressable onPress={handleManageSubscription} disabled={loadingPortal}>
            <Text style={styles.manageLink}>
              {loadingPortal ? "Opening…" : "Manage or cancel existing subscription"}
            </Text>
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
  container: { flex: 1, backgroundColor: colors.bg },

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

  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

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
    marginBottom: 16,
  },

  // ── Subscription status chip ──
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    flexWrap: "wrap",
  },

  // ── Apple Wallet row ──
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  walletIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  walletLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  walletSub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    marginTop: 1,
  },

  // ── Plan cards ──
  card: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 22,
    marginBottom: 16,
  },
  platCard: {
    backgroundColor: "#1C1C1E",
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 4,
  },
  platSelected: {
    borderColor: "rgba(232,232,232,0.55)",
  },

  currentBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  bestValueBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 14,
  },
  bestValueText: {
    color: "rgba(255,255,255,0.45)",
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
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  tierName: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  tierTag: { fontSize: 12, fontWeight: "500", marginTop: 1 },

  priceWrap: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  price: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  pricePer: { fontSize: 13, fontWeight: "500" },

  tierDesc: { fontSize: 13, lineHeight: 21, marginBottom: 18 },

  featureList: { gap: 10, marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  featureText: { fontSize: 13, lineHeight: 19, flex: 1 },

  esimPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
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

  selectedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  selectedText: { fontSize: 13, fontWeight: "600" },

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
  manageBtn: {
    backgroundColor: colors.sand,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  manageBtnText: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
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
  managePillText: { color: colors.green, fontSize: 13, fontWeight: "600" },
  manageLink: {
    color: colors.stone,
    fontSize: 12,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  footerNote: { color: colors.stone, fontSize: 12, textAlign: "center" },
});
