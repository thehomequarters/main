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
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
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

      Alert.alert(
        "Check Your Email",
        "We sent you a magic link. Tap it to sign in."
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong.");
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
          Sign in with your email to access your membership.
        </Text>

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
          onPress={handleLogin}
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
            {loading ? "Sending..." : "Send Magic Link"}
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
            Back to{" "}
            <Text style={{ color: colors.gold }}>application</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
