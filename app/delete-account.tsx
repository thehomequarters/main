import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { colors } from "@/constants/theme";

const CONSEQUENCES = [
  "Your profile and personal data will be permanently deleted",
  "All connections and messages will be removed",
  "Your member code and membership history will be erased",
  "You will lose access to all HQ venues, events, and benefits",
  "This action cannot be undone",
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { profile, deleteAccount } = useAuth();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isActive = profile?.membership_status === "active";

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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={18} color={colors.dark} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Delete Account</Text>
            <Text style={styles.headerSub}>This cannot be undone</Text>
          </View>
        </View>

        {/* Active subscription warning */}
        {isActive && (
          <View style={styles.subscriptionWarning}>
            <Ionicons name="warning-outline" size={18} color="#F5A623" />
            <View style={{ flex: 1 }}>
              <Text style={styles.subscriptionWarningTitle}>
                Cancel your subscription first
              </Text>
              <Text style={styles.subscriptionWarningBody}>
                You have an active membership. Deleting your account will not
                automatically cancel your Stripe subscription. Please contact us
                before deleting to avoid further charges.
              </Text>
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    "mailto:hello@homequarters.co.uk?subject=Cancel%20Membership&body=Please%20cancel%20my%20HomeQuarters%20membership.%20Member%20code%3A%20" +
                      (profile?.member_code ?? "")
                  )
                }
                style={styles.contactLink}
              >
                <Text style={styles.contactLinkText}>
                  Email us to cancel · hello@homequarters.co.uk
                </Text>
                <Ionicons name="open-outline" size={13} color="#F5A623" />
              </Pressable>
            </View>
          </View>
        )}

        {/* What will be deleted */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT WILL BE DELETED</Text>
          <View style={styles.consequenceCard}>
            {CONSEQUENCES.map((item, i) => (
              <View key={i} style={styles.consequenceRow}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.red}
                  style={{ marginTop: 1 }}
                />
                <Text style={styles.consequenceText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Password confirmation */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONFIRM YOUR PASSWORD</Text>
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
          <Text style={styles.inputHint}>
            We need your password to verify it's really you.
          </Text>
        </View>

        {/* Delete button */}
        <Pressable
          onPress={handleDelete}
          disabled={deleting || !password}
          style={({ pressed }) => [
            styles.deleteBtn,
            { opacity: deleting || !password ? 0.5 : pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
        >
          {deleting ? (
            <Text style={styles.deleteBtnText}>Deleting account...</Text>
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color={colors.white} />
              <Text style={styles.deleteBtnText}>Permanently Delete Account</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Keep My Account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: 48,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
  headerTitle: {
    color: colors.dark,
    fontSize: 24,
    fontWeight: "700",
  },
  headerSub: {
    color: colors.red,
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },

  // Active subscription warning
  subscriptionWarning: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: "rgba(245,166,35,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.25)",
    padding: 16,
    alignItems: "flex-start",
  },
  subscriptionWarningTitle: {
    color: "#F5A623",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  subscriptionWarningBody: {
    color: "rgba(245,166,35,0.8)",
    fontSize: 13,
    lineHeight: 19,
  },
  contactLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  contactLinkText: {
    color: "#F5A623",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // Consequence list
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    color: colors.stone,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 10,
  },
  consequenceCard: {
    backgroundColor: "rgba(229,57,53,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(229,57,53,0.15)",
    padding: 16,
    gap: 12,
  },
  consequenceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  consequenceText: {
    flex: 1,
    color: colors.stone,
    fontSize: 13,
    lineHeight: 19,
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
    marginBottom: 8,
  },
  inputHint: {
    color: colors.stone,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.7,
  },

  // CTA buttons
  deleteBtn: {
    marginHorizontal: 20,
    backgroundColor: colors.red,
    borderRadius: 100,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  deleteBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  cancelBtn: {
    marginHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    color: colors.stone,
    fontSize: 14,
    fontWeight: "600",
  },
});
