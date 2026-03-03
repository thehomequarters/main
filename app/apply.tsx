import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { colors } from "@/constants/theme";

/** Generate a random code like HQ-XXXX-XXXX */
function genCode(prefix: string) {
  const s = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${s()}-${s()}`;
}

export default function ApplyScreen() {
  const router = useRouter();

  // Step 1: verify invite code
  const [inviteCode, setInviteCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);

  // Step 2: fill out details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleVerifyCode = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      Alert.alert("Enter your invitation code to continue.");
      return;
    }
    setVerifying(true);
    try {
      const snap = await getDoc(doc(db, "invites", code));
      if (!snap.exists()) {
        Alert.alert(
          "Invalid Code",
          "This invitation code is not recognised. Check the code and try again."
        );
        return;
      }
      const data = snap.data();
      if (data.used) {
        Alert.alert(
          "Code Already Used",
          "This invitation has already been claimed. Request a new one from your contact."
        );
        return;
      }
      setInviteData({ ...data, id: code });
      setVerified(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert("Please complete all required fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const memberCode = genCode("HQ");
      const applicationCode = genCode("APP");

      // Mark invite as used
      await updateDoc(doc(db, "invites", inviteData.id), {
        used: true,
        used_by: user.uid,
        used_at: new Date().toISOString(),
      });

      // Determine inviter UID from the invite (created_by field)
      const inviterUid: string = inviteData.created_by ?? null;
      const initialVouchers = inviterUid ? [inviterUid] : [];

      await setDoc(doc(db, "profiles", user.uid), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        avatar_url: null,
        member_code: memberCode,
        application_code: applicationCode,
        membership_status: "pending",
        push_token: null,
        created_at: new Date().toISOString(),
        // nomination fields
        vouchers: initialVouchers,
        voucher_count: initialVouchers.length,
        nominations_used: 0,
        // social fields
        title: null,
        bio: null,
        city: null,
        industry: null,
        interests: [],
        instagram_handle: null,
        linkedin_handle: null,
      });

      router.replace("/pending");
    } catch (error: any) {
      const msg =
        error.code === "auth/email-already-in-use"
          ? "This email is already registered. Try signing in instead."
          : error.message || "Something went wrong.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
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
        {/* Wordmark */}
        <Text style={styles.wordmark}>HQ</Text>

        {!verified ? (
          /* ─── Step 1: Enter invitation code ─── */
          <>
            <View style={styles.sealWrap}>
              <View style={styles.seal}>
                <Text style={styles.sealSymbol}>✦</Text>
              </View>
            </View>

            <Text style={styles.headline}>By invitation only.</Text>
            <Text style={styles.subtext}>
              HomeQuarters is a private community. Access requires a personal
              invitation from a current member.
            </Text>
            <Text style={styles.subtext2}>
              Your invitation is strictly confidential and non-transferable.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>INVITATION CODE</Text>
            <TextInput
              placeholder="e.g. HQ-XXXX-XXXX"
              placeholderTextColor={colors.stone}
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[
                styles.codeInput,
                inviteCode.length > 0 && styles.codeInputActive,
              ]}
            />

            <Pressable
              onPress={handleVerifyCode}
              disabled={verifying}
              style={[styles.btn, { opacity: verifying ? 0.6 : 1 }]}
            >
              <Text style={styles.btnText}>
                {verifying ? "Verifying..." : "Verify Invitation"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/login")}
              style={styles.signinRow}
            >
              <Text style={styles.signinText}>
                Already a member?{" "}
                <Text style={styles.signinLink}>Sign in</Text>
              </Text>
            </Pressable>
          </>
        ) : (
          /* ─── Step 2: Complete your application ─── */
          <>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓ INVITATION VERIFIED</Text>
            </View>

            <Text style={styles.headline2}>Complete your{"\n"}application.</Text>
            <Text style={styles.subtext}>
              Your details are kept strictly private. Only you and the
              membership committee will have access.
            </Text>

            <View style={styles.divider} />

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>FIRST NAME</Text>
                <TextInput
                  placeholder="First"
                  placeholderTextColor={colors.stone}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>LAST NAME</Text>
                <TextInput
                  placeholder="Last"
                  placeholderTextColor={colors.stone}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <TextInput
              placeholder="your@email.com"
              placeholderTextColor={colors.stone}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>CREATE PASSWORD</Text>
            <TextInput
              placeholder="Minimum 6 characters"
              placeholderTextColor={colors.stone}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>PHONE (OPTIONAL)</Text>
            <TextInput
              placeholder="+263 77 000 0000"
              placeholderTextColor={colors.stone}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.btn, { opacity: submitting ? 0.6 : 1 }]}
            >
              <Text style={styles.btnText}>
                {submitting ? "Submitting..." : "Submit Application"}
              </Text>
            </Pressable>

            <Text style={styles.disclaimer}>
              Applications are reviewed by the membership committee. You will
              be notified of your decision.
            </Text>
          </>
        )}
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
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 70,
  },
  wordmark: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 7,
    marginBottom: 48,
  },
  // Seal / icon
  sealWrap: {
    alignItems: "flex-start",
    marginBottom: 32,
  },
  seal: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  sealSymbol: {
    color: colors.gold,
    fontSize: 24,
  },
  headline: {
    color: colors.dark,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 16,
  },
  headline2: {
    color: colors.dark,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 12,
    marginTop: 8,
  },
  subtext: {
    color: colors.stone,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  subtext2: {
    color: colors.stone,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 28,
  },
  fieldLabel: {
    color: colors.stone,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
    color: colors.dark,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 28,
  },
  codeInputActive: {
    borderColor: colors.dark,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: colors.dark,
    fontSize: 15,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  btnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  signinRow: {
    alignItems: "center",
    marginTop: 8,
  },
  signinText: {
    color: colors.stone,
    fontSize: 13,
  },
  signinLink: {
    color: colors.dark,
    fontWeight: "600",
  },
  verifiedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(76,175,80,0.12)",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 20,
  },
  verifiedBadgeText: {
    color: "#4CAF50",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  disclaimer: {
    color: colors.stone,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    fontStyle: "italic",
    opacity: 0.6,
  },
});
