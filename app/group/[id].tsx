import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { pickPostImage, uploadGroupChatImage } from "@/lib/storage";
import type { Group, GroupMessage } from "@/lib/database.types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Load group metadata
  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "groups", id)).then((snap) => {
      if (snap.exists()) setGroup({ id: snap.id, ...snap.data() } as Group);
      setLoadingGroup(false);
    });
  }, [id]);

  // Real-time messages
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "group_messages"),
      where("group_id", "==", id),
      orderBy("created_at", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GroupMessage));
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
      },
      (err) => console.warn("group_messages snapshot:", err)
    );
    return () => unsub();
  }, [id]);

  const handlePickImage = async () => {
    const uri = await pickPostImage();
    if (uri) setImageUri(uri);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageUri) return;

    if (!user?.uid || !id) {
      toast("Something went wrong. Please restart the app.", "error");
      return;
    }

    setSending(true);
    try {
      // Upload image if attached
      let imgUrl: string | undefined;
      if (imageUri) {
        imgUrl = await uploadGroupChatImage(id, imageUri);
        setImageUri(null);
      }

      const firstName = profile?.first_name ?? user.displayName?.split(" ")[0] ?? "Member";
      const lastName  = profile?.last_name  ?? user.displayName?.split(" ").slice(1).join(" ") ?? "";
      const initials  = (firstName[0] ?? "").toUpperCase() + (lastName[0] ?? "").toUpperCase();

      await addDoc(collection(db, "group_messages"), {
        group_id: id,
        author_id: user.uid,
        author_name: `${firstName} ${lastName}`.trim(),
        author_initials: initials || "?",
        content: trimmed,
        ...(imgUrl ? { image_url: imgUrl } : {}),
        created_at: new Date().toISOString(),
      });

      setText("");
    } catch {
      toast("Failed to send message.", "error");
    } finally {
      setSending(false);
    }
  };

  if (loadingGroup) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.stone} />
      </View>
    );
  }

  const canSend = (text.trim().length > 0 || !!imageUri) && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{group?.name ?? "Group"}</Text>
          <Text style={styles.headerSub}>{group?.member_count ?? 0} members</Text>
        </View>
        <View style={styles.groupIcon}>
          <Ionicons
            name={(group?.icon ?? "people-outline") as any}
            size={18}
            color={colors.stone}
          />
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={44} color={colors.darkBorder} />
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMe = item.author_id === user?.uid;
          const prevMsg = messages[index - 1];
          const showDate =
            index === 0 ||
            new Date(item.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

          return (
            <View>
              {/* Date separator */}
              {showDate && (
                <Text style={styles.dateSep}>{formatDateSeparator(item.created_at)}</Text>
              )}

              <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                {!isMe && (
                  <View style={styles.msgAvatar}>
                    <Text style={styles.msgAvatarText}>{item.author_initials}</Text>
                  </View>
                )}

                <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
                  {!isMe && (
                    <Text style={styles.msgAuthor}>{item.author_name}</Text>
                  )}

                  {/* Image */}
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={[styles.msgImage, item.content ? { marginBottom: 8 } : null]}
                      resizeMode="cover"
                    />
                  ) : null}

                  {/* Text */}
                  {item.content ? (
                    <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
                      {item.content}
                    </Text>
                  ) : null}

                  <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeThem]}>
                    {timeAgo(item.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Image preview strip */}
      {imageUri && (
        <View style={styles.previewStrip}>
          <Image source={{ uri: imageUri }} style={styles.previewThumb} />
          <Pressable onPress={() => setImageUri(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color={colors.red} />
          </Pressable>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <Pressable onPress={handlePickImage} style={styles.imageBtn}>
          <Ionicons name="image-outline" size={20} color={colors.grey} />
        </Pressable>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`Message ${group?.name ?? "group"}…`}
          placeholderTextColor="rgba(160,160,160,0.4)"
          style={styles.input}
          multiline
          maxLength={600}
          returnKeyType="default"
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[styles.sendBtn, { opacity: canSend ? 1 : 0.35 }]}
        >
          <Ionicons name="arrow-up" size={18} color={colors.black} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loader: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 17,
    fontFamily: fonts.semibold,
  },
  headerSub: {
    color: colors.grey,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 1,
  },
  groupIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(201,168,76,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Messages list
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  dateSep: {
    color: colors.grey,
    fontSize: 11,
    fontFamily: fonts.medium,
    textAlign: "center",
    marginVertical: 14,
    opacity: 0.6,
  },
  empty: {
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    color: colors.grey,
    fontSize: 14,
    fontFamily: fonts.body,
    textAlign: "center",
  },

  // Message row
  msgRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  msgRowMe: {
    justifyContent: "flex-end",
  },
  msgRowThem: {
    justifyContent: "flex-start",
  },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(201,168,76,0.12)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  msgAvatarText: {
    color: colors.stone,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  msgBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
    overflow: "hidden",
  },
  msgBubbleMe: {
    backgroundColor: colors.stone,
    borderBottomRightRadius: 4,
  },
  msgBubbleThem: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderBottomLeftRadius: 4,
  },
  msgAuthor: {
    color: colors.stone,
    fontSize: 11,
    fontFamily: fonts.bold,
    marginBottom: 3,
  },
  msgImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.body,
  },
  msgTextMe: {
    color: colors.black,
  },
  msgTextThem: {
    color: colors.white,
  },
  msgTime: {
    fontSize: 10,
    fontFamily: fonts.body,
    marginTop: 4,
    opacity: 0.55,
  },
  msgTimeMe: {
    color: colors.black,
    textAlign: "right",
  },
  msgTimeThem: {
    color: colors.grey,
  },

  // Image preview
  previewStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.darkBorder,
  },
  previewThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },

  // Input row
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    borderTopWidth: 1,
    borderTopColor: colors.darkBorder,
    gap: 8,
  },
  imageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.dark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.body,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    maxHeight: 120,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.stone,
    justifyContent: "center",
    alignItems: "center",
  },
});
