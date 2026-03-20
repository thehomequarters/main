import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  SectionList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  HOMELAND_REGIONS,
  getRegionForCountry,
  homelandsLabel,
} from "@/lib/homelands";

export default function ApplyScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [homelands, setHomelands] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleHomeland = (item: string) => {
    setHomelands((prev) => {
      if (prev.includes(item)) {
        return prev.filter((h) => h !== item);
      }
      const next = [...prev, item];
      // Auto-add parent region when a country is selected
      const region = getRegionForCountry(item);
      if (region && !next.includes(region)) {
        next.push(region);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert("Required Fields", "Please fill in your name and email.");
      return;
    }
    if (homelands.length === 0) {
      Alert.alert("Required Fields", "Please select at least one homeland.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password", "Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const code = `HQ-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      await setDoc(doc(db, "profiles", user.uid), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        avatar_url: null,
        member_code: code,
        membership_status: "pending",
        homelands,
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

  const inputStyle = {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: colors.white,
    fontSize: 15,
  };

  const sections = HOMELAND_REGIONS.map((r) => ({
    title: r.region,
    data: r.countries,
  }));

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
          HomeQuarters is a private members' club for the global diaspora.
          Membership is by application only.
        </Text>

        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TextInput
              placeholder="First name"
              placeholderTextColor={colors.grey}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              style={{ flex: 1, ...inputStyle }}
            />
            <TextInput
              placeholder="Last name"
              placeholderTextColor={colors.grey}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              style={{ flex: 1, ...inputStyle }}
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
            style={inputStyle}
          />

          <TextInput
            placeholder="Create a password (min 6 characters)"
            placeholderTextColor={colors.grey}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={inputStyle}
          />

          <TextInput
            placeholder="Phone (optional)"
            placeholderTextColor={colors.grey}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={inputStyle}
          />

          {/* Homeland picker trigger */}
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              ...inputStyle,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 54,
            }}
          >
            <Text
              style={{
                color: homelands.length ? colors.white : colors.grey,
                fontSize: 15,
                flex: 1,
                flexWrap: "wrap",
              }}
            >
              {homelands.length
                ? homelandsLabel(homelands)
                : "Where are you from?"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.grey} style={{ marginLeft: 8 }} />
          </Pressable>

          {/* Selected homeland pills */}
          {homelands.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {homelands.map((h) => (
                <Pressable
                  key={h}
                  onPress={() => toggleHomeland(h)}
                  style={{
                    backgroundColor: "rgba(201, 168, 76, 0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(201, 168, 76, 0.3)",
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Text style={{ color: colors.gold, fontSize: 12, fontWeight: "600" }}>
                    {h}
                  </Text>
                  <Ionicons name="close" size={12} color={colors.gold} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: colors.gold,
            borderRadius: 10,
            paddingVertical: 16,
            marginTop: 32,
            opacity: submitting ? 0.6 : 1,
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
            {submitting ? "Submitting..." : "Submit Application"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push("/login")} style={{ marginTop: 24 }}>
          <Text style={{ color: colors.grey, fontSize: 13, textAlign: "center" }}>
            Already a member?{" "}
            <Text style={{ color: colors.gold }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>

      {/* Homeland Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}
          onPress={() => setShowPicker(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.dark,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "80%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.darkBorder,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text style={{ color: colors.white, fontSize: 18, fontWeight: "700" }}>
                  Select your homelands
                </Text>
                <Text style={{ color: colors.grey, fontSize: 12, marginTop: 2 }}>
                  Pick as many as you like. Selecting a country adds its region too.
                </Text>
              </View>
              <Pressable onPress={() => setShowPicker(false)}>
                <Ionicons name="checkmark-circle" size={28} color={colors.gold} />
              </Pressable>
            </View>

            <SectionList
              sections={sections}
              keyExtractor={(item) => item}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ paddingBottom: 48 }}
              renderSectionHeader={({ section }) => {
                const isSelected = homelands.includes(section.title);
                return (
                  <Pressable
                    onPress={() => toggleHomeland(section.title)}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      marginTop: 4,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: isSelected
                        ? "rgba(201, 168, 76, 0.06)"
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? colors.gold : colors.white,
                        fontSize: 14,
                        fontWeight: "700",
                        letterSpacing: 0.4,
                      }}
                    >
                      {section.title}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color={colors.gold} />
                    )}
                  </Pressable>
                );
              }}
              renderItem={({ item }) => {
                const isSelected = homelands.includes(item);
                return (
                  <Pressable
                    onPress={() => toggleHomeland(item)}
                    style={{
                      paddingHorizontal: 36,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottomWidth: 1,
                      borderBottomColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? colors.gold : colors.grey,
                        fontSize: 14,
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={15} color={colors.gold} />
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
