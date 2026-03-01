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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { colors } from "@/constants/theme";

export default function ApplyScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert("Required Fields", "Please fill in your name and email.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password", "Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      // Create user with Firebase Auth
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      // Generate member code
      const code = `HQ-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      // Create profile in Firestore
      await setDoc(doc(db, "profiles", user.uid), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        avatar_url: null,
        member_code: code,
        membership_status: "pending",
        created_at: new Date().toISOString(),
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

        {/* Headline */}
        <Text
          style={{
            color: colors.white,
            fontSize: 24,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Apply for Membership
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
          HomeQuarters is a private community for the diaspora. Membership is by
          application only.
        </Text>

        {/* Form */}
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TextInput
              placeholder="First name"
              placeholderTextColor={colors.grey}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              style={{
                flex: 1,
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
              placeholder="Last name"
              placeholderTextColor={colors.grey}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              style={{
                flex: 1,
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
            placeholder="Create a password (min 6 characters)"
            placeholderTextColor={colors.grey}
            value={password}
            onChangeText={setPassword}
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
            placeholder="Phone (optional)"
            placeholderTextColor={colors.grey}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
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

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={({ pressed }) => ({
            backgroundColor: colors.gold,
            borderRadius: 10,
            paddingVertical: 16,
            marginTop: 32,
            opacity: submitting ? 0.6 : pressed ? 0.85 : 1,
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
            {submitting ? "Submitting..." : "Submit Application"}
          </Text>
        </Pressable>

        {/* Login link for returning members */}
        <Pressable
          onPress={() => router.push("/login")}
          style={{ marginTop: 24 }}
        >
          <Text
            style={{
              color: colors.grey,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Already a member?{" "}
            <Text style={{ color: colors.gold }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
