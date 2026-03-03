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
    eyebrow: "BEFORE YOU ENTER",
    title: "The House\nRules",
    body: "HomeQuarters is a private members' community built on trust, respect, and shared values. These rules protect the culture we're building together.",
    isWarning: false,
  },
  {
    id: "2",
    icon: "heart" as const,
    eyebrow: "RULE 1 & 2",
    title: "Respect &\nHonour",
    body: "Treat every member, guest, and venue staff with dignity. Discrimination or harassment of any kind will not be tolerated.\n\nHonour our partner venues as you would your own home. Leave spaces as you found them, respect venue rules, and tip generously.",
    isWarning: false,
  },
  {
    id: "3",
    icon: "lock-closed" as const,
    eyebrow: "RULE 3 & 4",
    title: "Confidence &\nAuthenticity",
    body: "What happens at HQ stays at HQ. Never share another member's personal information, conversations, or photos without their consent.\n\nShow up authentically. We are here for genuine connection — no spam, no hustling, no unsolicited pitches.",
    isWarning: false,
  },
  {
    id: "4",
    icon: "qr-code" as const,
    eyebrow: "RULE 5, 6 & 7",
    title: "Redeem, Represent\n& Report",
    body: "Benefits are for personal use only — do not share or resell your QR codes. One redemption per benefit per visit.\n\nAs a member you represent our community. Carry yourself with pride everywhere you go. Report violations to the HQ team — never retaliate.",
    isWarning: false,
  },
  {
    id: "5",
    icon: "card" as const,
    eyebrow: "YOUR MEMBERSHIP",
    title: "Protect Your\nAccess",
    body: "Violation of the House Rules may result in the immediate suspension or permanent revocation of your HomeQuarters membership.\n\nYour membership is a privilege. Carry it with care.",
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
      router.back();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    } else {
      router.back();
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
      <StatusBar style="dark" />

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
            {/* Subtle accent blob */}
            <View
              style={[
                styles.blob,
                {
                  backgroundColor: item.isWarning
                    ? "rgba(229, 57, 53, 0.05)"
                    : "rgba(28, 28, 30, 0.04)",
                },
              ]}
            />

            {/* HQ wordmark */}
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
                      ? "rgba(229, 57, 53, 0.08)"
                      : colors.sand,
                    borderColor: item.isWarning
                      ? "rgba(229, 57, 53, 0.2)"
                      : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={34}
                  color={item.isWarning ? colors.red : colors.dark}
                />
              </View>

              <Text
                style={[
                  styles.eyebrow,
                  { color: item.isWarning ? colors.red : colors.stone },
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
        <View style={styles.navRow}>
          {/* Back pill */}
          <Pressable
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={16} color={colors.dark} />
          </Pressable>

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
                        slide.isWarning && { backgroundColor: colors.red },
                      ]
                    : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Continue pill */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.continueBtn,
              slide.isWarning && styles.continueBtnWarning,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.continueBtnText}>
              {isLast ? "Got it" : "Next"}
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
    backgroundColor: colors.bg,
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
    color: colors.dark,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    paddingBottom: 160,
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
    color: colors.dark,
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: 22,
  },
  body: {
    color: colors.stone,
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
    paddingTop: 16,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.dark,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.border,
  },
  continueBtn: {
    backgroundColor: colors.dark,
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  continueBtnWarning: {
    backgroundColor: colors.red,
  },
  continueBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
