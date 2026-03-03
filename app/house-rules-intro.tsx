import React, { useRef, useState } from "react";
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
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const { width: W } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "shield-checkmark" as const,
    iconColor: colors.gold,
    eyebrow: "BEFORE YOU ENTER",
    title: "The House\nRules",
    body: "HomeQuarters is a private members' community built on trust, respect, and shared values. These rules protect the culture we're building together.",
    isWarning: false,
  },
  {
    id: "2",
    icon: "heart" as const,
    iconColor: colors.gold,
    eyebrow: "RULE 1 & 2",
    title: "Respect &\nHonour",
    body: "Treat every member, guest, and venue staff with dignity. Discrimination or harassment of any kind will not be tolerated.\n\nHonour our partner venues as you would your own home. Leave spaces as you found them, respect venue rules, and tip generously.",
    isWarning: false,
  },
  {
    id: "3",
    icon: "lock-closed" as const,
    iconColor: colors.gold,
    eyebrow: "RULE 3 & 4",
    title: "Confidence &\nAuthenticity",
    body: "What happens at HQ stays at HQ. Never share another member's personal information, conversations, or photos without their consent.\n\nShow up authentically. We are here for genuine connection — no spam, no hustling, no unsolicited pitches.",
    isWarning: false,
  },
  {
    id: "4",
    icon: "qr-code" as const,
    iconColor: colors.gold,
    eyebrow: "RULE 5, 6 & 7",
    title: "Redeem, Represent\n& Report",
    body: "Benefits are for personal use only — do not share or resell your QR codes. One redemption per benefit per visit.\n\nAs a member you represent our community. Carry yourself with pride everywhere you go. Report violations to the HQ team — never retaliate.",
    isWarning: false,
  },
  {
    id: "5",
    icon: "card" as const,
    iconColor: "#E53935",
    eyebrow: "YOUR MEMBERSHIP",
    title: "Protect Your\nAccess",
    body: "Violation of the House Rules may result in the immediate suspension or permanent revocation of your HomeQuarters membership.\n\nYour membership is a privilege. By continuing, you agree to uphold these standards at all times.",
    isWarning: true,
  },
];

export default function HouseRulesIntroScreen() {
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace("/apply");
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const slide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEnabled={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Background accent blob */}
            <View
              style={[
                styles.blob,
                {
                  backgroundColor: item.isWarning
                    ? "rgba(229, 57, 53, 0.07)"
                    : "rgba(201, 168, 76, 0.07)",
                },
              ]}
            />

            {/* HQ logo */}
            <View style={styles.logoWrap}>
              <Text style={styles.logoText}>HQ</Text>
            </View>

            {/* Slide content */}
            <View style={styles.content}>
              {/* Icon */}
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: item.isWarning
                      ? "rgba(229, 57, 53, 0.12)"
                      : "rgba(201, 168, 76, 0.12)",
                    borderColor: item.isWarning
                      ? "rgba(229, 57, 53, 0.25)"
                      : "rgba(201, 168, 76, 0.25)",
                  },
                ]}
              >
                <Ionicons name={item.icon} size={34} color={item.iconColor} />
              </View>

              <Text
                style={[
                  styles.eyebrow,
                  { color: item.isWarning ? "#E53935" : colors.gold },
                ]}
              >
                {item.eyebrow}
              </Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      {/* Fixed bottom controls */}
      <View style={styles.controls}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex
                  ? [
                      styles.dotActive,
                      slide.isWarning && { backgroundColor: "#E53935" },
                    ]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.btn,
            slide.isWarning && styles.btnWarning,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.btnText}>
            {isLast ? "I Agree — Enter HomeQuarters" : "Continue"}
          </Text>
        </Pressable>

        {/* Slide counter */}
        <Text style={styles.counter}>
          {currentIndex + 1} of {SLIDES.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  slide: {
    width: W,
    flex: 1,
    position: "relative",
  },
  blob: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  logoWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 62 : 46,
    left: 28,
  },
  logoText: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    paddingBottom: 180,
    paddingTop: 80,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3.5,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  title: {
    color: colors.white,
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: 22,
  },
  body: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    lineHeight: 24,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 52 : 36,
    paddingTop: 12,
    backgroundColor: colors.black,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.gold,
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  btnWarning: {
    backgroundColor: "#E53935",
  },
  btnText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  counter: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    textAlign: "center",
  },
});
