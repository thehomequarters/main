import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { pickPostImage, uploadChatImage } from "@/lib/storage";
import type { Conversation, Message } from "@/lib/database.types";

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const hours = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${mins} ${ampm}`;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Ice-breaker questions for first-time messages
const ICE_BREAKERS = [
  "What are you working on at the moment?",
  "What brought you to HQ?",
  "What's your favourite spot in Harare?",
  "Keen to grab a coffee sometime?",
];

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Fetch conversation details
  useEffect(() => {
    if (!conversationId) return;
    const unsub = onSnapshot(
      doc(db, "conversations", conversationId),
      (snap) => {
        if (snap.exists()) {
          setConversation({ id: snap.id, ...snap.data() } as Conversation);
        }
      }
    );
    return () => unsub();
  }, [conversationId]);

  // Real-time messages listener
  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("created_at", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Message
      );
      setMessages(msgList);
      // Scroll to bottom on new messages
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsub();
  }, [conversationId]);

  const getOtherName = () => {
    if (!conversation || !user?.uid) return "Member";
    const otherId = conversation.participants.find((p) => p !== user.uid) ?? "";
    return conversation.participant_names?.[otherId] ?? "Member";
  };

  const getOtherInitials = () => {
    if (!conversation || !user?.uid) return "?";
    const otherId = conversation.participants.find((p) => p !== user.uid) ?? "";
    return conversation.participant_initials?.[otherId] ?? "?";
  };

  const handleSend = async (text?: string) => {
    const msgText = text || newMessage.trim();
    if ((!msgText && !imageUri) || !user?.uid || !profile || !conversationId)
      return;

    setSending(true);
    try {
      let imgUrl: string | null = null;
      if (imageUri) {
        imgUrl = await uploadChatImage(conversationId, imageUri);
        setImageUri(null);
      }

      const initials =
        (profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "");

      await addDoc(
        collection(db, "conversations", conversationId, "messages"),
        {
          sender_id: user.uid,
          sender_name: `${profile.first_name} ${profile.last_name}`,
          sender_initials: initials.toUpperCase(),
          text: msgText,
          image_url: imgUrl,
          created_at: new Date().toISOString(),
        }
      );

      // Update conversation's last message
      await updateDoc(doc(db, "conversations", conversationId), {
        last_message: imgUrl ? (msgText || "Sent an image") : msgText,
        last_message_at: new Date().toISOString(),
        last_sender_id: user.uid,
      });

      setNewMessage("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    const uri = await pickPostImage();
    if (uri) setImageUri(uri);
  };

  // Group messages by date
  const getDateForMessage = (msg: Message) =>
    new Date(msg.created_at).toDateString();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.black }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.darkBorder,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.dark,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(201, 168, 76, 0.12)",
            borderWidth: 1,
            borderColor: "rgba(201, 168, 76, 0.25)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: colors.gold, fontSize: 12, fontWeight: "700" }}
          >
            {getOtherInitials()}
          </Text>
        </View>

        <Text
          style={{
            color: colors.white,
            fontSize: 17,
            fontWeight: "600",
            flex: 1,
          }}
        >
          {getOtherName()}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {/* Ice-breaker prompts (shown when no messages) */}
        {messages.length === 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: colors.grey,
                fontSize: 13,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Start the conversation with an ice-breaker
            </Text>
            {ICE_BREAKERS.map((q) => (
              <Pressable
                key={q}
                onPress={() => handleSend(q)}
                style={{
                  backgroundColor: "rgba(201, 168, 76, 0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(201, 168, 76, 0.2)",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: colors.gold,
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  {q}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.uid;
          const showDate =
            i === 0 ||
            getDateForMessage(msg) !== getDateForMessage(messages[i - 1]);

          return (
            <View key={msg.id}>
              {showDate && (
                <Text
                  style={{
                    color: colors.grey,
                    fontSize: 11,
                    textAlign: "center",
                    marginVertical: 12,
                    opacity: 0.7,
                  }}
                >
                  {formatDateSeparator(msg.created_at)}
                </Text>
              )}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    maxWidth: "75%",
                    backgroundColor: isMe
                      ? "rgba(201, 168, 76, 0.15)"
                      : colors.dark,
                    borderRadius: 16,
                    borderTopLeftRadius: isMe ? 16 : 4,
                    borderTopRightRadius: isMe ? 4 : 16,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: isMe
                      ? "rgba(201, 168, 76, 0.2)"
                      : colors.darkBorder,
                  }}
                >
                  {msg.image_url && (
                    <Image
                      source={{ uri: msg.image_url }}
                      style={{
                        width: 200,
                        height: 150,
                        borderRadius: 10,
                        marginBottom: msg.text ? 8 : 0,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  {msg.text ? (
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: 15,
                        lineHeight: 21,
                      }}
                    >
                      {msg.text}
                    </Text>
                  ) : null}
                  <Text
                    style={{
                      color: colors.grey,
                      fontSize: 10,
                      marginTop: 4,
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      opacity: 0.7,
                    }}
                  >
                    {formatTime(msg.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Image preview */}
      {imageUri && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderTopColor: colors.darkBorder,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Image
            source={{ uri: imageUri }}
            style={{ width: 60, height: 60, borderRadius: 8 }}
          />
          <Pressable onPress={() => setImageUri(null)}>
            <Ionicons name="close-circle" size={22} color={colors.red} />
          </Pressable>
        </View>
      )}

      {/* Input bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 12,
          paddingVertical: 10,
          paddingBottom: Platform.OS === "ios" ? 34 : 14,
          borderTopWidth: 1,
          borderTopColor: colors.darkBorder,
          backgroundColor: colors.black,
          gap: 8,
        }}
      >
        <Pressable
          onPress={handlePickImage}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.dark,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="image-outline" size={20} color={colors.grey} />
        </Pressable>

        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Message..."
          placeholderTextColor="rgba(160, 160, 160, 0.5)"
          multiline
          style={{
            flex: 1,
            backgroundColor: colors.dark,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: colors.white,
            fontSize: 15,
            maxHeight: 100,
            borderWidth: 1,
            borderColor: colors.darkBorder,
          }}
        />

        <Pressable
          onPress={() => handleSend()}
          disabled={sending || (!newMessage.trim() && !imageUri)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor:
              newMessage.trim() || imageUri
                ? colors.gold
                : "rgba(201, 168, 76, 0.2)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="send"
            size={18}
            color={
              newMessage.trim() || imageUri ? colors.black : colors.grey
            }
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
