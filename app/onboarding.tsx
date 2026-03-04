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
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const { width: W, height: H } = Dimensions.get("window");

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
      router.replace("/apply");
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      flatRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const handleSignIn = () => {
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

            {/* HQ wordmark — top left */}
            <View style={styles.logoWrap}>
              <Text style={styles.logoText}>HQ</Text>
            </View>

            {/* Slide text — bottom area */}
            <View style={styles.textBlock}>
              <Text style={styles.eyebrow}>{item.eyebrow}</Text>
              <Text style={styles.title}>{item.title}</Text>
            </View>
          </View>
        )}
      />

      {/* Back button — only show when not on first slide */}
      {currentIndex > 0 && (
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </Pressable>
      )}

      {/* Fixed bottom controls */}
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

        {/* Primary pill */}
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

        {/* Secondary pill */}
        <Pressable
          onPress={handleSignIn}
          style={({ pressed }) => [
            styles.btnOutline,
            { opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={styles.btnOutlineText}>Sign In</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1E",
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
  logoWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 62 : 46,
    left: 26,
  },
  logoText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 6,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 62 : 46,
    right: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  textBlock: {
    position: "absolute",
    bottom: 200,
    left: 28,
    right: 28,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3.5,
    marginBottom: 14,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  title: {
    color: colors.white,
    fontSize: 46,
    fontWeight: "800",
    lineHeight: 52,
    letterSpacing: -0.5,
    marginBottom: 18,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 52 : 36,
    paddingTop: 12,
    alignItems: "center",
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
    backgroundColor: colors.white,
  },
  dotInactive: {
    width: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  btn: {
    backgroundColor: colors.white,
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 12,
  },
  btnText: {
    color: "#1C1C1E",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  btnOutline: {
    borderRadius: 100,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: "center",
    alignSelf: "stretch",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  btnOutlineText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
