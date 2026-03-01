import React from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import QRCode from "react-native-qrcode-svg";

export default function QRCodeScreen() {
  const { venueName, dealTitle, venueId, dealId } = useLocalSearchParams<{
    venueName: string;
    dealTitle: string;
    venueId: string;
    dealId: string;
  }>();
  const { profile } = useAuth();
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const qrSize = screenWidth * 0.6;

  // The QR code encodes the verification URL
  const verificationUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL ? "https://homequarters.app" : "https://homequarters.app"}/v/${profile?.member_code}`;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.black,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
      }}
    >
      {/* HQ Logo */}
      <Text
        style={{
          color: colors.gold,
          fontSize: 24,
          fontWeight: "700",
          letterSpacing: 6,
          marginBottom: 48,
        }}
      >
        HQ
      </Text>

      {/* QR Code Container */}
      <View
        style={{
          backgroundColor: colors.dark,
          borderRadius: 20,
          padding: 32,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(201, 168, 76, 0.2)",
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            padding: 16,
            borderRadius: 12,
          }}
        >
          <QRCode
            value={verificationUrl}
            size={qrSize}
            backgroundColor={colors.white}
            color={colors.black}
          />
        </View>
      </View>

      {/* Member Info */}
      <View style={{ alignItems: "center", marginTop: 32 }}>
        <Text
          style={{
            color: colors.white,
            fontSize: 18,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {profile?.first_name} {profile?.last_name}
        </Text>

        <Text
          style={{
            color: colors.grey,
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          {venueName}
        </Text>

        <Text
          style={{
            color: colors.grey,
            fontSize: 13,
            opacity: 0.7,
          }}
        >
          {dealTitle}
        </Text>
      </View>

      {/* Close Button */}
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => ({
          marginTop: 48,
          paddingVertical: 14,
          paddingHorizontal: 48,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.darkBorder,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            color: colors.grey,
            fontSize: 15,
            fontWeight: "500",
          }}
        >
          Close
        </Text>
      </Pressable>
    </View>
  );
}
