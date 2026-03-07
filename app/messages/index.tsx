import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import type { Conversation } from "@/lib/database.types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convList = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Conversation)
        .sort(
          (a, b) =>
            new Date(b.last_message_at || b.created_at).getTime() -
            new Date(a.last_message_at || a.created_at).getTime()
        );
      setConversations(convList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getOtherParticipant = (conv: Conversation) => {
    const otherId = conv.participants.find((p) => p !== user?.uid) ?? "";
    return {
      id: otherId,
      name: conv.participant_names?.[otherId] ?? "Member",
      initials: conv.participant_initials?.[otherId] ?? "?",
    };
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
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
        <Text
          style={{
            color: colors.white,
            fontSize: 20,
            fontWeight: "700",
            flex: 1,
          }}
        >
          Messages
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {loading && (
          <View style={{ padding: 20, gap: 16 }}>
            <SkeletonLoader width="100%" height={70} borderRadius={12} />
            <SkeletonLoader width="100%" height={70} borderRadius={12} />
            <SkeletonLoader width="100%" height={70} borderRadius={12} />
          </View>
        )}

        {!loading && conversations.length === 0 && (
          <View
            style={{
              alignItems: "center",
              marginTop: 80,
              paddingHorizontal: 40,
            }}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={56}
              color={colors.darkBorder}
            />
            <Text
              style={{
                color: colors.grey,
                fontSize: 16,
                fontWeight: "600",
                marginTop: 20,
                textAlign: "center",
              }}
            >
              No messages yet
            </Text>
            <Text
              style={{
                color: colors.grey,
                fontSize: 13,
                marginTop: 8,
                textAlign: "center",
                opacity: 0.7,
              }}
            >
              Connect with members on the Discover tab, then start a
              conversation.
            </Text>
          </View>
        )}

        {!loading &&
          conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isMyLastMessage = conv.last_sender_id === user?.uid;

            return (
              <Pressable
                key={conv.id}
                onPress={() => router.push(`/messages/${conv.id}`)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.darkBorder,
                }}
              >
                {/* Avatar */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "rgba(201, 168, 76, 0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(201, 168, 76, 0.25)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                  }}
                >
                  <Text
                    style={{
                      color: colors.stone,
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    {other.initials}
                  </Text>
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: 15,
                        fontWeight: "600",
                      }}
                    >
                      {other.name}
                    </Text>
                    {conv.last_message_at && (
                      <Text
                        style={{
                          color: colors.grey,
                          fontSize: 11,
                          opacity: 0.7,
                        }}
                      >
                        {timeAgo(conv.last_message_at)}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      color: colors.grey,
                      fontSize: 13,
                    }}
                    numberOfLines={1}
                  >
                    {isMyLastMessage ? "You: " : ""}
                    {conv.last_message || "Start the conversation..."}
                  </Text>
                </View>
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
}
