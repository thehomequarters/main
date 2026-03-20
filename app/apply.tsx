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
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export const HOMELANDS = [
  "Algeria", "Angola", "Antigua & Barbuda", "Bahamas", "Barbados", "Botswana",
  "Burkina Faso", "Burundi", "Cameroon", "Cape Verde", "Central African Republic",
  "Chad", "Comoros", "Congo (DRC)", "Congo (Republic)", "Côte d'Ivoire",
  "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia",
  "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Jamaica", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
  "Niger", "Nigeria", "Rwanda", "São Tomé & Príncipe", "Senegal",
  "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan",
  "Tanzania", "Togo", "Trinidad & Tobago", "Tunisia", "Uganda",
  "Zambia", "Zimbabwe",
];

export default function ApplyScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [homeland, setHomeland] = useState("");
  const [showHomelandPicker, setShowHomelandPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert("Required Fields", "Please fill in your name and email.");
      return;
    }

    if (!homeland) {
      Alert.alert("Required Fields", "Please select your homeland.");
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
        homeland: homeland,
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
          HomeQuarters is a private members' club for the global diaspora.
          Membership is by application only.
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

          {/* Homeland Picker */}
          <Pressable
            onPress={() => setShowHomelandPicker(true)}
            style={{
              ...inputStyle,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: homeland ? colors.white : colors.grey,
                fontSize: 15,
              }}
            >
              {homeland || "Select your homeland"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.grey} />
          </Pressable>
        </View>

        {/* Submit Button */}
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

        {/* Login link */}
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

      {/* Homeland Picker Modal */}
      <Modal
        visible={showHomelandPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHomelandPicker(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}
          onPress={() => setShowHomelandPicker(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.dark,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "70%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.darkBorder,
              }}
            >
              <Text
                style={{ color: colors.white, fontSize: 18, fontWeight: "700" }}
              >
                Select your homeland
              </Text>
              <Text style={{ color: colors.grey, fontSize: 13, marginTop: 4 }}>
                Where are you originally from?
              </Text>
            </View>
            <FlatList
              data={HOMELANDS}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setHomeland(item);
                    setShowHomelandPicker(false);
                  }}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.darkBorder,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 15 }}>
                    {item}
                  </Text>
                  {homeland === item && (
                    <Ionicons name="checkmark" size={18} color={colors.gold} />
                  )}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
