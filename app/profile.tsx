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
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { pickImage, uploadAvatar } from "@/lib/storage";
import type { MemberIndustry } from "@/lib/database.types";

const INDUSTRIES: { key: MemberIndustry; label: string }[] = [
  { key: "creative", label: "Creative" },
  { key: "tech", label: "Tech" },
  { key: "hospitality", label: "Hospitality" },
  { key: "music", label: "Music" },
  { key: "business", label: "Business" },
  { key: "wellness", label: "Wellness" },
];

function FieldLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        color: colors.grey,
        fontSize: 12,
        fontWeight: "500",
        marginBottom: 6,
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Text>
  );
}

function FieldInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      multiline={multiline}
      style={{
        backgroundColor: colors.dark,
        borderRadius: 10,
        padding: 14,
        color: colors.white,
        fontSize: 15,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        marginBottom: 16,
        ...(multiline ? { minHeight: 80, textAlignVertical: "top" as const } : {}),
      }}
      placeholderTextColor={colors.grey}
    />
  );
}

export default function ProfileScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [title, setTitle] = useState(profile?.title ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [industry, setIndustry] = useState<MemberIndustry | null>(
    profile?.industry ?? null
  );
  const [interestsText, setInterestsText] = useState(
    (profile?.interests ?? []).join(", ")
  );
  const [instagramHandle, setInstagramHandle] = useState(
    profile?.instagram_handle ?? ""
  );
  const [linkedinHandle, setLinkedinHandle] = useState(
    profile?.linkedin_handle ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [avatarLocal, setAvatarLocal] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initials =
    (profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "");

  const avatarSource = avatarLocal || profile?.avatar_url;

  const handlePickAvatar = async () => {
    const uri = await pickImage();
    if (!uri || !user?.uid) return;

    setAvatarLocal(uri);
    setUploadingAvatar(true);
    try {
      const downloadUrl = await uploadAvatar(user.uid, uri);
      await updateDoc(doc(db, "profiles", user.uid), {
        avatar_url: downloadUrl,
      });
      await refreshProfile();
    } catch (e: any) {
      Alert.alert("Upload failed", e.message);
      setAvatarLocal(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const hasChanges =
    firstName !== (profile?.first_name ?? "") ||
    lastName !== (profile?.last_name ?? "") ||
    phone !== (profile?.phone ?? "") ||
    title !== (profile?.title ?? "") ||
    bio !== (profile?.bio ?? "") ||
    city !== (profile?.city ?? "") ||
    industry !== (profile?.industry ?? null) ||
    interestsText !== (profile?.interests ?? []).join(", ") ||
    instagramHandle !== (profile?.instagram_handle ?? "") ||
    linkedinHandle !== (profile?.linkedin_handle ?? "");

  const handleSave = async () => {
    if (!user?.uid) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "First and last name are required.");
      return;
    }

    setSaving(true);
    try {
      const interests = interestsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await updateDoc(doc(db, "profiles", user.uid), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        title: title.trim() || null,
        bio: bio.trim() || null,
        city: city.trim() || null,
        industry: industry,
        interests: interests,
        instagram_handle: instagramHandle.trim().replace(/^@/, "") || null,
        linkedin_handle: linkedinHandle.trim() || null,
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
            Edit Profile
          </Text>
        </View>

        {/* Avatar */}
        <View
          style={{ alignItems: "center", marginTop: 24, marginBottom: 36 }}
        >
          <Pressable onPress={handlePickAvatar} style={{ position: "relative" }}>
            {avatarSource ? (
              <Image
                source={{ uri: avatarSource }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 2,
                  borderColor: colors.stone,
                }}
              />
            ) : (
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "rgba(201, 168, 76, 0.15)",
                  borderWidth: 2,
                  borderColor: colors.stone,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.stone,
                    fontSize: 36,
                    fontWeight: "700",
                    letterSpacing: 2,
                  }}
                >
                  {initials.toUpperCase()}
                </Text>
              </View>
            )}
            {/* Camera badge */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.stone,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: colors.black,
              }}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Ionicons name="camera" size={14} color={colors.black} />
              )}
            </View>
          </Pressable>

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
                    : colors.stone,
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

        {/* Personal Details */}
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

          <FieldLabel label="FIRST NAME" />
          <FieldInput value={firstName} onChangeText={setFirstName} />

          <FieldLabel label="LAST NAME" />
          <FieldInput value={lastName} onChangeText={setLastName} />

          <FieldLabel label="PHONE" />
          <FieldInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+263 77 000 0000"
            keyboardType="phone-pad"
          />

          <FieldLabel label="EMAIL" />
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

          {/* Social / Discovery Details */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.darkBorder,
              marginBottom: 28,
            }}
          />
          <Text
            style={{
              color: colors.white,
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 6,
            }}
          >
            Social Profile
          </Text>
          <Text
            style={{
              color: colors.grey,
              fontSize: 12,
              marginBottom: 20,
            }}
          >
            Visible to other members on the Discover tab.
          </Text>

          <FieldLabel label="TITLE / ROLE" />
          <FieldInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Photographer & Visual Artist"
          />

          <FieldLabel label="BIO" />
          <FieldInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell members about yourself..."
            multiline
          />

          <FieldLabel label="CITY" />
          <FieldInput
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Harare"
          />

          <FieldLabel label="INDUSTRY" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 16 }}
          >
            {INDUSTRIES.map((ind) => {
              const isSelected = industry === ind.key;
              return (
                <Pressable
                  key={ind.key}
                  onPress={() =>
                    setIndustry(isSelected ? null : ind.key)
                  }
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? colors.stone
                      : "rgba(160, 160, 160, 0.25)",
                    backgroundColor: isSelected
                      ? "rgba(154,142,130,0.18)"
                      : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? colors.stone : colors.grey,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {ind.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <FieldLabel label="INTERESTS" />
          <FieldInput
            value={interestsText}
            onChangeText={setInterestsText}
            placeholder="Photography, Music, Startups (comma separated)"
          />

          <FieldLabel label="INSTAGRAM" />
          <FieldInput
            value={instagramHandle}
            onChangeText={setInstagramHandle}
            placeholder="@yourhandle"
          />

          <FieldLabel label="LINKEDIN" />
          <FieldInput
            value={linkedinHandle}
            onChangeText={setLinkedinHandle}
            placeholder="yourname or full profile URL"
          />

          {/* Save Button */}
          {hasChanges && (
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={{
                backgroundColor: colors.stone,
                borderRadius: 100,
                paddingVertical: 16,
                opacity: saving ? 0.6 : 1,
                marginBottom: 16,
                alignItems: "center",
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
            style={{ paddingVertical: 16 }}
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
