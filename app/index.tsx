import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";

export default function Index() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/apply");
      return;
    }

    if (profile?.membership_status === "active") {
      router.replace("/(tabs)");
    } else if (profile?.membership_status === "pending") {
      router.replace("/pending");
    } else {
      router.replace("/apply");
    }
  }, [loading, user, profile]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.black,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}
