import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Animated,
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
  },
  {
    id: "2",
    image: {
      uri: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=90",
    },
  },
  {
    id: "3",
    image: {
      uri: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=90",
    },
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);

  // Fade-in overlay animations — staggered cinematic reveal
  const darkTint = useRef(new Animated.Value(0)).current;
  const bottomScrim = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(darkTint, {
        toValue: 1,
        duration: 700,
        delay: 0,
        useNativeDriver: true,
      }),
      Animated.timing(bottomScrim, {
        toValue: 1,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 800,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "onboarding_slides"), orderBy("order", "asc"))
        ).catch(() => null);
        if (!snap || snap.empty) return;
        const remote = snap.docs
          .filter((d) => d.data().is_active === true)
          .map((d) => ({
            id: d.id,
            image: { uri: d.data().image_url as string },
          }));
        if (remote.length > 0) setSlides(remote);
      } catch {
        // Keep default slides on network error
      }
    })();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-bleed image carousel — swipe to advance */}
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
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="cover"
          />
        )}
      />

      {/* Overlay 1 — global dark tint, fades in first */}
      <Animated.View
        style={[styles.darkTint, { opacity: darkTint }]}
        pointerEvents="none"
      />

      {/* Overlay 2 — bottom scrim for legibility, fades in second */}
      <Animated.View
        style={[styles.bottomScrim, { opacity: bottomScrim }]}
        pointerEvents="none"
      />

      {/* Overlay 3 — dots + CTAs + subtle branding, fades in last */}
      <Animated.View style={[styles.bottomControls, { opacity: ctaOpacity }]}>
        {/* Subtle branding above dots */}
        <Animated.View
          style={[styles.brandingBlock, { opacity: logoOpacity }]}
          pointerEvents="none"
        >
          <Text style={styles.logoText}>HQ</Text>
          <Text style={styles.logoSubtext}>HOMEQUARTERS</Text>
        </Animated.View>

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

        {/* Primary — cream pill */}
        <Pressable
          onPress={() => router.replace("/login")}
          style={({ pressed }) => [styles.signInBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.signInText}>Member Sign In</Text>
        </Pressable>

        {/* Secondary — ghost outline pill */}
        <Pressable
          onPress={() => router.replace("/apply")}
          style={({ pressed }) => [styles.applyBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.applyText}>Apply for Membership</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  image: {
    width: W,
    height: H,
  },

  // Overlay 1 — full-screen dark tint
  darkTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  // Overlay 2 — full-screen scrim
  bottomScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  // Subtle branding block above dots
  brandingBlock: {
    alignItems: "center",
    marginBottom: 14,
    gap: 4,
  },
  logoText: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 13,
    fontFamily: fonts.display,
    letterSpacing: 8,
  },
  logoSubtext: {
    color: "rgba(201,168,76,0.50)",
    fontSize: 7,
    fontFamily: fonts.semibold,
    letterSpacing: 5,
  },

  // Bottom controls
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 42,
    paddingTop: 12,
    alignItems: "center",
    gap: 10,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
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

  // Primary CTA — cream pill
  signInBtn: {
    backgroundColor: colors.bg,
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: "center",
    alignSelf: "stretch",
  },
  signInText: {
    color: colors.ink,
    fontSize: 12,
    fontFamily: fonts.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Secondary CTA — ghost outline pill
  applyBtn: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingVertical: 14,
    alignItems: "center",
    alignSelf: "stretch",
  },
  applyText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: fonts.body,
    letterSpacing: 0.5,
  },
});
