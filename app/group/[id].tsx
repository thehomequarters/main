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
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { Group, GroupMessage } from "@/lib/database.types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;

    getDoc(doc(db, "groups", id)).then((snap) => {
      if (snap.exists()) setGroup({ id: snap.id, ...snap.data() } as Group);
      setLoadingGroup(false);
    });

    const q = query(
      collection(db, "group_messages"),
      where("group_id", "==", id),
      orderBy("created_at", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GroupMessage)
      );
    });

    return () => unsub();
  }, [id]);

  const handleSend = async () => {
    if (!text.trim() || !user?.uid || !profile || !id) return;
    setSending(true);
    try {
      const initials =
        (profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "");
      await addDoc(collection(db, "group_messages"), {
        group_id: id,
        author_id: user.uid,
        author_name: `${profile.first_name} ${profile.last_name}`,
        author_initials: initials.toUpperCase(),
        content: text.trim(),
        created_at: new Date().toISOString(),
      });
      setText("");
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
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
          <Text style={styles.headerSub}>
            {group?.member_count ?? 0} members
          </Text>
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
        onContentSizeChange={() =>
          flatRef.current?.scrollToEnd({ animated: false })
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="chatbubbles-outline"
              size={44}
              color={colors.darkBorder}
            />
            <Text style={styles.emptyText}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = item.author_id === user?.uid;
          return (
            <View
              style={[
                styles.msgRow,
                isMe ? styles.msgRowMe : styles.msgRowThem,
              ]}
            >
              {!isMe && (
                <View style={styles.msgAvatar}>
                  <Text style={styles.msgAvatarText}>
                    {item.author_initials}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.msgBubble,
                  isMe ? styles.msgBubbleMe : styles.msgBubbleThem,
                ]}
              >
                {!isMe && (
                  <Text style={styles.msgAuthor}>{item.author_name}</Text>
                )}
                <Text
                  style={[
                    styles.msgText,
                    isMe ? styles.msgTextMe : styles.msgTextThem,
                  ]}
                >
                  {item.content}
                </Text>
                <Text
                  style={[
                    styles.msgTime,
                    isMe ? styles.msgTimeMe : styles.msgTimeThem,
                  ]}
                >
                  {timeAgo(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`Message ${group?.name ?? "group"}...`}
          placeholderTextColor="rgba(160,160,160,0.4)"
          style={styles.input}
          multiline
          maxLength={600}
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || sending}
          style={[
            styles.sendBtn,
            { opacity: !text.trim() || sending ? 0.4 : 1 },
          ]}
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
    fontWeight: "700",
  },
  headerSub: {
    color: colors.grey,
    fontSize: 12,
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
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  empty: {
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    color: colors.grey,
    fontSize: 14,
    textAlign: "center",
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 14,
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
    fontWeight: "700",
  },
  msgBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    fontWeight: "700",
    marginBottom: 3,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMe: {
    color: colors.black,
    fontWeight: "500",
  },
  msgTextThem: {
    color: colors.white,
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
  },
  msgTimeMe: {
    color: "rgba(0,0,0,0.45)",
    textAlign: "right",
  },
  msgTimeThem: {
    color: "rgba(160,160,160,0.5)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    borderTopWidth: 1,
    borderTopColor: colors.darkBorder,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.dark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 14,
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
