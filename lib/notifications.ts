import { Platform } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Registers for push notifications and stores the Expo push token
 * on the user's profile document.
 *
 * Requires expo-notifications to be installed:
 *   npx expo install expo-notifications
 */
export async function registerPushToken(userId: string): Promise<void> {
  // expo-notifications is optional — import dynamically so the app doesn't
  // crash if it hasn't been installed yet.
  let Notifications: typeof import("expo-notifications");
  try {
    Notifications = await import("expo-notifications");
  } catch {
    return;
  }

  // Push notifications are not supported on the web or in Expo Go without
  // a physical device project ID. Guard gracefully.
  if (Platform.OS === "web") return;

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    await updateDoc(doc(db, "profiles", userId), { push_token: token });
  } catch (err) {
    // Non-critical — the app works fine without push tokens
    console.warn("Could not register push token:", err);
  }
}
