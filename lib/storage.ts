import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";
import * as ImagePicker from "expo-image-picker";

const storage = getStorage(app);

/**
 * Pick an image from the device library.
 * Returns the local URI or null if cancelled.
 */
export async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Pick an image for a post (no square crop forced).
 */
export async function pickPostImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Upload a local image URI to Firebase Storage and return the download URL.
 */
export async function uploadImage(
  localUri: string,
  path: string
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);

  return getDownloadURL(storageRef);
}

/**
 * Upload a profile avatar. Returns the download URL.
 */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  return uploadImage(uri, `avatars/${userId}_${Date.now()}.jpg`);
}

/**
 * Upload a post image. Returns the download URL.
 */
export async function uploadPostImage(postId: string, uri: string): Promise<string> {
  return uploadImage(uri, `posts/${postId}_${Date.now()}.jpg`);
}

/**
 * Upload a chat image. Returns the download URL.
 */
export async function uploadChatImage(
  conversationId: string,
  uri: string
): Promise<string> {
  return uploadImage(uri, `chat/${conversationId}_${Date.now()}.jpg`);
}
