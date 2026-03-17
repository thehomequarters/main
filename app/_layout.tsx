import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import { colors } from "@/constants/theme";
import {
  useFonts,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";

SplashScreen.preventAutoHideAsync();

// Show push notifications even when the app is open in the foreground.
// Without this, Expo silently drops notifications if the app is active.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── AuthGuard ─────────────────────────────────────────────────────────────────

function AuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inTabs = segments[0] === "(tabs)";
    const inPending = segments[0] === "pending";
    if (!user && (inTabs || inPending)) {
      router.replace("/onboarding");
    }
  }, [user, loading, segments]);

  return null;
}

// ── NotificationHandler ───────────────────────────────────────────────────────
// Listens for notification taps and routes to the relevant screen.
// Must live inside the router tree so useRouter is available.

function NotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    // Fires when the user taps a push notification (foreground or background).
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = (response.notification.request.content.data ??
          {}) as Record<string, string>;

        switch (data.type) {
          case "message":
            if (data.conversationId) {
              router.push(`/messages/${data.conversationId}` as any);
            }
            break;
          case "group_message":
            if (data.groupId) {
              router.push(`/group/${data.groupId}` as any);
            }
            break;
          case "connection_request":
          case "connection_accepted":
            router.push("/notifications" as any);
            break;
        }
      }
    );
    return () => sub.remove();
  }, []);

  return null;
}

// ── Root layout ───────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGuard />
        <NotificationHandler />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "fade",
          }}
        />
      </ToastProvider>
    </AuthProvider>
  );
}
