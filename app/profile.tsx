import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const initials =
    (profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "");

  const hasChanges =
    firstName !== (profile?.first_name ?? "") ||
    lastName !== (profile?.last_name ?? "") ||
    phone !== (profile?.phone ?? "");

  const handleSave = async () => {
    if (!user?.uid) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "First and last name are required.");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "profiles", user.uid), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
      });
      await refreshProfile();
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.black }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            paddingTop: 60,
            paddingHorizontal: 20,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.dark,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </Pressable>
          <Text
            style={{
              color: colors.white,
              fontSize: 20,
              fontWeight: "600",
            }}
          >
            Profile
          </Text>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: "center", marginTop: 24, marginBottom: 36 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "rgba(201, 168, 76, 0.15)",
              borderWidth: 2,
              borderColor: colors.gold,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.gold,
                fontSize: 36,
                fontWeight: "700",
                letterSpacing: 2,
              }}
            >
              {initials.toUpperCase()}
            </Text>
          </View>

          <Text
            style={{
              color: colors.white,
              fontSize: 22,
              fontWeight: "600",
              marginTop: 16,
            }}
          >
            {profile?.first_name} {profile?.last_name}
          </Text>

          <Text
            style={{
              color: colors.grey,
              fontSize: 13,
              marginTop: 4,
              letterSpacing: 2,
            }}
          >
            {profile?.member_code}
          </Text>

          <View
            style={{
              backgroundColor:
                profile?.membership_status === "active"
                  ? "rgba(76, 175, 80, 0.15)"
                  : "rgba(201, 168, 76, 0.15)",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 4,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                color:
                  profile?.membership_status === "active"
                    ? colors.green
                    : colors.gold,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {profile?.membership_status}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              color: colors.white,
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 16,
            }}
          >
            Personal Details
          </Text>

          {/* First Name */}
          <Text
            style={{
              color: colors.grey,
              fontSize: 12,
              fontWeight: "500",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            FIRST NAME
          </Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            style={{
              backgroundColor: colors.dark,
              borderRadius: 10,
              padding: 14,
              color: colors.white,
              fontSize: 15,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              marginBottom: 16,
            }}
            placeholderTextColor={colors.grey}
          />

          {/* Last Name */}
          <Text
            style={{
              color: colors.grey,
              fontSize: 12,
              fontWeight: "500",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            LAST NAME
          </Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            style={{
              backgroundColor: colors.dark,
              borderRadius: 10,
              padding: 14,
              color: colors.white,
              fontSize: 15,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              marginBottom: 16,
            }}
            placeholderTextColor={colors.grey}
          />

          {/* Phone */}
          <Text
            style={{
              color: colors.grey,
              fontSize: 12,
              fontWeight: "500",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            PHONE
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+263 77 000 0000"
            style={{
              backgroundColor: colors.dark,
              borderRadius: 10,
              padding: 14,
              color: colors.white,
              fontSize: 15,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              marginBottom: 16,
            }}
            placeholderTextColor={colors.grey}
          />

          {/* Email (read-only) */}
          <Text
            style={{
              color: colors.grey,
              fontSize: 12,
              fontWeight: "500",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            EMAIL
          </Text>
          <View
            style={{
              backgroundColor: colors.dark,
              borderRadius: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: colors.grey, fontSize: 15 }}>
              {profile?.email}
            </Text>
          </View>
          <Text
            style={{
              color: colors.grey,
              fontSize: 11,
              opacity: 0.6,
              marginBottom: 28,
            }}
          >
            Email cannot be changed.
          </Text>

          {/* Save Button */}
          {hasChanges && (
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={{
                backgroundColor: colors.gold,
                borderRadius: 12,
                paddingVertical: 16,
                opacity: saving ? 0.6 : 1,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: colors.black,
                  fontSize: 16,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>
          )}

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.darkBorder,
              marginVertical: 12,
            }}
          />

          {/* Sign Out */}
          <Pressable
            onPress={handleSignOut}
            style={{
              paddingVertical: 16,
            }}
          >
            <Text
              style={{
                color: colors.red,
                fontSize: 15,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
