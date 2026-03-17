import React from "react";
import { View, Text, Platform, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BG    = "#1C1C1E";
const CARD  = "#252523";
const LINE  = "rgba(255,255,255,0.08)";
const PEARL = "rgba(255,255,255,0.82)";
const MUTED = "rgba(255,255,255,0.45)";

const TEASER = [
  { icon: "wifi-outline" as const,    label: "Global eSIMs",         body: "Instant data in 200+ countries — no SIM swaps, no roaming surprises." },
  { icon: "pricetag-outline" as const, label: "Local rates",          body: "Browse affordable data plans at local prices, paid in pounds." },
  { icon: "flash-outline" as const,   label: "Instant activation",   body: "Install before you fly, activate on arrival. Five minutes, sorted." },
];

export default function ESIMScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: Platform.OS === "ios" ? 60 : 44,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: CARD,
            borderWidth: 1,
            borderColor: LINE,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color={PEARL} />
        </Pressable>
        <View>
          <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>eSIM & Travel</Text>
          <Text style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>Member benefit</Text>
        </View>
      </View>

      {/* Hero card */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 16,
          backgroundColor: CARD,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: LINE,
          padding: 28,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: LINE,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Ionicons name="airplane-outline" size={34} color={PEARL} />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 100,
            paddingHorizontal: 14,
            paddingVertical: 7,
            marginBottom: 20,
          }}
        >
          <Ionicons name="time-outline" size={13} color={MUTED} />
          <Text style={{ color: MUTED, fontSize: 12, fontWeight: "600", letterSpacing: 0.5 }}>Coming Soon</Text>
        </View>

        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 26,
            fontWeight: "800",
            textAlign: "center",
            letterSpacing: -0.3,
            lineHeight: 32,
            marginBottom: 14,
          }}
        >
          Travel like a member
        </Text>
        <Text
          style={{
            color: MUTED,
            fontSize: 15,
            lineHeight: 24,
            textAlign: "center",
          }}
        >
          We're building an eSIM experience designed for the HQ traveller.
          Stay connected wherever you go — local rates, no drama.
        </Text>
      </View>

      {/* Teaser features */}
      <View style={{ marginHorizontal: 20, marginTop: 24 }}>
        <Text
          style={{
            color: MUTED,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          What's coming
        </Text>
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: LINE,
            overflow: "hidden",
          }}
        >
          {TEASER.map((item, i) => (
            <View
              key={item.label}
              style={{
                flexDirection: "row",
                padding: 18,
                gap: 16,
                borderBottomWidth: i < TEASER.length - 1 ? 1 : 0,
                borderBottomColor: LINE,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: LINE,
                  justifyContent: "center",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <Ionicons name={item.icon} size={18} color={PEARL} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600", marginBottom: 4 }}>
                  {item.label}
                </Text>
                <Text style={{ color: MUTED, fontSize: 13, lineHeight: 20 }}>
                  {item.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
