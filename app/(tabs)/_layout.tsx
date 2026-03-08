import React, { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { colors, fonts } from "@/constants/theme";
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
  return (
    <View style={{ alignItems: "center", marginTop: 2, position: "relative" }}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? colors.ink : colors.stone}
      />
      <Text
        numberOfLines={1}
        style={{
          color: focused ? colors.ink : colors.stone,
          fontSize: 10,
          fontFamily: focused ? fonts.semibold : fonts.body,
          marginTop: 3,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
      {!!badge && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -8,
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
          backgroundColor: "rgba(242,235,224,0.96)",
          borderTopWidth: 0.5,
          borderTopColor: "rgba(28,28,30,0.1)",
          position: "absolute",
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 88 : 70,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.dark,
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
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
          href: null,
        }}
      />
    </Tabs>
  );
}
