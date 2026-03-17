import React from "react";
import { View, Text, Platform, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const BG    = "#1C1C1E";
const CARD  = "#252523";
const LINE  = "rgba(255,255,255,0.08)";
const PEARL = "rgba(255,255,255,0.82)";
const MUTED = "rgba(255,255,255,0.45)";

export default function ESIMIntroScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="light" />

      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? 60 : 44,
          left: 24,
          zIndex: 10,
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: CARD,
          borderWidth: 1,
          borderColor: LINE,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="arrow-back" size={18} color={PEARL} />
      </Pressable>

      {/* Centred content */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 36 }}>
        {/* Icon */}
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 26,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: LINE,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <Ionicons name="airplane-outline" size={40} color={PEARL} />
        </View>

        <Text
          style={{
            color: MUTED,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Member Perk
        </Text>

        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 34,
            fontWeight: "800",
            letterSpacing: -0.5,
            textAlign: "center",
            lineHeight: 40,
            marginBottom: 16,
          }}
        >
          eSIM & Travel
        </Text>

        <Text
          style={{
            color: MUTED,
            fontSize: 16,
            lineHeight: 26,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          We're building something for the HQ traveller.{"\n"}
          Stay tuned — this is coming soon.
        </Text>

        {/* Coming soon pill */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: CARD,
            borderRadius: 100,
            borderWidth: 1,
            borderColor: LINE,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Ionicons name="time-outline" size={16} color={MUTED} />
          <Text style={{ color: MUTED, fontSize: 13, fontWeight: "600" }}>Coming soon</Text>
        </View>
      </View>
    </View>
  );
}
