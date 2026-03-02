import React, { useState } from "react";
import { View, Text, Pressable, Dimensions, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";

export default function QRCodeScreen() {
  const { venueName, dealTitle, venueId, dealId } = useLocalSearchParams<{
    venueName: string;
    dealTitle: string;
    venueId: string;
    dealId: string;
  }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const qrSize = screenWidth * 0.5;
  const [redeemed, setRedeemed] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  // Encode full redemption payload — staff scan this to validate + redeem
  const qrPayload = JSON.stringify({
    type: "hq_redeem",
    member_code: profile?.member_code,
    member_name: `${profile?.first_name} ${profile?.last_name}`,
    member_id: profile?.id,
    venue_id: venueId,
    deal_id: dealId,
    ts: new Date().toISOString(),
  });

  const handleRedeem = async () => {
    if (!user?.uid || !venueId || !dealId || redeemed) return;

    setRedeeming(true);
    try {
      await addDoc(collection(db, "redemptions"), {
        member_id: user.uid,
        venue_id: venueId,
        deal_id: dealId,
        redeemed_at: new Date().toISOString(),
      });
      setRedeemed(true);
      Alert.alert("Redeemed", "This benefit has been recorded.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setRedeeming(false);
    }
  };

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
      {/* Close button top-right */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: 60,
          right: 20,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.dark,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="close" size={20} color={colors.white} />
      </Pressable>

      {/* Instructions */}
      <Text
        style={{
          color: colors.grey,
          fontSize: 13,
          textAlign: "center",
          marginBottom: 8,
          letterSpacing: 0.3,
        }}
      >
        Show this to staff to redeem
      </Text>

      {/* Venue + Deal context */}
      <Text
        style={{
          color: colors.white,
          fontSize: 20,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        {venueName}
      </Text>
      <Text
        style={{
          color: colors.gold,
          fontSize: 14,
          fontWeight: "500",
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        {dealTitle}
      </Text>

      {/* QR Code Container */}
      <View
        style={{
          backgroundColor: colors.dark,
          borderRadius: 20,
          padding: 28,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(201, 168, 76, 0.2)",
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 8,
          width: "100%",
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
            value={qrPayload}
            size={qrSize}
            backgroundColor={colors.white}
            color={colors.black}
          />
        </View>

        {/* Member info below QR */}
        <View
          style={{
            marginTop: 20,
            alignItems: "center",
            width: "100%",
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {profile?.first_name} {profile?.last_name}
          </Text>

          <Text
            style={{
              color: colors.grey,
              fontSize: 12,
              letterSpacing: 2,
              marginTop: 4,
            }}
          >
            {profile?.member_code}
          </Text>
        </View>
      </View>

      {/* Mark as redeemed button (for when staff confirms) */}
      {venueId && dealId && (
        <Pressable
          onPress={handleRedeem}
          disabled={redeemed || redeeming}
          style={{
            marginTop: 24,
            backgroundColor: redeemed
              ? "rgba(76, 175, 80, 0.15)"
              : colors.gold,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 40,
            opacity: redeeming ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              color: redeemed ? colors.green : colors.black,
              fontSize: 15,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {redeemed
              ? "Redeemed"
              : redeeming
                ? "Recording..."
                : "Mark as Redeemed"}
          </Text>
        </Pressable>
      )}

      {/* How it works */}
      <View style={{ marginTop: 24, gap: 8, alignItems: "center" }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <Ionicons name="scan-outline" size={16} color={colors.grey} />
          <Text style={{ color: colors.grey, fontSize: 12 }}>
            Staff scans to verify your membership
          </Text>
        </View>
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={colors.grey}
          />
          <Text style={{ color: colors.grey, fontSize: 12 }}>
            Tap "Mark as Redeemed" once staff confirms
          </Text>
        </View>
      </View>
    </View>
  );
}
