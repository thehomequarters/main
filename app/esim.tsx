import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

// Replace with the real Airalo affiliate link once registered
const AIRALO_BASE_URL = "https://ref.airalo.com/PLACEHOLDER";

// Dark theme values for this premium feature screen
const DARK_BG    = "#1C1C1E";
const DARK_CARD  = "#252523";
const DARK_LINE  = "rgba(255,255,255,0.09)";
const PEARL_TEXT = "rgba(255,255,255,0.85)";
const MUTED_TEXT = "rgba(255,255,255,0.45)";

const REGIONS = [
  { label: "Global",       icon: "earth-outline" as const,         url: AIRALO_BASE_URL },
  { label: "Europe",       icon: "business-outline" as const,      url: `${AIRALO_BASE_URL}?region=europe` },
  { label: "Americas",     icon: "navigate-outline" as const,      url: `${AIRALO_BASE_URL}?region=americas` },
  { label: "Asia Pacific", icon: "partly-sunny-outline" as const,  url: `${AIRALO_BASE_URL}?region=asia-pacific` },
  { label: "Middle East",  icon: "sunny-outline" as const,         url: `${AIRALO_BASE_URL}?region=middle-east` },
  { label: "Africa",       icon: "leaf-outline" as const,          url: `${AIRALO_BASE_URL}?region=africa` },
];

const STEPS = [
  { step: "1", title: "Choose your destination", description: "Browse eSIM plans for 200+ countries and regions." },
  { step: "2", title: "Activate on arrival", description: "Install your eSIM before you fly and activate when you land." },
  { step: "3", title: "Stay connected instantly", description: "No roaming charges, no physical SIM. Just fast local data." },
];

export default function ESIMScreen() {
  const router = useRouter();

  const openAiralo = (url: string) => {
    Linking.openURL(url).catch(() => {
      Linking.openURL(AIRALO_BASE_URL);
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: DARK_BG }}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
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
            backgroundColor: DARK_CARD,
            borderWidth: 1,
            borderColor: DARK_LINE,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </Pressable>
        <View>
          <Text style={{ color: colors.white, fontSize: 24, fontWeight: "700" }}>
            eSIM & Travel
          </Text>
          <Text style={{ color: MUTED_TEXT, fontSize: 13, marginTop: 2 }}>
            Member benefit
          </Text>
        </View>
      </View>

      {/* Hero card */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 16,
          backgroundColor: DARK_CARD,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: DARK_LINE,
          padding: 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.07)",
              borderWidth: 1,
              borderColor: DARK_LINE,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="airplane-outline" size={20} color={PEARL_TEXT} />
          </View>
          <Text style={{ color: MUTED_TEXT, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
            Member Perk · Powered by Airalo
          </Text>
        </View>

        <Text style={{ color: colors.white, fontSize: 22, fontWeight: "700", lineHeight: 28, marginBottom: 10 }}>
          Stay Connected{"\n"}Anywhere You Go
        </Text>
        <Text style={{ color: MUTED_TEXT, fontSize: 14, lineHeight: 21 }}>
          As an HQ member, access affordable eSIMs for 200+ destinations through our
          partner Airalo — no roaming charges, no physical SIM, instant activation.
        </Text>

        {/* Stats strip */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 20,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: DARK_LINE,
          }}
        >
          {[
            { value: "200+", label: "Destinations" },
            { value: "4.7★", label: "App Store" },
            { value: "20M+", label: "Global users" },
          ].map((stat, i) => (
            <View key={stat.label} style={{ flex: 1, alignItems: "center" }}>
              {i > 0 && (
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 4,
                    bottom: 4,
                    width: 1,
                    backgroundColor: DARK_LINE,
                  }}
                />
              )}
              <Text style={{ color: PEARL_TEXT, fontSize: 16, fontWeight: "700" }}>
                {stat.value}
              </Text>
              <Text style={{ color: MUTED_TEXT, fontSize: 11, marginTop: 2 }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Browse by region */}
      <View style={{ marginTop: 28 }}>
        <Text
          style={{
            color: MUTED_TEXT,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            paddingHorizontal: 20,
            marginBottom: 12,
          }}
        >
          Browse by Region
        </Text>
        <FlatList
          data={REGIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openAiralo(item.url)}
              style={{
                backgroundColor: DARK_CARD,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: DARK_LINE,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                gap: 6,
                minWidth: 90,
              }}
            >
              <Ionicons name={item.icon} size={22} color={PEARL_TEXT} />
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: "500" }}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* How it works */}
      <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
        <Text
          style={{
            color: MUTED_TEXT,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          How It Works
        </Text>
        <View
          style={{
            backgroundColor: DARK_CARD,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: DARK_LINE,
            overflow: "hidden",
          }}
        >
          {STEPS.map((item, index) => (
            <View
              key={item.step}
              style={{
                flexDirection: "row",
                padding: 16,
                gap: 14,
                borderBottomWidth: index < STEPS.length - 1 ? 1 : 0,
                borderBottomColor: DARK_LINE,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.07)",
                  borderWidth: 1,
                  borderColor: DARK_LINE,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: PEARL_TEXT, fontSize: 13, fontWeight: "700" }}>
                  {item.step}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.white, fontSize: 14, fontWeight: "600", marginBottom: 3 }}>
                  {item.title}
                </Text>
                <Text style={{ color: MUTED_TEXT, fontSize: 13, lineHeight: 19 }}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Main CTA */}
      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <Pressable
          onPress={() => openAiralo(AIRALO_BASE_URL)}
          style={{
            backgroundColor: colors.white,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name="globe-outline" size={18} color={DARK_BG} />
          <Text style={{ color: DARK_BG, fontSize: 16, fontWeight: "700" }}>
            Browse eSIM Plans
          </Text>
        </Pressable>

        <Text
          style={{
            color: DARK_LINE,
            fontSize: 11,
            textAlign: "center",
            marginTop: 12,
            lineHeight: 16,
          }}
        >
          You'll be taken to Airalo to complete your purchase.{"\n"}
          Powered by Airalo · 4.7★ App Store · 200+ destinations
        </Text>
      </View>
    </ScrollView>
  );
}
