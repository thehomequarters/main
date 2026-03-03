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
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { colors } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handlePasswordReset = async () => {
    const addr = resetEmail.trim().toLowerCase();
    if (!addr) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, addr);
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
      Alert.alert("Required", "Please enter your email address.");
      return;
    }
    if (!password) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      router.replace("/");
    } catch (error: any) {
      const msg =
        error.code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : error.code === "auth/user-not-found"
            ? "No account found with this email."
            : error.message || "Something went wrong.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.black }}
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
            color: colors.gold,
            fontSize: 40,
            fontWeight: "700",
            letterSpacing: 8,
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          HQ
        </Text>

        <Text
          style={{
            color: colors.white,
            fontSize: 24,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Welcome Back
        </Text>

        <Text
          style={{
            color: colors.grey,
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
            placeholderTextColor={colors.grey}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: colors.dark,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingVertical: 16,
              color: colors.white,
              fontSize: 15,
            }}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.grey}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              backgroundColor: colors.dark,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingVertical: 16,
              color: colors.white,
              fontSize: 15,
            }}
          />
        </View>

        <Pressable
          onPress={() => { setResetEmail(email); setResetVisible(true); }}
          style={{ alignSelf: "flex-end", marginTop: 10 }}
        >
          <Text style={{ color: colors.gold, fontSize: 13 }}>
            Forgot password?
          </Text>
        </Pressable>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: colors.gold,
            borderRadius: 10,
            paddingVertical: 16,
            marginTop: 24,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              color: colors.black,
              fontSize: 16,
              fontWeight: "700",
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
              color: colors.grey,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Don't have an account?{" "}
            <Text style={{ color: colors.gold }}>Apply</Text>
          </Text>
        </Pressable>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={resetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReset}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          onPress={closeReset}
        />
        <View
          style={{
            backgroundColor: colors.dark,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: colors.darkBorder,
            padding: 28,
            paddingBottom: Platform.OS === "ios" ? 52 : 32,
          }}
        >
          {resetSent ? (
            <>
              <Text
                style={{
                  color: colors.white,
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 10,
                }}
              >
                Check your inbox
              </Text>
              <Text
                style={{
                  color: colors.grey,
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
                  backgroundColor: colors.gold,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: colors.black, fontWeight: "700", fontSize: 15 }}
                >
                  Done
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text
                style={{
                  color: colors.white,
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                Reset Password
              </Text>
              <Text
                style={{
                  color: colors.grey,
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
                placeholderTextColor={colors.grey}
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: colors.black,
                  borderWidth: 1,
                  borderColor: colors.darkBorder,
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: colors.white,
                  fontSize: 15,
                  marginBottom: 16,
                }}
              />
              <Pressable
                onPress={handlePasswordReset}
                disabled={resetLoading}
                style={{
                  backgroundColor: colors.gold,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: resetLoading ? 0.6 : 1,
                }}
              >
                {resetLoading ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Text
                    style={{
                      color: colors.black,
                      fontWeight: "700",
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
    </KeyboardAvoidingView>
  );
}
