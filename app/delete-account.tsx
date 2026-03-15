import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Linking,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { colors, fonts } from "@/constants/theme";

function StepDots({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      {([1, 2, 3] as const).map((n) => (
        <View
          key={n}
          style={{
            width: n === current ? 18 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: n === current ? colors.dark : colors.border,
          }}
        />
      ))}
    </View>
  );
}

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, deleteAccount } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isActive = profile?.membership_status === "active";

  function goToStep(s: 1 | 2 | 3) {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setStep(s);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }

  const handleDelete = async () => {
    if (!password) {
      toast("Enter your password to confirm.", "error");
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(password);
      // Auth state change in AuthProvider clears state and redirects via _layout guard
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
          ? "Incorrect password. Please try again."
          : e.code === "auth/too-many-requests"
          ? "Too many attempts. Please wait a moment and try again."
          : e.message || "Something went wrong. Please try again.";
      toast(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header: back button + step dots ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable
          onPress={() =>
            step > 1 ? goToStep((step - 1) as 1 | 2 | 3) : router.back()
          }
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={18} color={colors.dark} />
        </Pressable>
        <StepDots current={step} />
      </View>

      {/* ── Animated step content ── */}
      <Animated.View style={[styles.stepWrap, { opacity: fadeAnim }]}>

        {/* ── Step 1: What you'll lose ── */}
        {step === 1 && (
          <View style={styles.step}>
            <View style={styles.content}>
              <Text style={styles.eyebrow}>DELETING YOUR ACCOUNT</Text>
              <Text style={styles.headline}>What you'll{"\n"}lose.</Text>
              <View style={styles.items}>
                {[
                  "Your profile and all personal data",
                  "All connections and messages",
                  "Your member code and history",
                  "Access to HQ venues, events, and benefits",
                  "This cannot be undone",
                ].map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemDash}>—</Text>
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.ctas}>
              <Pressable
                style={({ pressed }) => [
                  styles.pill,
                  styles.pillDark,
                  pressed && { opacity: 0.82 },
                ]}
                onPress={() => goToStep(2)}
              >
                <Text style={styles.pillDarkText}>Continue →</Text>
              </Pressable>
              <Pressable onPress={() => router.back()} style={styles.textCta}>
                <Text style={styles.textCtaText}>Keep My Account</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Step 2a: Active subscription warning ── */}
        {step === 2 && isActive && (
          <View style={styles.step}>
            <View style={styles.content}>
              <Text style={styles.eyebrow}>IMPORTANT</Text>
              <Text style={styles.headline}>
                Cancel your{"\n"}subscription{"\n"}first.
              </Text>
              <Text style={styles.body}>
                You have an active membership. Deleting your account will not
                automatically cancel your Stripe subscription — you'll continue
                to be charged. Contact us before proceeding.
              </Text>
            </View>
            <View style={styles.ctas}>
              <Pressable
                style={({ pressed }) => [
                  styles.pill,
                  styles.pillGold,
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() =>
                  Linking.openURL(
                    "mailto:hello@thehomequarters.com?subject=Cancel%20Membership&body=Please%20cancel%20my%20HomeQuarters%20membership.%20Member%20code%3A%20" +
                      (profile?.member_code ?? "")
                  )
                }
              >
                <Text style={styles.pillGoldText}>Email us to cancel →</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(3)} style={styles.textCta}>
                <Text style={styles.textCtaText}>
                  I've already cancelled, continue →
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Step 2b: No active subscription — pause ── */}
        {step === 2 && !isActive && (
          <View style={styles.step}>
            <View style={styles.content}>
              <Text style={styles.eyebrow}>ARE YOU SURE?</Text>
              <Text style={styles.headline}>
                This cannot{"\n"}be undone.
              </Text>
              <Text style={styles.body}>
                Once your account is deleted, everything is gone permanently.
                There is no recovery process and no exceptions.
              </Text>
            </View>
            <View style={styles.ctas}>
              <Pressable
                style={({ pressed }) => [
                  styles.pill,
                  styles.pillDark,
                  pressed && { opacity: 0.82 },
                ]}
                onPress={() => goToStep(3)}
              >
                <Text style={styles.pillDarkText}>Yes, continue →</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(1)} style={styles.textCta}>
                <Text style={styles.textCtaText}>← Go back</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Step 3: Final confirmation ── */}
        {step === 3 && (
          <View style={styles.step}>
            <View style={styles.content}>
              <Text style={styles.eyebrow}>FINAL STEP</Text>
              <Text style={styles.headline}>Confirm your{"\n"}identity.</Text>
              <Text style={styles.body}>
                Enter your password to permanently delete your account.
              </Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor={colors.stone}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
            <View style={styles.ctas}>
              <Pressable
                onPress={handleDelete}
                disabled={deleting || !password}
                style={({ pressed }) => [
                  styles.pill,
                  styles.pillRed,
                  (deleting || !password) && { opacity: 0.38 },
                  pressed && !deleting && !!password && { opacity: 0.82 },
                ]}
                accessibilityRole="button"
              >
                {!deleting && (
                  <Ionicons
                    name="trash-outline"
                    size={15}
                    color={colors.white}
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.pillRedText}>
                  {deleting
                    ? "Deleting account…"
                    : "Permanently Delete Account"}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.back()} style={styles.textCta}>
                <Text style={styles.textCtaText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },

  // Step wrapper
  stepWrap: {
    flex: 1,
  },
  step: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },

  // Content area (flex: 1 pushes CTAs to bottom)
  content: {
    flex: 1,
    paddingTop: 36,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.stone,
    marginBottom: 14,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.ink,
    lineHeight: 46,
    marginBottom: 28,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.stone,
    lineHeight: 24,
  },

  // Consequence list
  items: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemDash: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.border,
    marginTop: 2,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.stone,
    lineHeight: 21,
  },

  // Password input
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: colors.dark,
    fontSize: 15,
    marginTop: 20,
  },

  // CTAs
  ctas: {
    paddingTop: 12,
  },
  pill: {
    borderRadius: 100,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 4,
  },
  pillDark: {
    backgroundColor: colors.dark,
  },
  pillDarkText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
    letterSpacing: 0.2,
  },
  pillGold: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  pillGoldText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.gold,
    letterSpacing: 0.2,
  },
  pillRed: {
    backgroundColor: colors.red,
  },
  pillRedText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
    letterSpacing: 0.2,
  },
  textCta: {
    paddingVertical: 14,
    alignItems: "center",
  },
  textCtaText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.stone,
  },
});
