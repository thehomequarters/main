import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts } from "@/constants/theme";
import { StatusBar } from "expo-status-bar";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const { width: W, height: H } = Dimensions.get("window");

const DEFAULT_SLIDES = [
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
  const [slides, setSlides] = useState(DEFAULT_SLIDES);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "onboarding_slides"), orderBy("order", "asc"))
        );
        if (!snap.empty) {
          const remote = snap.docs
            .filter((d) => d.data().is_active === true)
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                image: { uri: data.image_url as string },
                eyebrow: (data.eyebrow as string) ?? "",
                title: ((data.title as string) ?? "").replace(/\\n/g, "\n"),
              };
            });
          if (remote.length > 0) setSlides(remote);
        }
      } catch {
        // Network error — keep default slides
      }
    })();
  }, []);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
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

  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <FlatList
        ref={flatRef}
        data={slides}
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
            {/* Deep gradient vignette at bottom */}
            <View style={styles.vignette} />

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

      {/* Fixed bottom controls */}
      <View style={styles.controls}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Primary CTA */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.btn,
            { opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={styles.btnText}>
            {isLast ? "Apply for Membership" : "Continue"}
          </Text>
        </Pressable>

        {/* Sign in — text link, no border */}
        <Pressable
          onPress={handleSignIn}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }, styles.signInWrap]}
        >
          <Text style={styles.signInText}>Already a member? Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
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
  // Deep gradient vignette so text always reads against any image
  vignette: {
    ...StyleSheet.absoluteFillObject,
    // Simulate a gradient: fully transparent at top, very dark at bottom
    backgroundColor: "transparent",
    // We use a bottom-heavy overlay
    top: "35%",
    background: undefined,
  },
  logoWrap: {
    position: "absolute",
    top: 48,
    left: 28,
  },
  logoText: {
    color: colors.white,
    fontSize: 22,
    fontFamily: fonts.semibold,
    letterSpacing: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  textBlock: {
    position: "absolute",
    bottom: 210,
    left: 28,
    right: 60,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.semibold,
    letterSpacing: 4,
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  title: {
    color: colors.white,
    fontSize: 52,
    fontFamily: fonts.display,
    lineHeight: 58,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 38,
    paddingTop: 12,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginBottom: 24,
  },
  dot: {
    height: 1.5,
    borderRadius: 1,
  },
  dotActive: {
    width: 32,
    backgroundColor: colors.white,
  },
  dotInactive: {
    width: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  btn: {
    backgroundColor: colors.white,
    borderRadius: 4,
    paddingVertical: 17,
    paddingHorizontal: 40,
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 18,
    overflow: "hidden",
  },
  btnText: {
    color: colors.ink,
    fontSize: 14,
    fontFamily: fonts.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  signInWrap: {
    paddingVertical: 6,
  },
  signInText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontFamily: fonts.body,
    letterSpacing: 0.3,
  },
});
