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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { colors } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      style={{ flex: 1, backgroundColor: colors.bg }}
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
            color: colors.dark,
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

        {/* Forgot password */}
        <Pressable style={{ marginTop: 12, alignSelf: "flex-end" }}>
          <Text
            style={{
              color: colors.stone,
              fontSize: 13,
            }}
          >
            Forgot password?
          </Text>
        </Pressable>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: colors.dark,
            borderRadius: 10,
            paddingVertical: 16,
            marginTop: 24,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              color: colors.white,
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
              color: colors.stone,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Don't have an account?{" "}
            <Text style={{ color: colors.dark, fontWeight: "600" }}>Apply</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
