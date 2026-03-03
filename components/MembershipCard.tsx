import React, { useEffect, useRef, useMemo } from "react";
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

// Warm pearl accent for the dark membership card (replaces gold)
const PEARL = "#C4BDB5";
const PEARL_DIM = "rgba(196,189,181,0.5)";
const AMBER = "#F5A623";
const AMBER_DIM = "rgba(245,166,35,0.5)";

const TIER_DISPLAY: Record<string, string> = {
  gold_card: "Gold Card",
  platinum_card: "Platinum Card",
  founding_member: "Founding Member",
  committee_member: "Committee Member",
};

interface MembershipCardProps {
  firstName: string;
  lastName: string;
  memberCode: string;
  status: string;
  tier?: string;
  acceptedAt?: string | null;
}

const CARD_ASPECT_RATIO = 1.586;
const SCREEN_WIDTH      = Dimensions.get("window").width;
const CARD_WIDTH        = SCREEN_WIDTH - 40;
const CARD_HEIGHT       = Math.round(CARD_WIDTH / CARD_ASPECT_RATIO);
const CARD_RADIUS       = 16;

export function MembershipCard({
  firstName,
  lastName,
  memberCode,
  status,
  tier,
  acceptedAt,
}: MembershipCardProps) {
  const tierLabel = tier ? TIER_DISPLAY[tier] : null;
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
  const isGrace  = status === "accepted";

  const graceExpiryLabel = useMemo(() => {
    if (!isGrace || !acceptedAt) return null;
    const expiry = new Date(new Date(acceptedAt).getTime() + 365 * 24 * 60 * 60 * 1000);
    return `Activate before ${expiry.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }, [isGrace, acceptedAt]);

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
            <Stop offset="48%"  stopColor="#292520" stopOpacity="1" />
            <Stop offset="56%"  stopColor="#2a2318" stopOpacity="1" />
            <Stop offset="72%"  stopColor="#161410" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
          </SvgGradient>
          <SvgGradient id={`${p}sheen`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#ffffff" stopOpacity="0.000" />
            <Stop offset="28%"  stopColor="#ffffff" stopOpacity="0.028" />
            <Stop offset="50%"  stopColor={PEARL}   stopOpacity="0.030" />
            <Stop offset="72%"  stopColor="#ffffff" stopOpacity="0.018" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.000" />
          </SvgGradient>
          <SvgGradient id={`${p}top`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"  stopColor={PEARL} stopOpacity="0.12" />
            <Stop offset="8%"  stopColor={PEARL} stopOpacity="0.00" />
          </SvgGradient>
          <SvgGradient id={`${p}bot`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="88%"  stopColor={PEARL} stopOpacity="0.00" />
            <Stop offset="100%" stopColor={PEARL} stopOpacity="0.08" />
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
            fill="none" stroke={PEARL}
            strokeOpacity={0.035 - i * 0.004} strokeWidth={0.8}
          />
        ))}

        {Array.from({ length: 14 }).map((_, i) => (
          <Line
            key={i}
            x1={0} y1={(CARD_HEIGHT / 15) * (i + 1)}
            x2={CARD_WIDTH} y2={(CARD_HEIGHT / 15) * (i + 1)}
            stroke="#ffffff" strokeOpacity={0.010} strokeWidth={0.5}
          />
        ))}

        <Rect
          x={0.5} y={0.5} width={CARD_WIDTH - 1} height={CARD_HEIGHT - 1} rx={15.5}
          fill="none" stroke={PEARL_DIM} strokeWidth={1}
        />
        <Rect
          x={3} y={3} width={CARD_WIDTH - 6} height={CARD_HEIGHT - 6} rx={13}
          fill="none" stroke="rgba(196,189,181,0.12)" strokeWidth={0.5}
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
          <View style={{ flex: 2, backgroundColor: "rgba(255,250,245,0.06)" }} />
          <View style={{ flex: 4, backgroundColor: "rgba(255,250,245,0.11)" }} />
          <View style={{ flex: 2, backgroundColor: "rgba(255,250,245,0.06)" }} />
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
          <View style={{ flex: 3, backgroundColor: "rgba(255,250,245,0.05)" }} />
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
              color: PEARL, fontSize: 28, fontWeight: "800", letterSpacing: 5,
              textShadowColor: "rgba(196,189,181,0.4)",
              textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
            }}>HQ</Text>
            <Text style={{
              color: PEARL_DIM, fontSize: 7, fontWeight: "600",
              letterSpacing: 2.5, textTransform: "uppercase", marginTop: -1,
            }}>HomeQuarters</Text>
          </View>
          <View style={{ transform: [{ rotate: "90deg" }], opacity: 0.55 }}>
            <Ionicons name="wifi" size={26} color={PEARL} />
          </View>
        </View>

        {/* EMV chip */}
        <View style={{
          width: 44, height: 34, borderRadius: 5,
          backgroundColor: "rgba(196,189,181,0.12)",
          borderWidth: 1, borderColor: "rgba(196,189,181,0.35)",
          overflow: "hidden", justifyContent: "center", alignItems: "center",
        }}>
          <View style={{ gap: 4 }}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={{ flexDirection: "row", gap: 5 }}>
                {[0, 1].map((col) => (
                  <View key={col} style={{
                    width: 12, height: 7, borderRadius: 1,
                    backgroundColor: "rgba(196,189,181,0.22)",
                    borderWidth: 0.5, borderColor: "rgba(196,189,181,0.35)",
                  }} />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom: tier + name + member code + status */}
        <View>
          {tierLabel && (
            <Text style={{
              color: PEARL_DIM, fontSize: 7, fontWeight: "700",
              letterSpacing: 3, textTransform: "uppercase", marginBottom: 4,
            }}>
              {tierLabel}
            </Text>
          )}
          <Text style={{
            color: "#ffffff", fontSize: 15, fontWeight: "700",
            letterSpacing: 2.5, textTransform: "uppercase", marginBottom: isGrace ? 4 : 8,
            textShadowColor: "rgba(255,255,255,0.2)",
            textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
          }} numberOfLines={1}>
            {firstName} {lastName}
          </Text>
          {isGrace && graceExpiryLabel && (
            <Text style={{
              color: AMBER_DIM, fontSize: 8, fontWeight: "500",
              letterSpacing: 1, marginBottom: 8,
            }}>
              {graceExpiryLabel}
            </Text>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "rgba(196,189,181,0.65)", fontSize: 11, letterSpacing: 3.5, fontWeight: "400" }}>
              {memberCode}
            </Text>
            <View style={{
              backgroundColor: isActive
                ? "rgba(76,175,80,0.18)"
                : isGrace
                ? "rgba(245,166,35,0.18)"
                : "rgba(196,189,181,0.15)",
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
              borderWidth: 0.5,
              borderColor: isActive
                ? "rgba(76,175,80,0.45)"
                : isGrace
                ? "rgba(245,166,35,0.45)"
                : "rgba(196,189,181,0.35)",
            }}>
              <Text style={{
                color: isActive ? colors.green : isGrace ? AMBER : PEARL,
                fontSize: 8, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase",
              }}>{isGrace ? "GRACE PERIOD" : status}</Text>
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
        onPress={() => router.push(isGrace ? "/activate" : "/qr")}
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: CARD_RADIUS,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        {renderFace("c")}
      </Pressable>

    </View>
  );
}
