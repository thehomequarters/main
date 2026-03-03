import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "wifi" as const,
    tag: "Zimbabwe Coverage",
    title: "Never Lose Signal\nBack Home",
    body: "Whether you're diaspora returning home or visiting Zimbabwe for the first time, get instant local connectivity on Telecel's eSIM network — no roaming charges, no physical SIM swap.",
    accent: "Telecel Zimbabwe · eSIM supported",
  },
  {
    icon: "phone-portrait-outline" as const,
    tag: "Before You Land",
    title: "Set Up Before\nYou Touch Down",
    body: "Install your Zimbabwe eSIM from your phone before you fly. It activates automatically when you land at Robert Gabriel Mugabe International Airport — no airport kiosk, no queuing.",
    accent: "RGM International · Instant activation",
  },
  {
    icon: "globe-outline" as const,
    tag: "HQ Member Perk",
    title: "Local Rates.\nGlobal Reach.",
    body: "Browse affordable Zimbabwe data plans from as little as $2/day. HQ members also unlock eSIMs for 200+ countries — one app for every trip beyond the border.",
    accent: "Powered by Airalo",
  },
];

export default function ESIMIntroScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace("/esim");
    }
  };

  const skip = () => router.replace("/esim");

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      {/* Skip button */}
      <Pressable
        onPress={skip}
        style={{
          position: "absolute",
          top: 58,
          right: 20,
          zIndex: 10,
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: colors.grey, fontSize: 14, fontWeight: "500" }}>Skip</Text>
      </Pressable>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View
            style={{
              width: SCREEN_WIDTH,
              flex: 1,
              paddingHorizontal: 28,
              justifyContent: "center",
              paddingBottom: 140,
            }}
          >
            {/* Icon badge */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: "rgba(201, 168, 76, 0.1)",
                borderWidth: 1.5,
                borderColor: "rgba(201, 168, 76, 0.3)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              <Ionicons name={item.icon} size={36} color={colors.stone} />
            </View>

            {/* Tag */}
            <Text
              style={{
                color: colors.stone,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              {item.tag}
            </Text>

            {/* Heading */}
            <Text
              style={{
                color: colors.white,
                fontSize: 34,
                fontWeight: "800",
                lineHeight: 42,
                marginBottom: 20,
                letterSpacing: -0.5,
              }}
            >
              {item.title}
            </Text>

            {/* Body */}
            <Text
              style={{
                color: colors.grey,
                fontSize: 16,
                lineHeight: 26,
                marginBottom: 24,
              }}
            >
              {item.body}
            </Text>

            {/* Network/accent pill */}
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: "rgba(201, 168, 76, 0.08)",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(201, 168, 76, 0.2)",
                paddingHorizontal: 14,
                paddingVertical: 7,
              }}
            >
              <Text
                style={{
                  color: "rgba(201, 168, 76, 0.8)",
                  fontSize: 12,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
              >
                {item.accent}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 28,
          paddingBottom: 48,
          paddingTop: 16,
          backgroundColor: colors.black,
          borderTopWidth: 1,
          borderTopColor: colors.darkBorder,
        }}
      >
        {/* Dot indicators */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            marginBottom: 24,
          }}
        >
          {SLIDES.map((_, i) => {
            const width = scrollX.interpolate({
              inputRange: [
                (i - 1) * SCREEN_WIDTH,
                i * SCREEN_WIDTH,
                (i + 1) * SCREEN_WIDTH,
              ],
              outputRange: [6, 20, 6],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange: [
                (i - 1) * SCREEN_WIDTH,
                i * SCREEN_WIDTH,
                (i + 1) * SCREEN_WIDTH,
              ],
              outputRange: [0.35, 1, 0.35],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={{
                  width,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.stone,
                  opacity,
                }}
              />
            );
          })}
        </View>

        {/* Next / Get Started button */}
        <Pressable
          onPress={next}
          style={{
            backgroundColor: colors.stone,
            borderRadius: 14,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: colors.black, fontSize: 16, fontWeight: "700" }}>
            {currentIndex === SLIDES.length - 1 ? "Get My Zimbabwe eSIM" : "Next"}
          </Text>
          {currentIndex < SLIDES.length - 1 && (
            <Ionicons name="arrow-forward" size={18} color={colors.black} />
          )}
        </Pressable>
      </View>
    </View>
  );
}
