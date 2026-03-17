import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";
import * as Haptics from "expo-haptics";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import { colors, fonts } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Welcome-back splash
  const [welcomeSplashUrl, setWelcomeSplashUrl] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const welcomeFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getDoc(doc(db, "app_settings", "welcome_splash")).then((snap) => {
      if (snap.exists()) {
        const url = snap.data().image_url as string;
        if (url) setWelcomeSplashUrl(url);
      }
    }).catch(() => {});
  }, []);

  const triggerWelcomeSplash = (name: string) => {
    setWelcomeName(name);
    setShowWelcome(true);
    Animated.sequence([
      Animated.timing(welcomeFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(welcomeFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => router.replace("/"));
  };

  const handlePasswordReset = async () => {
    const addr = resetEmail.trim().toLowerCase();
    if (!addr) {
      toast("Please enter your email address.", "error");
      return;
    }
    setResetLoading(true);
    try {
      const sendPasswordReset = httpsCallable(getFunctions(), "sendPasswordReset");
      await sendPasswordReset({ email: addr });
      setResetSent(true);
    } catch {
      // Show success even on error to avoid email enumeration
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  };

  const closeReset = () => {
    setResetVisible(false);
    setResetEmail("");
    setResetSent(false);
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      toast("Please enter your email address.", "error");
      return;
    }
    if (!password) {
      toast("Please enter your password.", "error");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      // Fetch first name for the welcome splash
      const profileSnap = await getDoc(doc(db, "profiles", credential.user.uid));
      const firstName = profileSnap.exists()
        ? ((profileSnap.data().first_name as string) ?? "")
        : "";
      triggerWelcomeSplash(firstName || "Member");
    } catch (error: any) {
      const msg =
        error.code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : error.code === "auth/user-not-found"
            ? "No account found with this email."
            : error.message || "Something went wrong.";
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingVertical: 60,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* HQ Logo */}
          <Text
            style={{
              color: colors.dark,
              fontSize: 40,
              fontFamily: fonts.display,
              letterSpacing: 8,
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            HQ
          </Text>

          <Text
            style={{
              color: colors.dark,
              fontSize: 38,
              fontFamily: fonts.display,
              textAlign: "center",
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            Welcome Back
          </Text>

          <Text
            style={{
              color: colors.stone,
              fontSize: 15,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 40,
            }}
          >
            Sign in with your email and password.
          </Text>

          <View style={{ gap: 16 }}>
            <TextInput
              placeholder="Email address"
              placeholderTextColor={colors.stone}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 16,
                color: colors.dark,
                fontSize: 15,
              }}
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.stone}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 16,
                color: colors.dark,
                fontSize: 15,
              }}
            />
          </View>

          <Pressable
            onPress={() => { setResetEmail(email); setResetVisible(true); }}
            style={{ alignSelf: "flex-end", marginTop: 10 }}
          >
            <Text style={{ color: colors.stone, fontSize: 13 }}>
              Forgot password?
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: loading ? "rgba(28,28,30,0.5)" : colors.dark,
              borderRadius: 10,
              paddingVertical: 16,
              marginTop: 24,
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontSize: 16,
                fontFamily: fonts.bold,
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
            <Text
              style={{
                color: colors.stone,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Don't have an account?{" "}
              <Text style={{ color: colors.dark, fontFamily: fonts.semibold }}>Apply</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Welcome-back splash — fades in over dark bg, then fades out */}
      {showWelcome && (
        <Animated.View style={[styles.welcomeOverlay, { opacity: welcomeFade }]}>
          {!!welcomeSplashUrl && (
            <Image
              source={{ uri: welcomeSplashUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          )}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.52)" }]} />
          <Text style={styles.welcomeHq}>HQ</Text>
          <Text style={styles.welcomeLabel}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{welcomeName}</Text>
        </Animated.View>
      )}

      {/* Forgot Password Modal */}
      <Modal
        visible={resetVisible}
        presentationStyle="fullScreen"
        animationType="slide"
        onRequestClose={closeReset}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.white,
            padding: 28,
            paddingTop: Platform.OS === "ios" ? 60 : 40,
            paddingBottom: Platform.OS === "ios" ? 52 : 32,
          }}
        >
          <Pressable onPress={closeReset} style={{ alignSelf: "flex-end", marginBottom: 20 }}>
            <Text style={{ color: colors.stone, fontSize: 15, fontWeight: "600" }}>Close</Text>
          </Pressable>
          {resetSent ? (
            <>
              <Text
                style={{
                  color: colors.dark,
                  fontSize: 20,
                  fontFamily: fonts.bold,
                  marginBottom: 10,
                }}
              >
                Check your inbox
              </Text>
              <Text
                style={{
                  color: colors.stone,
                  fontSize: 14,
                  lineHeight: 21,
                  marginBottom: 24,
                }}
              >
                If an account exists for that email, we've sent a password reset
                link. Check your spam folder if you don't see it.
              </Text>
              <Pressable
                onPress={closeReset}
                style={{
                  backgroundColor: colors.dark,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 15 }}
                >
                  Done
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text
                style={{
                  color: colors.dark,
                  fontSize: 20,
                  fontFamily: fonts.bold,
                  marginBottom: 6,
                }}
              >
                Reset Password
              </Text>
              <Text
                style={{
                  color: colors.stone,
                  fontSize: 14,
                  lineHeight: 21,
                  marginBottom: 20,
                }}
              >
                Enter your email address and we'll send you a link to reset your
                password.
              </Text>
              <TextInput
                placeholder="Email address"
                placeholderTextColor={colors.stone}
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: colors.bg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: colors.dark,
                  fontSize: 15,
                  marginBottom: 16,
                }}
              />
              <Pressable
                onPress={handlePasswordReset}
                disabled={resetLoading}
                style={{
                  backgroundColor: resetLoading ? "rgba(28,28,30,0.5)" : colors.dark,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                {resetLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text
                    style={{
                      color: colors.white,
                      fontFamily: fonts.bold,
                      fontSize: 15,
                    }}
                  >
                    Send Reset Link
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  welcomeHq: {
    color: colors.gold,
    fontSize: 36,
    fontFamily: fonts.display,
    letterSpacing: 10,
    marginBottom: 32,
    opacity: 0.85,
  },
  welcomeLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontFamily: fonts.medium,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  welcomeName: {
    color: "#FFFFFF",
    fontSize: 48,
    fontFamily: fonts.display,
    letterSpacing: -0.5,
    lineHeight: 54,
  },
});
