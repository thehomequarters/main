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
  showReflection?: boolean;
}

const CARD_ASPECT_RATIO = 1.586;
const SCREEN_WIDTH      = Dimensions.get("window").width;
const CARD_WIDTH        = SCREEN_WIDTH - 40;
const CARD_HEIGHT       = Math.round(CARD_WIDTH / CARD_ASPECT_RATIO);
const REFL_HEIGHT       = Math.round(CARD_HEIGHT * 0.42);
const CARD_RADIUS       = 16;

export function MembershipCard({
  firstName,
  lastName,
  memberCode,
  status,
  showReflection = true,
}: MembershipCardProps) {
  const router    = useRouter();
  const glareAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3200),
        Animated.timing(glareAnim, {
          toValue: 1,
          duration: 900,
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

  // Renders the full card face (SVG background + glare + content).
  // `p` = SVG gradient-ID prefix so card and reflection IDs don't collide.
  const renderFace = (p: string) => (
    <>
      {/* SVG metallic background */}
      <Svg
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <SvgGradient id={`${p}metal`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor="#0c0c0c" stopOpacity="1" />
            <Stop offset="18%"  stopColor="#161410" stopOpacity="1" />
            <Stop offset="36%"  stopColor="#2a2318" stopOpacity="1" />
            <Stop offset="48%"  stopColor="#332b1a" stopOpacity="1" />
            <Stop offset="56%"  stopColor="#2a2318" stopOpacity="1" />
            <Stop offset="72%"  stopColor="#161410" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
          </SvgGradient>
          <SvgGradient id={`${p}sheen`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#ffffff" stopOpacity="0.000" />
            <Stop offset="28%"  stopColor="#ffffff" stopOpacity="0.028" />
            <Stop offset="50%"  stopColor="#c9a84c" stopOpacity="0.040" />
            <Stop offset="72%"  stopColor="#ffffff" stopOpacity="0.018" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.000" />
          </SvgGradient>
          <SvgGradient id={`${p}top`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"  stopColor="#c9a84c" stopOpacity="0.18" />
            <Stop offset="8%"  stopColor="#c9a84c" stopOpacity="0.00" />
          </SvgGradient>
          <SvgGradient id={`${p}bot`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="88%"  stopColor="#c9a84c" stopOpacity="0.00" />
            <Stop offset="100%" stopColor="#c9a84c" stopOpacity="0.10" />
          </SvgGradient>
        </Defs>

        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${p}metal)`} />
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${p}sheen)`} />
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${p}top)`}   />
        <Rect width={CARD_WIDTH} height={CARD_HEIGHT} fill={`url(#${p}bot)`}   />

        {[0.62, 0.50, 0.38, 0.26].map((r, i) => (
          <Circle
            key={i}
            cx={CARD_WIDTH * 0.82} cy={CARD_HEIGHT * 0.28} r={CARD_HEIGHT * r}
            fill="none" stroke="#c9a84c"
            strokeOpacity={0.045 - i * 0.005} strokeWidth={0.8}
          />
        ))}

        {Array.from({ length: 14 }).map((_, i) => (
          <Line
            key={i}
            x1={0} y1={(CARD_HEIGHT / 15) * (i + 1)}
            x2={CARD_WIDTH} y2={(CARD_HEIGHT / 15) * (i + 1)}
            stroke="#ffffff" strokeOpacity={0.012} strokeWidth={0.5}
          />
        ))}

        <Rect
          x={0.5} y={0.5} width={CARD_WIDTH - 1} height={CARD_HEIGHT - 1} rx={15.5}
          fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth={1}
        />
        <Rect
          x={3} y={3} width={CARD_WIDTH - 6} height={CARD_HEIGHT - 6} rx={13}
          fill="none" stroke="rgba(201,168,76,0.14)" strokeWidth={0.5}
        />
      </Svg>

      {/* Primary glare */}
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
          <View style={{ flex: 2, backgroundColor: "rgba(255,248,220,0.07)" }} />
          <View style={{ flex: 4, backgroundColor: "rgba(255,248,220,0.13)" }} />
          <View style={{ flex: 2, backgroundColor: "rgba(255,248,220,0.07)" }} />
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.00)" }} />
        </View>
      </Animated.View>

      {/* Secondary trailing glare */}
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
          <View style={{ flex: 3, backgroundColor: "rgba(255,248,220,0.06)" }} />
          <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.00)" }} />
        </View>
      </Animated.View>

      {/* Card content */}
      <View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          padding: 22,
          justifyContent: "space-between",
        }}
      >
        {/* Top row: HQ wordmark + NFC icon */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{
              color: colors.gold, fontSize: 28, fontWeight: "800", letterSpacing: 5,
              textShadowColor: "rgba(201,168,76,0.5)",
              textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
            }}>HQ</Text>
            <Text style={{
              color: "rgba(201,168,76,0.5)", fontSize: 7, fontWeight: "600",
              letterSpacing: 2.5, textTransform: "uppercase", marginTop: -1,
            }}>HomeQuarters</Text>
          </View>
          <View style={{ transform: [{ rotate: "90deg" }], opacity: 0.7 }}>
            <Ionicons name="wifi" size={26} color={colors.gold} />
          </View>
        </View>

        {/* EMV chip */}
        <View style={{
          width: 44, height: 34, borderRadius: 5,
          backgroundColor: "rgba(201,168,76,0.18)",
          borderWidth: 1, borderColor: "rgba(201,168,76,0.5)",
          overflow: "hidden", justifyContent: "center", alignItems: "center",
        }}>
          <View style={{ gap: 4 }}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={{ flexDirection: "row", gap: 5 }}>
                {[0, 1].map((col) => (
                  <View key={col} style={{
                    width: 12, height: 7, borderRadius: 1,
                    backgroundColor: "rgba(201,168,76,0.3)",
                    borderWidth: 0.5, borderColor: "rgba(201,168,76,0.5)",
                  }} />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom: name + member code + status */}
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
            <Text style={{ color: "rgba(201,168,76,0.7)", fontSize: 11, letterSpacing: 3.5, fontWeight: "400" }}>
              {memberCode}
            </Text>
            <View style={{
              backgroundColor: isActive ? "rgba(76,175,80,0.18)" : "rgba(201,168,76,0.18)",
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
              borderWidth: 0.5,
              borderColor: isActive ? "rgba(76,175,80,0.45)" : "rgba(201,168,76,0.4)",
            }}>
              <Text style={{
                color: isActive ? colors.green : colors.gold,
                fontSize: 8, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase",
              }}>{status}</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <View>
      {/* The card */}
      <Pressable
        onPress={() => router.push("/qr")}
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: CARD_RADIUS,
          overflow: "hidden",
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.22,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {renderFace("c")}
      </Pressable>

      {/* Reflection — only shown when showReflection is true */}
      {showReflection && (
        <>
          {/*
            Clip the flipped card face to REFL_HEIGHT.
            borderTopLeftRadius + borderTopRightRadius match the card's
            bottom corners so the reflection edge looks rounded, not sharp.
          */}
          <View
            pointerEvents="none"
            style={{
              width: CARD_WIDTH,
              height: REFL_HEIGHT,
              overflow: "hidden",
              borderTopLeftRadius: CARD_RADIUS,
              borderTopRightRadius: CARD_RADIUS,
              marginTop: 3,
              opacity: 0.3,
            }}
          >
            <View style={{ transform: [{ scaleY: -1 }], width: CARD_WIDTH, height: CARD_HEIGHT }}>
              {renderFace("r")}
            </View>
          </View>

          {/* Gradient fade: transparent at top → opaque background at bottom */}
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
        </>
      )}
    </View>
  );
}
