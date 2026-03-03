import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/lib/auth";

const { width: W } = Dimensions.get("window");

// Dark theme constants
const BG      = "#1C1C1E";
const CARD    = "#252523";
const LINE    = "rgba(255,255,255,0.08)";
const PEARL   = "rgba(255,255,255,0.82)";
const MUTED   = "rgba(255,255,255,0.45)";
const WHITE   = "#FFFFFF";

const SLIDES = [
  {
    id: "1",
    icon: "airplane" as const,
    tag: "MEMBER PERK",
    title: "Going Back\nHome?",
    body: "Roaming charges are brutal. Hunting for a SIM at Robert Gabriel Mugabe International at midnight is worse. There's a better way.",
    accent: { icon: "alert-circle-outline" as const, label: "Average roaming bill: $80–$200 per trip" },
  },
  {
    id: "2",
    icon: "phone-portrait-outline" as const,
    tag: "HOW IT WORKS",
    title: "Install Before\nYou Fly",
    body: "Get a Telecel Zimbabwe eSIM through Airalo before you leave. It installs digitally on your phone — no physical SIM card needed — and activates automatically when you touch down in Zim.",
    accent: { icon: "checkmark-circle-outline" as const, label: "Telecel Zimbabwe · Only network with eSIM support" },
  },
  {
    id: "3",
    icon: "flash-outline" as const,
    tag: "LOCAL RATES",
    title: "Local Data.\nNo Drama.",
    body: "Browse affordable Telecel data plans at local rates — from as little as a few dollars. No contracts, no contracts, no SIM swap, no airport kiosk queue.",
    accent: { icon: "wifi-outline" as const, label: "4G LTE · Pay as you need · Cancel anytime" },
  },
  {
    id: "4",
    icon: "flag-outline" as const,
    tag: "READY?",
    title: "Your Zim SIM,\nSorted.",
    body: "Takes five minutes to set up. You'll be texting family from the tarmac before your bag hits the carousel.",
    accent: { icon: "shield-checkmark-outline" as const, label: "Powered by Airalo · 4.7★ · 20M+ travellers" },
  },
];

export default function ESIMIntroScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const flatRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (profile?.membership_status === "accepted") {
      router.replace("/activate");
    }
  }, [profile?.membership_status]);

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (!isLast) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.push("/esim" as any);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HQ wordmark */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoText}>HQ</Text>
      </View>

      {/* Skip */}
      <Pressable onPress={() => router.push("/esim" as any)} style={styles.skip}>
        <Text style={{ color: MUTED, fontSize: 13, fontWeight: "500" }}>Skip</Text>
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEnabled={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Subtle background blob */}
            <View style={styles.blob} />

            {/* Content */}
            <View style={styles.content}>
              {/* Icon badge */}
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={36} color={PEARL} />
              </View>

              <Text style={styles.tag}>{item.tag}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>

              {/* Accent pill */}
              <View style={styles.accentPill}>
                <Ionicons name={item.accent.icon} size={13} color={MUTED} />
                <Text style={styles.accentText}>{item.accent.label}</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View style={styles.controls}>
        <View style={styles.navRow}>
          {/* Back pill */}
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={16} color={WHITE} />
          </Pressable>

          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Continue pill */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.continueBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.continueBtnText}>
              {isLast ? "Get My eSIM" : "Next"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  logoWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 62 : 46,
    left: 28,
    zIndex: 10,
  },
  logoText: {
    color: PEARL,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 6,
  },
  skip: {
    position: "absolute",
    top: Platform.OS === "ios" ? 66 : 50,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  slide: {
    width: W,
    flex: 1,
    position: "relative",
  },
  blob: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    paddingBottom: 150,
    paddingTop: 100,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: LINE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  tag: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  title: {
    color: WHITE,
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  body: {
    color: MUTED,
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 24,
  },
  accentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  accentText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 52 : 36,
    paddingTop: 16,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: LINE,
    justifyContent: "center",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 22,
    backgroundColor: WHITE,
  },
  dotInactive: {
    width: 6,
    backgroundColor: LINE,
  },
  continueBtn: {
    backgroundColor: WHITE,
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  continueBtnText: {
    color: BG,
    fontSize: 14,
    fontWeight: "800",
  },
});
