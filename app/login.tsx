import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
      });

      if (error) throw error;

      setStep("code");
      setTimeout(() => otpRef.current?.focus(), 300);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      Alert.alert("Required", "Please enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: "email",
      });

      if (error) throw error;

      // Auth state listener in AuthProvider will handle navigation
    } catch (error: any) {
      Alert.alert("Error", error.message || "Invalid or expired code.");
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
          {step === "email"
            ? "Sign in with your email to access your membership."
            : `We sent a 6-digit code to ${email.trim().toLowerCase()}. Enter it below.`}
        </Text>

        {step === "email" ? (
          <>
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

            <Pressable
              onPress={handleSendCode}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: colors.gold,
                borderRadius: 10,
                paddingVertical: 16,
                marginTop: 24,
                opacity: loading ? 0.6 : pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
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
                {loading ? "Sending..." : "Send Code"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              ref={otpRef}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.grey}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={6}
              style={{
                backgroundColor: colors.dark,
                borderWidth: 1,
                borderColor: colors.darkBorder,
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 16,
                color: colors.white,
                fontSize: 24,
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: 12,
              }}
            />

            <Pressable
              onPress={handleVerifyCode}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: colors.gold,
                borderRadius: 10,
                paddingVertical: 16,
                marginTop: 24,
                opacity: loading ? 0.6 : pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
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
                {loading ? "Verifying..." : "Verify & Sign In"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setStep("email");
                setOtp("");
              }}
              style={{ marginTop: 16 }}
            >
              <Text
                style={{
                  color: colors.gold,
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Use a different email
              </Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text
            style={{
              color: colors.grey,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Back to{" "}
            <Text style={{ color: colors.gold }}>application</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
