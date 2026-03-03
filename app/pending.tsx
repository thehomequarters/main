import React from "react";
import {
  View,
  Text,
  Pressable,
  Share,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const REQUIRED_VOUCHERS = 2;

export default function PendingScreen() {
  const { profile } = useAuth();

  const vouchers = profile?.voucher_count ?? 0;
  const appCode = profile?.application_code ?? "—";
  const hasEnough = vouchers >= REQUIRED_VOUCHERS;

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `I've applied to HomeQuarters — a private members' community for the diaspora. ` +
          `I need one more nomination to complete my application.\n\n` +
          `If you're an HQ member, please vouch for me using my application code:\n\n` +
          `${appCode}\n\n` +
          `Open the HQ app → Account → Nominate → "Vouch for an applicant"`,
      });
    } catch {
      // user cancelled
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
    >
      {/* Wordmark */}
      <Text style={styles.wordmark}>HQ</Text>

      {/* Status icon */}
      <View style={styles.iconWrap}>
        <View style={[styles.iconCircle, hasEnough && styles.iconCircleReady]}>
          <Ionicons
            name={hasEnough ? "checkmark" : "hourglass-outline"}
            size={28}
            color={hasEnough ? "#4CAF50" : colors.stone}
          />
        </View>
      </View>

      <Text style={styles.headline}>
        {hasEnough
          ? "Application complete."
          : "Awaiting nomination."}
      </Text>

      <Text style={styles.subtext}>
        {hasEnough
          ? "You have the required nominations. Your application is now with the membership committee. We will be in touch."
          : "Every HomeQuarters member must be nominated by at least two existing members before their application can be reviewed."}
      </Text>

      {/* Nomination progress */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>NOMINATIONS RECEIVED</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          {Array.from({ length: REQUIRED_VOUCHERS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                i < vouchers
                  ? i === 0
                    ? styles.progressFilled
                    : styles.progressFilledSecond
                  : styles.progressEmpty,
              ]}
            />
          ))}
        </View>

        <View style={styles.progressLabelRow}>
          <Text style={styles.progressCount}>
            <Text style={[styles.progressNum, hasEnough && { color: "#4CAF50" }]}>
              {vouchers}
            </Text>
            <Text style={styles.progressDen}> / {REQUIRED_VOUCHERS}</Text>
          </Text>
          <Text style={styles.progressStatus}>
            {hasEnough
              ? "Under review"
              : vouchers === 0
              ? "None yet"
              : "1 more needed"}
          </Text>
        </View>
      </View>

      {/* Application code — share to collect second voucher */}
      {!hasEnough && (
        <View style={styles.codeCard}>
          <View style={styles.codeCardHeader}>
            <Ionicons name="key-outline" size={16} color={colors.stone} />
            <Text style={styles.codeCardTitle}>YOUR APPLICATION CODE</Text>
          </View>

          <Text style={styles.code}>{appCode}</Text>

          <Text style={styles.codeHint}>
            Share this code privately with a current HQ member. They can vouch
            for you from the Nominate screen in the app.
          </Text>

          <Pressable onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={16} color={colors.black} />
            <Text style={styles.shareBtnText}>Share with a Member</Text>
          </Pressable>
        </View>
      )}

      {/* What happens next */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What happens next?</Text>
        {[
          hasEnough
            ? "Your application is being reviewed by the committee."
            : `Collect ${REQUIRED_VOUCHERS - vouchers} more nomination${REQUIRED_VOUCHERS - vouchers === 1 ? "" : "s"} from current members.`,
          "Once approved, you will receive a notification and gain full access.",
          "Membership decisions are final and confidential.",
        ].map((item, i) => (
          <View key={i} style={styles.infoRow}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Sign out */}
      <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 60,
  },
  wordmark: {
    color: colors.stone,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 7,
    marginBottom: 48,
  },
  iconWrap: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(201,168,76,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(201,168,76,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleReady: {
    backgroundColor: "rgba(76,175,80,0.1)",
    borderColor: "rgba(76,175,80,0.3)",
  },
  headline: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  subtext: {
    color: "rgba(160,160,160,0.75)",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 32,
  },
  // Nomination progress card
  card: {
    backgroundColor: colors.dark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: 20,
    marginBottom: 20,
  },
  cardLabel: {
    color: "rgba(160,160,160,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 16,
  },
  progressTrack: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressFilled: {
    backgroundColor: colors.stone,
  },
  progressFilledSecond: {
    backgroundColor: "#4CAF50",
  },
  progressEmpty: {
    backgroundColor: "rgba(42,42,42,1)",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressCount: {},
  progressNum: {
    color: colors.stone,
    fontSize: 28,
    fontWeight: "800",
  },
  progressDen: {
    color: "rgba(160,160,160,0.5)",
    fontSize: 16,
  },
  progressStatus: {
    color: colors.grey,
    fontSize: 12,
    fontWeight: "500",
  },
  // Application code card
  codeCard: {
    backgroundColor: "rgba(201,168,76,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    padding: 20,
    marginBottom: 20,
  },
  codeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  codeCardTitle: {
    color: colors.stone,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  code: {
    color: colors.stone,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 4,
    marginBottom: 12,
  },
  codeHint: {
    color: "rgba(160,160,160,0.6)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.stone,
    borderRadius: 10,
    paddingVertical: 13,
  },
  shareBtnText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: "700",
  },
  // Info card
  infoCard: {
    backgroundColor: colors.dark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: 20,
    marginBottom: 32,
  },
  infoTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  infoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.stone,
    marginTop: 6,
  },
  infoText: {
    color: "rgba(160,160,160,0.7)",
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  signOutBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  signOutText: {
    color: "rgba(160,160,160,0.4)",
    fontSize: 13,
  },
});
