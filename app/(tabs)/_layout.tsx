import React, { useEffect, useRef, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform } from "react-native";
import { useAuth } from "@/lib/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GRACE_DAYS = 30;
const GRACE_KEY = "hq_grace_entered";

function TabIcon({
  focused,
  name,
  badge,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  badge?: number;
}) {
  return (
    <View style={{ position: "relative" }}>
      <Ionicons name={name} size={22} color={focused ? colors.ink : colors.stone} />
      {!!badge && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -6,
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: colors.red,
          }}
        />
      )}
    </View>
  );
}

export default function TabLayout() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const paywallChecked = useRef(false);

  // Defensive guard: if status is not active/accepted, boot back to root.
  // Prevents deep links or stale navigation from bypassing the apply/pending gates.
  useEffect(() => {
    if (!user) { router.replace("/onboarding"); return; }
    const s = profile?.membership_status;
    if (s && s !== "active" && s !== "accepted") {
      router.replace("/");
    }
  }, [user, profile?.membership_status]);

  // Paywall guard: accepted members without an active subscription see the paywall.
  // The paywall can be bypassed for GRACE_DAYS from accepted_at.
  useEffect(() => {
    if (!profile) return;
    if (profile.membership_status !== "accepted") return;
    if (profile.stripe_customer_id) return; // already subscribed
    if (paywallChecked.current) return;
    paywallChecked.current = true;

    AsyncStorage.getItem(GRACE_KEY).then((val) => {
      if (val !== "1") {
        // Never entered grace period — show paywall
        router.replace("/paywall");
        return;
      }
      // Grace period entered — check if it has expired
      const acceptedAt = profile.accepted_at;
      if (acceptedAt) {
        const elapsed = (Date.now() - new Date(acceptedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (elapsed >= GRACE_DAYS) {
          AsyncStorage.removeItem(GRACE_KEY).catch(() => {});
          router.replace("/paywall");
        }
      }
    }).catch(() => {});
  }, [profile?.id, profile?.membership_status, profile?.stripe_customer_id]);

  useEffect(() => {
    if (!user?.uid) { setPendingCount(0); return; }
    const q = query(
      collection(db, "connections"),
      where("to_id", "==", user.uid),
      where("status", "==", "pending")
    );
    getDocs(q).then((snap) => setPendingCount(snap.size)).catch(() => {});
  }, [user?.uid]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(242,235,224,0.96)",
          borderTopWidth: 0.5,
          borderTopColor: "rgba(28,28,30,0.1)",
          position: "absolute",
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 80 : 64,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: fonts.body,
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.stone,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarLabel: "Events",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="calendar" />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarLabel: "Saved",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? "heart" : "heart-outline"} />
          ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          tabBarLabel: "Connect",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="chatbubbles" />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarLabel: "Discover",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="compass" badge={pendingCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
