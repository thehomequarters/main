import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/constants/theme";
import { StatusBar } from "expo-status-bar";

const { width: W, height: H } = Dimensions.get("window");

/**
 * ONBOARDING SLIDES
 * Replace each `uri` with your own high-res lifestyle photography.
 * Recommended dimensions: 1170 × 2532 px (iPhone 14 Pro native resolution)
 * or import local assets: image: require("@/assets/onboarding-1.jpg")
 */
const SLIDES = [
  {
    id: "1",
    image: {
      uri: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=90",
    },
    eyebrow: "WELCOME TO",
    title: "Home\nQuarters",
  },
  {
    id: "2",
    image: {
      uri: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=90",
    },
    eyebrow: "EXCLUSIVE ACCESS",
    title: "The Best of\nYour City",
  },
  {
    id: "3",
    image: {
      uri: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=90",
    },
    eyebrow: "YOUR PEOPLE",
    title: "Connect &\nBelong",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem("hq_onboarding_complete", "1");
    router.replace("/apply");
  };

  const handleSignIn = async () => {
    await AsyncStorage.setItem("hq_onboarding_complete", "1");
    router.replace("/login");
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const isLast = currentIndex === SLIDES.length - 1;

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
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Full-bleed lifestyle image */}
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="cover"
            />

            {/* Top vignette for logo */}
            <View style={styles.topOverlay} />

            {/* Bottom overlay for text */}
            <View style={styles.bottomOverlay} />

            {/* HQ wordmark — top left */}
            <View style={styles.logoWrap}>
              <Text style={styles.logoText}>HQ</Text>
            </View>

            {/* Slide text — sits in bottom overlay */}
            <View style={styles.textBlock}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
            </View>
          </View>
        )}
      />

      {/* Fixed bottom controls (progress + CTA) */}
      <View style={styles.controls}>
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

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.btn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.btnText}>
            {isLast ? "Apply for Membership" : "Continue"}
          </Text>
        </Pressable>

        <Pressable onPress={handleSignIn} style={styles.signinRow}>
          <Text style={styles.signinText}>
            Already a member?{" "}
            <Text style={styles.signinLink}>Sign in</Text>
          </Text>
        </Pressable>
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
    height: H,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: W,
    height: H,
  },
  // Soft vignette at top so the logo reads
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  // Thin fade at the very bottom for text legibility only
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.38,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  logoWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 62 : 46,
    left: 26,
  },
  logoText: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 6,
  },
  textBlock: {
    position: "absolute",
    bottom: 190,
    left: 28,
    right: 28,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3.5,
    marginBottom: 14,
  },
  title: {
    color: colors.white,
    fontSize: 46,
    fontWeight: "800",
    lineHeight: 52,
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 52 : 36,
    paddingTop: 12,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 22,
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
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  btnText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  signinRow: {
    alignItems: "center",
    paddingVertical: 6,
  },
  signinText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
  },
  signinLink: {
    color: colors.gold,
    fontWeight: "600",
  },
});
