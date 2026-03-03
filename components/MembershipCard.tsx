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

// Warm platinum palette
const PT = {
  specular: "#f0ece4",
  bright:   "#d4d0c8",
  mid:      "#a8a4a0",
  dim:      "#6c6864",
  deep:     "#242220",
  glow:     "#dcd8d0",
};

const CARD_ASPECT_RATIO = 1.586;
const SCREEN_WIDTH      = Dimensions.get("window").width;
const CARD_WIDTH        = SCREEN_WIDTH - 40;
const CARD_HEIGHT       = Math.round(CARD_WIDTH / CARD_ASPECT_RATIO);
const REFL_HEIGHT       = Math.round(CARD_HEIGHT * 0.42); // visible reflection strip

export function MembershipCard({
  firstName,
  lastName,
  memberCode,
  status,
}: MembershipCardProps) {
  const router    = useRouter();
  const glareAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(glareAnim, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glareAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const glare1X = glareAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-CARD_WIDTH * 0.5, CARD_WIDTH * 1.45],
  });
  const glare2X = glareAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-CARD_WIDTH * 0.7, CARD_WIDTH * 1.25],
  });

  const isActive = status === "active";

  // ─────────────────────────────────────────────────────────────
  // Render the card face (background + glare + content).
  // `p` is an SVG gradient-ID prefix so the card and its
  // reflection don't share the same <defs> ids.
  // ─────────────────────────────────────────────────────────────
  const renderFace = (p: string) => (
    <>
      {/* ── SVG metallic background ── */}
      <Svg
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <SvgGradient id={`${p}metal`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor="#070706" stopOpacity="1" />
            <Stop offset="14%"  stopColor="#0e0d0c" stopOpacity="1" />
            <Stop offset="26%"  stopColor="#181614" stopOpacity="1" />
            <Stop offset="38%"  stopColor="#282420" stopOpacity="1" />
            <Stop offset="46%"  stopColor="#706c68" stopOpacity="1" />
            <Stop offset="51%"  stopColor="#c8c4be" stopOpacity="1" />
            <Stop offset="54%"  stopColor="#dcd8d0" stopOpacity="1" />
            <Stop offset="58%"  stopColor="#908c88" stopOpacity="1" />
            <Stop offset="66%"  stopColor="#201e1c" stopOpacity="1" />
            <Stop offset="80%"  stopColor="#0e0d0b" stopOpacity="1" />
            <Stop offset="100%" stopColor="#070706" stopOpacity="1" />
          </SvgGradient>
          <SvgGradient id={`${p}sheen`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={PT.specular} stopOpacity="0.000" />
            <Stop offset="30%"  stopColor={PT.specular} stopOpacity="0.030" />
            <Stop offset="50%"  stopColor={PT.specular} stopOpacity="0.055" />
            <Stop offset="70%"  stopColor={PT.specular} stopOpacity="0.025" />
            <Stop offset="100%" stopColor={PT.specular} stopOpacity="0.000" />
          </SvgGradient>
          <SvgGradient id={`${p}top`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"  stopColor={PT.specular} stopOpacity="0.22" />
            <Stop offset="7%"  stopColor={PT.specular} stopOpacity="0.00" />
          </SvgGradient>
          <SvgGradient id={`${p}bot`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="86%"  stopColor={PT.bright} stopOpacity="0.00" />
            <Stop offset="100%" stopColor={PT.bright} stopOpacity="0.14" />
          </SvgGradient>
        </Defs>

        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${p}metal)`} />
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${p}sheen)`} />
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${p}top)`}   />
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${p}bot)`}   />

        {[0.62, 0.50, 0.38, 0.27, 0.16].map((r, i) => (
          <Circle
            key={i}
            cx={CARD_WIDTH * 0.84} cy={CARD_HEIGHT * 0.26} r={CARD_HEIGHT * r}
            fill="none" stroke={PT.bright}
            strokeOpacity={0.04 - i * 0.004} strokeWidth={0.7}
          />
        ))}

        {Array.from({ length: 18 }).map((_, i) => (
          <Line
            key={i}
            x1={0} y1={(CARD_HEIGHT / 19) * (i + 1)}
            x2={CARD_WIDTH} y2={(CARD_HEIGHT / 19) * (i + 1)}
            stroke="#ffffff" strokeOpacity={0.013} strokeWidth={0.5}
          />
        ))}

        <Rect
          x={0.5} y={0.5} width={CARD_WIDTH - 1} height={CARD_HEIGHT - 1} rx={15.5}
          fill="none" stroke={PT.bright} strokeOpacity={0.55} strokeWidth={1}
        />
        <Rect
          x={3} y={3} width={CARD_WIDTH - 6} height={CARD_HEIGHT - 6} rx={13}
          fill="none" stroke={PT.specular} strokeOpacity={0.14} strokeWidth={0.5}
        />
      </Svg>

      {/* ── Primary glare ── */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -CARD_HEIGHT * 0.3,
          width: CARD_WIDTH * 0.24,
          height: CARD_HEIGHT * 1.6,
          transform: [{ translateX: glare1X }, { rotate: "22deg" }],
        }}
      >
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.00)" }} />
          <View style={{ flex: 2, backgroundColor: "rgba(248,246,242,0.06)" }} />
          <View style={{ flex: 4, backgroundColor: "rgba(252,250,246,0.18)" }} />
          <View style={{ flex: 2, backgroundColor: "rgba(248,246,242,0.06)" }} />
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.00)" }} />
        </View>
      </Animated.View>

      {/* ── Secondary trailing glare ── */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -CARD_HEIGHT * 0.3,
          width: CARD_WIDTH * 0.12,
          height: CARD_HEIGHT * 1.6,
          transform: [{ translateX: glare2X }, { rotate: "22deg" }],
        }}
      >
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.00)" }} />
          <View style={{ flex: 3, backgroundColor: "rgba(252,250,246,0.07)" }} />
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.00)" }} />
        </View>
      </Animated.View>

      {/* ── Card content ── */}
      <View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          padding: 22,
          justifyContent: "space-between",
        }}
      >
        {/* Top: HQ + NFC */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{
              color: PT.specular, fontSize: 28, fontWeight: "800", letterSpacing: 5,
              textShadowColor: "rgba(240,236,228,0.45)",
              textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
            }}>HQ</Text>
            <Text style={{
              color: `${PT.mid}99`, fontSize: 7, fontWeight: "600",
              letterSpacing: 2.5, textTransform: "uppercase", marginTop: -1,
            }}>HomeQuarters</Text>
          </View>
          <View style={{ transform: [{ rotate: "90deg" }], opacity: 0.5 }}>
            <Ionicons name="wifi" size={26} color={PT.bright} />
          </View>
        </View>

        {/* EMV chip */}
        <View style={{
          width: 44, height: 34, borderRadius: 5,
          backgroundColor: `${PT.dim}30`,
          borderWidth: 1, borderColor: `${PT.bright}66`,
          overflow: "hidden", justifyContent: "center", alignItems: "center",
        }}>
          <View style={{ gap: 4 }}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={{ flexDirection: "row", gap: 5 }}>
                {[0, 1].map((col) => (
                  <View key={col} style={{
                    width: 12, height: 7, borderRadius: 1,
                    backgroundColor: `${PT.mid}4d`,
                    borderWidth: 0.5, borderColor: `${PT.bright}80`,
                  }} />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom: name + code + status */}
        <View>
          <Text style={{
            color: "#ffffff", fontSize: 15, fontWeight: "700",
            letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8,
            textShadowColor: "rgba(255,255,255,0.2)",
            textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
          }} numberOfLines={1}>
            {firstName} {lastName}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: `${PT.bright}bb`, fontSize: 11, letterSpacing: 3.5, fontWeight: "400" }}>
              {memberCode}
            </Text>
            <View style={{
              backgroundColor: isActive ? "rgba(76,175,80,0.18)" : "rgba(212,208,200,0.14)",
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
              borderWidth: 0.5,
              borderColor: isActive ? "rgba(76,175,80,0.45)" : `${PT.bright}66`,
            }}>
              <Text style={{
                color: isActive ? colors.green : PT.bright,
                fontSize: 8, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase",
              }}>{status}</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );

  // ─────────────────────────────────────────────────────────────

  return (
    <View>
      {/* ── The card itself ── */}
      <Pressable
        onPress={() => router.push("/qr")}
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 16,
          overflow: "hidden",
          shadowColor: PT.glow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        {renderFace("c")}
      </Pressable>

      {/* ── Reflection ── */}
      {/*
        Render the card face again, flipped vertically (scaleY: -1),
        then clip to REFL_HEIGHT so only the bottom-of-card portion
        (= the part nearest the "table surface") is visible.
        An SVG gradient mask fades it from visible at top → invisible
        at bottom, matching the direction the reflection fades away.
      */}
      <View
        pointerEvents="none"
        style={{
          width: CARD_WIDTH,
          height: REFL_HEIGHT,
          overflow: "hidden",
          marginTop: 3,
          opacity: 0.32,
        }}
      >
        {/* Flip the face — scaleY: -1 makes the card's bottom appear at the top */}
        <View style={{ transform: [{ scaleY: -1 }], width: CARD_WIDTH, height: CARD_HEIGHT }}>
          {renderFace("r")}
        </View>
      </View>

      {/* Gradient fade over the reflection — transparent at top, opaque black at bottom */}
      <Svg
        width={CARD_WIDTH}
        height={REFL_HEIGHT}
        pointerEvents="none"
        style={{ position: "absolute", top: CARD_HEIGHT + 3, left: 0 }}
      >
        <Defs>
          <SvgGradient id="reflFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={colors.black} stopOpacity="0.0" />
            <Stop offset="45%"  stopColor={colors.black} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={colors.black} stopOpacity="1.0" />
          </SvgGradient>
        </Defs>
        <Rect width={CARD_WIDTH} height={REFL_HEIGHT} fill="url(#reflFade)" />
      </Svg>
    </View>
  );
}
