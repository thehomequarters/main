import React, { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Platform } from "react-native";
import { useAuth } from "@/lib/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

function TabIcon({
  focused,
  name,
  label,
  badge,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
}) {
  if (focused) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.dark,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 24,
          gap: 5,
          marginTop: 4,
        }}
      >
        <Ionicons name={name} size={17} color={colors.white} />
        <Text style={{ color: colors.white, fontSize: 12, fontWeight: "700" }}>
          {label}
        </Text>
        {!!badge && (
          <View
            style={{
              backgroundColor: colors.red,
              borderRadius: 7,
              minWidth: 14,
              height: 14,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: colors.white, fontSize: 8, fontWeight: "800" }}>
              {badge}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Unfocused: icon only
  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginTop: 4, position: "relative" }}>
      <Ionicons name={name} size={22} color={colors.stone} />
      {!!badge && (
        <View
          style={{
            position: "absolute",
            top: -3,
            right: -6,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.red,
          }}
        />
      )}
    </View>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

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
          backgroundColor: "transparent",
          borderTopWidth: 0,
          position: "absolute",
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 90 : 72,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 6,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: "#5C5C5E",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="calendar" label="Events" />
          ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="chatbubbles" label="Connect" />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="compass" label="Discover" badge={pendingCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="person" label="Account" />
          ),
        }}
      />
    </Tabs>
  );
}
