import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";

export default function Index() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/apply");
      return;
    }

    if (profile?.membership_status === "active") {
      router.replace("/home");
    } else if (profile?.membership_status === "pending") {
      router.replace("/pending");
    } else {
      router.replace("/apply");
    }
  }, [loading, session, profile]);

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
