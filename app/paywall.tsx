import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/constants/theme";

const GRACE_DAYS = 30;
const GRACE_KEY = "hq_grace_entered";
const MEMBERSHIP_URL = "https://homequarters-60838.web.app/membership";

function daysRemaining(acceptedAt: string | null | undefined): number {
  if (!acceptedAt) return GRACE_DAYS;
  const elapsed = (Date.now() - new Date(acceptedAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.floor(GRACE_DAYS - elapsed));
}

export default function PaywallScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const remaining = daysRemaining(profile?.accepted_at);
  const graceExpired = remaining === 0;

  const handleEnterGrace = async () => {
    await AsyncStorage.setItem(GRACE_KEY, "1");
    router.replace("/(tabs)");
  };

  const handleGetMembership = () => {
    Linking.openURL(`${MEMBERSHIP_URL}?plan=gold&billing=monthly`).catch(() => {});
    // Also navigate so they see billing in-app
    router.replace("/billing");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>HQ</Text>
      </View>

      {/* Content */}
      <View style={styles.body}>

        {/* Days badge */}
        {!graceExpired ? (
          <View style={styles.daysBadge}>
            <Text style={styles.daysNumber}>{remaining}</Text>
            <Text style={styles.daysLabel}>days remaining</Text>
          </View>
        ) : (
          <View style={[styles.daysBadge, styles.expiredBadge]}>
            <Ionicons name="time-outline" size={22} color={colors.stone} />
            <Text style={[styles.daysLabel, { marginTop: 4 }]}>Grace period ended</Text>
          </View>
        )}

        <Text style={styles.heading}>
          {graceExpired ? "Your free trial has ended." : "You're in.\nChoose your plan."}
        </Text>

        <Text style={styles.sub}>
          {graceExpired
            ? "To continue using HomeQuarters, please activate your membership. Your community is waiting for you."
            : `You have ${remaining} free day${remaining === 1 ? "" : "s"} to explore the app before your membership begins. No pressure — but when you're ready, your plan is just a tap away.`
          }
        </Text>

        {/* Value props */}
        <View style={styles.props}>
          {[
            { icon: "people-outline" as const, text: "Supports our growing member community" },
            { icon: "build-outline" as const, text: "Keeps the app running & maintained" },
            { icon: "sparkles-outline" as const, text: "Funds new features & improvements" },
            { icon: "storefront-outline" as const, text: "Brings more partner venues on board" },
          ].map((p, i) => (
            <View key={i} style={styles.propRow}>
              <View style={styles.propIcon}>
                <Ionicons name={p.icon} size={16} color={colors.gold} />
              </View>
              <Text style={styles.propText}>{p.text}</Text>
            </View>
          ))}
        </View>

      </View>

      {/* Footer CTAs */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleGetMembership}
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.88 : 1 }]}
        >
          <Text style={styles.primaryBtnText}>Choose a plan</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.dark} />
        </Pressable>

        {!graceExpired && (
          <Pressable
            onPress={handleEnterGrace}
            style={({ pressed }) => [styles.ghostBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.ghostBtnText}>
              Continue free · {remaining} day{remaining === 1 ? "" : "s"} left
            </Text>
          </Pressable>
        )}

        <Text style={styles.footnote}>
          Starting from £5/mo · Cancel anytime ·{" "}
          <Text
            style={{ textDecorationLine: "underline" }}
            onPress={() => Linking.openURL("mailto:hello@thehomequarters.com")}
          >
            Questions?
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingTop: Platform.OS === "ios" ? 64 : 48,
    paddingHorizontal: 24,
    paddingBottom: 12,
    alignItems: "center",
  },
  wordmark: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 8,
    textTransform: "uppercase",
  },

  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: "center",
  },

  daysBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.goldLight,
    borderWidth: 1.5,
    borderColor: "rgba(201,168,76,0.3)",
    marginBottom: 28,
  },
  expiredBadge: {
    backgroundColor: colors.sand,
    borderColor: colors.border,
  },
  daysNumber: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 36,
  },
  daysLabel: {
    color: colors.stone,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  heading: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 38,
    textAlign: "center",
    marginBottom: 14,
  },
  sub: {
    color: colors.stone,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
  },

  props: {
    width: "100%",
    gap: 14,
  },
  propRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  propIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  propText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
    paddingTop: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  primaryBtn: {
    backgroundColor: colors.gold,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  ghostBtn: {
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostBtnText: {
    color: colors.stone,
    fontSize: 14,
    fontWeight: "600",
  },
  footnote: {
    color: colors.stone,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
