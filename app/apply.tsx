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

export default function ApplyScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert("Required Fields", "Please fill in your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      // Sign up the user with Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: `hq-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim() || null,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Generate member code
        const code = `HQ-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        // Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || null,
            member_code: code,
            membership_status: "pending" as const,
          } as any);

        if (profileError) throw profileError;
      }

      router.replace("/pending");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong.");
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
        <View style={{ gap: 16 }}>
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
