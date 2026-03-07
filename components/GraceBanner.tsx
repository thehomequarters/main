import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";

const AMBER      = "#F5A623";
const AMBER_DARK = "#3D2800";

export function GraceBanner() {
  const { profile } = useAuth();
  const router = useRouter();

  const isGrace = profile?.membership_status === "accepted";

  const daysLeft = useMemo(() => {
    if (!isGrace || !profile?.accepted_at) return 365;
    const acceptedMs = new Date(profile.accepted_at).getTime();
    const expiryMs   = acceptedMs + 365 * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((expiryMs - Date.now()) / (24 * 60 * 60 * 1000)));
  }, [profile?.accepted_at, isGrace]);

  if (!isGrace) return null;

  return (
    <Pressable
      onPress={() => router.push("/activate")}
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: AMBER,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
        <Ionicons name="time-outline" size={16} color={AMBER_DARK} />
        <Text
          style={{ color: AMBER_DARK, fontSize: 13, fontWeight: "700", flex: 1 }}
          numberOfLines={1}
        >
          {daysLeft} day{daysLeft !== 1 ? "s" : ""} left to activate
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ color: AMBER_DARK, fontSize: 13, fontWeight: "800" }}>Activate</Text>
        <Ionicons name="arrow-forward" size={14} color={AMBER_DARK} />
      </View>
    </Pressable>
  );
}
