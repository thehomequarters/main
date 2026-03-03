import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle,
  Line,
} from "react-native-svg";

interface MembershipCardProps {
  firstName: string;
  lastName: string;
  memberCode: string;
  status: string;
}

const CARD_ASPECT_RATIO = 1.586;
const SCREEN_WIDTH = Dimensions.get("window").width;
// Account tab has 20px horizontal padding, card has additional 20px padding = 40px total
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = Math.round(CARD_WIDTH / CARD_ASPECT_RATIO);

export function MembershipCard({
  firstName,
  lastName,
  memberCode,
  status,
}: MembershipCardProps) {
  const router = useRouter();
  const glareAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        // Pause before sweep
        Animated.delay(3200),
        // Sweep across
        Animated.timing(glareAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        // Instant reset
        Animated.timing(glareAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Glare translates from off-left to off-right
  const glareTranslateX = glareAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH * 0.45, CARD_WIDTH * 1.4],
  });

  const isActive = status === "active";

  return (
    <Pressable
      onPress={() => router.push("/qr")}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 16,
        overflow: "hidden",
        // Outer glow
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      {/* ── Layer 1: Metallic gradient background (SVG) ── */}
      <Svg
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          {/* Main diagonal metallic gradient */}
          <SvgGradient id="metal" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor="#0c0c0c" stopOpacity="1" />
            <Stop offset="18%"  stopColor="#161410" stopOpacity="1" />
            <Stop offset="36%"  stopColor="#2a2318" stopOpacity="1" />
            <Stop offset="48%"  stopColor="#332b1a" stopOpacity="1" />
            <Stop offset="56%"  stopColor="#2a2318" stopOpacity="1" />
            <Stop offset="72%"  stopColor="#161410" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
          </SvgGradient>

          {/* Secondary horizontal sheen (brushed metal bands) */}
          <SvgGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#ffffff" stopOpacity="0.000" />
            <Stop offset="28%"  stopColor="#ffffff" stopOpacity="0.028" />
            <Stop offset="50%"  stopColor="#c9a84c" stopOpacity="0.040" />
            <Stop offset="72%"  stopColor="#ffffff" stopOpacity="0.018" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.000" />
          </SvgGradient>

          {/* Subtle top-edge highlight (like a physical card catching light) */}
          <SvgGradient id="topEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"  stopColor="#c9a84c" stopOpacity="0.18" />
            <Stop offset="8%"  stopColor="#c9a84c" stopOpacity="0.00" />
          </SvgGradient>

          {/* Bottom reflection band */}
          <SvgGradient id="bottomEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="88%" stopColor="#c9a84c" stopOpacity="0.00" />
            <Stop offset="100%" stopColor="#c9a84c" stopOpacity="0.10" />
          </SvgGradient>
        </Defs>

        {/* Base metallic fill */}
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#metal)" />
        {/* Horizontal brushed sheen */}
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#sheen)" />
        {/* Top edge highlight */}
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#topEdge)" />
        {/* Bottom mirror reflection */}
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#bottomEdge)" />

        {/* Decorative concentric rings (hologram-style security feature) */}
        {[0.62, 0.50, 0.38, 0.26].map((r, i) => (
          <Circle
            key={i}
            cx={CARD_WIDTH * 0.82}
            cy={CARD_HEIGHT * 0.28}
            r={CARD_HEIGHT * r}
            fill="none"
            stroke="#c9a84c"
            strokeOpacity={0.045 - i * 0.005}
            strokeWidth={0.8}
          />
        ))}

        {/* Subtle horizontal scan lines (brushed metal texture) */}
        {Array.from({ length: 14 }).map((_, i) => {
          const y = (CARD_HEIGHT / 15) * (i + 1);
          return (
            <Line
              key={i}
              x1={0}
              y1={y}
              x2={CARD_WIDTH}
              y2={y}
              stroke="#ffffff"
              strokeOpacity={0.012}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Gold border (drawn inside SVG for precise radius handling) */}
        <Rect
          x={0.5}
          y={0.5}
          width={CARD_WIDTH - 1}
          height={CARD_HEIGHT - 1}
          rx={15.5}
          fill="none"
          stroke="#c9a84c"
          strokeOpacity={0.45}
          strokeWidth={1}
        />
        {/* Inner border (double border effect) */}
        <Rect
          x={3}
          y={3}
          width={CARD_WIDTH - 6}
          height={CARD_HEIGHT - 6}
          rx={13}
          fill="none"
          stroke="#c9a84c"
          strokeOpacity={0.12}
          strokeWidth={0.5}
        />
      </Svg>

      {/* ── Layer 2: Animated glare strip ── */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -CARD_HEIGHT * 0.3,
          width: CARD_WIDTH * 0.22,
          height: CARD_HEIGHT * 1.6,
          transform: [
            { translateX: glareTranslateX },
            { rotate: "22deg" },
          ],
        }}
      >
        {/* Three-part glare: fade → bright → fade */}
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.00)",
            }}
          />
          <View
            style={{
              flex: 2,
              backgroundColor: "rgba(255,248,220,0.07)",
            }}
          />
          <View
            style={{
              flex: 3,
              backgroundColor: "rgba(255,248,220,0.13)",
            }}
          />
          <View
            style={{
              flex: 2,
              backgroundColor: "rgba(255,248,220,0.07)",
            }}
          />
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.00)",
            }}
          />
        </View>
      </Animated.View>

      {/* ── Layer 3: Card content ── */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: 22,
          justifyContent: "space-between",
        }}
      >
        {/* Top row: HQ wordmark + NFC */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View>
            <Text
              style={{
                color: colors.gold,
                fontSize: 28,
                fontWeight: "800",
                letterSpacing: 5,
                textShadowColor: "rgba(201,168,76,0.5)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              }}
            >
              HQ
            </Text>
            <Text
              style={{
                color: "rgba(201,168,76,0.5)",
                fontSize: 7,
                fontWeight: "600",
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginTop: -1,
              }}
            >
              HomeQuarters
            </Text>
          </View>

          {/* NFC contactless */}
          <View style={{ transform: [{ rotate: "90deg" }], opacity: 0.55 }}>
            <Ionicons name="wifi" size={26} color={colors.gold} />
          </View>
        </View>

        {/* Chip — gold EMV style */}
        <View
          style={{
            width: 44,
            height: 34,
            borderRadius: 5,
            backgroundColor: "rgba(201,168,76,0.18)",
            borderWidth: 1,
            borderColor: "rgba(201,168,76,0.5)",
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Contact pad grid */}
          <View style={{ gap: 4 }}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={{ flexDirection: "row", gap: 5 }}>
                {[0, 1].map((col) => (
                  <View
                    key={col}
                    style={{
                      width: 12,
                      height: 7,
                      borderRadius: 1,
                      backgroundColor: "rgba(201,168,76,0.3)",
                      borderWidth: 0.5,
                      borderColor: "rgba(201,168,76,0.5)",
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom: name + code + status */}
        <View>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 15,
              fontWeight: "700",
              letterSpacing: 2.5,
              textTransform: "uppercase",
              marginBottom: 8,
              textShadowColor: "rgba(255,255,255,0.15)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
            numberOfLines={1}
          >
            {firstName} {lastName}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "rgba(201,168,76,0.7)",
                fontSize: 11,
                letterSpacing: 3.5,
                fontWeight: "400",
              }}
            >
              {memberCode}
            </Text>

            <View
              style={{
                backgroundColor: isActive
                  ? "rgba(76,175,80,0.18)"
                  : "rgba(201,168,76,0.18)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 4,
                borderWidth: 0.5,
                borderColor: isActive
                  ? "rgba(76,175,80,0.4)"
                  : "rgba(201,168,76,0.4)",
              }}
            >
              <Text
                style={{
                  color: isActive ? colors.green : colors.gold,
                  fontSize: 8,
                  fontWeight: "700",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {status}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
