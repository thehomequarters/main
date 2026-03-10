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
    eyebrow: "BY INVITATION ONLY",
    title: "Your Card.\nYour Table.",
  },
  {
    id: "2",
    image: {
      uri: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=90",
    },
    eyebrow: "EXCLUSIVE ACCESS",
    title: "The City's\nFinest Tables.",
  },
  {
    id: "3",
    image: {
      uri: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=90",
    },
    eyebrow: "YOUR COMMUNITY",
    title: "Find Your\nTribe",
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
        ).catch(() => null);
        if (!snap) return;
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
            {/* Very subtle full-screen tint */}
            <View style={styles.vignette} />
            {/* Dark scrim for bottom copy legibility */}
            <View style={styles.scrim} />

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
            {isLast ? "Join HomeQuarters" : "Next"}
          </Text>
        </Pressable>

        {/* Sign in — outlined pill */}
        <Pressable
          onPress={handleSignIn}
          style={({ pressed }) => [styles.signInBtn, { opacity: pressed ? 0.75 : 1 }]}
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
  // Very subtle global tint — image breathes freely
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  // Dark scrim only at bottom for text legibility
  scrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.26,
    backgroundColor: "rgba(0,0,0,0.58)",
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
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  // Text sits at the top edge of the bottom 20% zone
  textBlock: {
    position: "absolute",
    bottom: 116,
    left: 28,
    right: 28,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontFamily: fonts.semibold,
    letterSpacing: 3.5,
    marginBottom: 6,
  },
  title: {
    color: colors.white,
    fontSize: 28,
    fontFamily: fonts.display,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 36,
    paddingTop: 6,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  dot: {
    height: 1.5,
    borderRadius: 1,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.white,
  },
  dotInactive: {
    width: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  btn: {
    backgroundColor: colors.bg,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 40,
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 6,
    overflow: "hidden",
  },
  btnText: {
    color: colors.ink,
    fontSize: 12,
    fontFamily: fonts.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  signInBtn: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 40,
    alignItems: "center",
    alignSelf: "stretch",
  },
  signInText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: fonts.body,
    letterSpacing: 0.3,
  },
});
