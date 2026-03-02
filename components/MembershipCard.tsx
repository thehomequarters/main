import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

interface MembershipCardProps {
  firstName: string;
  lastName: string;
  memberCode: string;
  status: string;
}

// Standard credit card aspect ratio: 85.6mm × 53.98mm ≈ 1.586:1
const CARD_ASPECT_RATIO = 1.586;

export function MembershipCard({
  firstName,
  lastName,
  memberCode,
  status,
}: MembershipCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/qr")}
      style={({ pressed }) => ({
        aspectRatio: CARD_ASPECT_RATIO,
        backgroundColor: colors.dark,
        borderRadius: 14,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
        justifyContent: "space-between",
        overflow: "hidden",
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {/* Top row: HQ logo + NFC icon */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Text
          style={{
            color: colors.gold,
            fontSize: 30,
            fontWeight: "700",
            letterSpacing: 4,
          }}
        >
          HQ
        </Text>

        {/* NFC contactless icon (WiFi rotated 90°) */}
        <View
          style={{
            transform: [{ rotate: "90deg" }],
            opacity: 0.6,
          }}
        >
          <Ionicons name="wifi" size={28} color={colors.gold} />
        </View>
      </View>

      {/* Chip */}
      <View
        style={{
          width: 42,
          height: 32,
          borderRadius: 6,
          backgroundColor: "rgba(201, 168, 76, 0.2)",
          borderWidth: 1,
          borderColor: "rgba(201, 168, 76, 0.35)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Chip lines */}
        <View
          style={{
            width: 28,
            height: 0,
            borderTopWidth: 1,
            borderColor: "rgba(201, 168, 76, 0.4)",
            marginBottom: 4,
          }}
        />
        <View
          style={{
            width: 28,
            height: 0,
            borderTopWidth: 1,
            borderColor: "rgba(201, 168, 76, 0.4)",
            marginBottom: 4,
          }}
        />
        <View
          style={{
            width: 28,
            height: 0,
            borderTopWidth: 1,
            borderColor: "rgba(201, 168, 76, 0.4)",
          }}
        />
      </View>

      {/* Bottom section: Name, code, status */}
      <View>
        <Text
          style={{
            color: colors.white,
            fontSize: 18,
            fontWeight: "600",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
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
              color: colors.grey,
              fontSize: 12,
              letterSpacing: 3,
              fontWeight: "400",
            }}
          >
            {memberCode}
          </Text>

          <View
            style={{
              backgroundColor:
                status === "active"
                  ? "rgba(76, 175, 80, 0.15)"
                  : "rgba(201, 168, 76, 0.15)",
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                color: status === "active" ? colors.green : colors.gold,
                fontSize: 9,
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
    </Pressable>
  );
}
