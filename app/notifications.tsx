import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { Connection, Profile, Conversation } from "@/lib/database.types";

type NotifItem =
  | { kind: "connection_request"; conn: Connection; from: Profile }
  | { kind: "new_message"; conv: Conversation; otherName: string; otherInitials: string }
  | { kind: "connection_accepted"; conn: Connection; from: Profile };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const load = async () => {
      const result: NotifItem[] = [];

      // 1. Inbound pending connection requests
      const pendingConnQ = query(
        collection(db, "connections"),
        where("to_id", "==", user.uid),
        where("status", "==", "pending")
      );
      const pendingSnap = await getDocs(pendingConnQ);
      const pendingConns = pendingSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Connection
      );

      // 2. Recently accepted connections (where I was the requester)
      const acceptedConnQ = query(
        collection(db, "connections"),
        where("from_id", "==", user.uid),
        where("status", "==", "accepted")
      );
      const acceptedSnap = await getDocs(acceptedConnQ);
      const acceptedConns = acceptedSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Connection
      );

      // Collect all relevant UIDs to batch-fetch profiles
      const uids = new Set<string>([
        ...pendingConns.map((c) => c.from_id),
        ...acceptedConns.map((c) => c.to_id),
      ]);

      const profileMap = new Map<string, Profile>();
      for (const uid of uids) {
        try {
          const { getDoc, doc } = await import("firebase/firestore");
          const snap = await getDoc(doc(db, "profiles", uid));
          if (snap.exists()) {
            profileMap.set(uid, { id: snap.id, ...snap.data() } as Profile);
          }
        } catch {
          // ignore
        }
      }

      for (const conn of pendingConns) {
        const from = profileMap.get(conn.from_id);
        if (from) result.push({ kind: "connection_request", conn, from });
      }

      for (const conn of acceptedConns) {
        const from = profileMap.get(conn.to_id);
        if (from) result.push({ kind: "connection_accepted", conn, from });
      }

      // 3. Conversations with recent messages from others
      const convQ = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid)
      );
      const convSnap = await getDocs(convQ);
      const conversations = convSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Conversation)
        .filter(
          (c) =>
            c.last_message_at &&
            c.last_sender_id &&
            c.last_sender_id !== user.uid
        )
        .sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() -
            new Date(a.last_message_at).getTime()
        )
        .slice(0, 10);

      for (const conv of conversations) {
        const otherId = conv.participants.find((p) => p !== user.uid) ?? "";
        const otherName = conv.participant_names?.[otherId] ?? "Member";
        const otherInitials = conv.participant_initials?.[otherId] ?? "?";
        result.push({ kind: "new_message", conv, otherName, otherInitials });
      }

      // Sort by recency across all types
      result.sort((a, b) => {
        const getDate = (item: NotifItem) => {
          if (item.kind === "new_message") return item.conv.last_message_at;
          return item.conn.created_at;
        };
        return (
          new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime()
        );
      });

      setItems(result);
      setLoading(false);
    };

    load();
  }, [user?.uid]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="notifications-outline"
            size={52}
            color={colors.darkBorder}
          />
          <Text style={styles.emptyTitle}>All clear</Text>
          <Text style={styles.emptyText}>
            You have no new notifications right now.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((item, index) => {
            if (item.kind === "connection_request") {
              const initials =
                (item.from.first_name?.[0] ?? "") +
                (item.from.last_name?.[0] ?? "");
              return (
                <Pressable
                  key={`cr-${item.conn.id}`}
                  onPress={() => router.push("/(tabs)/discover")}
                  style={styles.notifRow}
                >
                  <View style={[styles.avatar, styles.avatarRequest]}>
                    <Text style={styles.avatarText}>
                      {initials.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={styles.notifTitle}>
                      <Text style={styles.notifName}>
                        {item.from.first_name} {item.from.last_name}
                      </Text>{" "}
                      wants to connect
                    </Text>
                    {item.from.title && (
                      <Text style={styles.notifMeta}>{item.from.title}</Text>
                    )}
                    <Text style={styles.notifTime}>
                      {timeAgo(item.conn.created_at)}
                    </Text>
                  </View>
                  <View style={styles.dot} />
                </Pressable>
              );
            }

            if (item.kind === "connection_accepted") {
              const initials =
                (item.from.first_name?.[0] ?? "") +
                (item.from.last_name?.[0] ?? "");
              return (
                <Pressable
                  key={`ca-${item.conn.id}`}
                  onPress={() => router.push(`/member/${item.from.id}` as any)}
                  style={styles.notifRow}
                >
                  <View style={[styles.avatar, styles.avatarAccepted]}>
                    <Text style={[styles.avatarText, { color: "#4CAF50" }]}>
                      {initials.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={styles.notifTitle}>
                      <Text style={styles.notifName}>
                        {item.from.first_name} {item.from.last_name}
                      </Text>{" "}
                      accepted your connection
                    </Text>
                    <Text style={styles.notifTime}>
                      {timeAgo(item.conn.created_at)}
                    </Text>
                  </View>
                </Pressable>
              );
            }

            if (item.kind === "new_message") {
              return (
                <Pressable
                  key={`msg-${item.conv.id}`}
                  onPress={() => router.push(`/messages/${item.conv.id}`)}
                  style={styles.notifRow}
                >
                  <View style={[styles.avatar, styles.avatarMsg]}>
                    <Text style={styles.avatarText}>
                      {item.otherInitials}
                    </Text>
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={styles.notifTitle}>
                      <Text style={styles.notifName}>{item.otherName}</Text>{" "}
                      sent you a message
                    </Text>
                    {item.conv.last_message && (
                      <Text style={styles.notifMeta} numberOfLines={1}>
                        {item.conv.last_message}
                      </Text>
                    )}
                    <Text style={styles.notifTime}>
                      {timeAgo(item.conv.last_message_at)}
                    </Text>
                  </View>
                  <View style={styles.dot} />
                </Pressable>
              );
            }

            return null;
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
    gap: 16,
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
    fontSize: 20,
    fontWeight: "700",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyText: {
    color: colors.grey,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    paddingBottom: 40,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarRequest: {
    backgroundColor: "rgba(201,168,76,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(201,168,76,0.3)",
  },
  avatarAccepted: {
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(76,175,80,0.3)",
  },
  avatarMsg: {
    backgroundColor: "rgba(201,168,76,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(201,168,76,0.25)",
  },
  avatarText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "700",
  },
  notifBody: {
    flex: 1,
  },
  notifTitle: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  notifName: {
    fontWeight: "700",
  },
  notifMeta: {
    color: colors.grey,
    fontSize: 12,
    marginBottom: 2,
  },
  notifTime: {
    color: "rgba(160,160,160,0.45)",
    fontSize: 11,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    flexShrink: 0,
  },
});
