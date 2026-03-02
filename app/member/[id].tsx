import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { Profile, Connection } from "@/lib/database.types";

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile: myProfile } = useAuth();
  const router = useRouter();

  const [member, setMember] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "profiles", id));
      if (snap.exists()) {
        setMember({ id: snap.id, ...snap.data() } as Profile);
      }

      if (user?.uid) {
        const q = query(
          collection(db, "connections"),
          where("from_id", "==", user.uid),
          where("to_id", "==", id)
        );
        const cSnap = await getDocs(q);
        if (!cSnap.empty) {
          setConnection({ id: cSnap.docs[0].id, ...cSnap.docs[0].data() } as Connection);
        }
      }
      setLoading(false);
    };

    load();
  }, [id, user?.uid]);

  const handleConnect = async () => {
    if (!user?.uid || !member) return;
    setActionLoading(true);
    try {
      if (connection) {
        await deleteDoc(doc(db, "connections", connection.id));
        setConnection(null);
      } else {
        const ref = await addDoc(collection(db, "connections"), {
          from_id: user.uid,
          to_id: member.id,
          status: "pending",
          created_at: new Date().toISOString(),
        });
        setConnection({
          id: ref.id,
          from_id: user.uid,
          to_id: member.id,
          status: "pending",
          created_at: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!user?.uid || !myProfile || !member) return;
    setActionLoading(true);
    try {
      const convQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", user.uid)
      );
      const convSnap = await getDocs(convQuery);
      const existing = convSnap.docs.find((d) =>
        (d.data().participants as string[]).includes(member.id)
      );

      if (existing) {
        router.push(`/messages/${existing.id}`);
        return;
      }

      const myInitials =
        (myProfile.first_name?.[0] ?? "") + (myProfile.last_name?.[0] ?? "");
      const theirInitials =
        (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");

      const ref = await addDoc(collection(db, "conversations"), {
        participants: [user.uid, member.id],
        participant_names: {
          [user.uid]: `${myProfile.first_name} ${myProfile.last_name}`,
          [member.id]: `${member.first_name} ${member.last_name}`,
        },
        participant_initials: {
          [user.uid]: myInitials.toUpperCase(),
          [member.id]: theirInitials.toUpperCase(),
        },
        last_message: "",
        last_message_at: "",
        last_sender_id: "",
        created_at: new Date().toISOString(),
      });

      router.push(`/messages/${ref.id}`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: colors.grey }}>Member not found.</Text>
      </View>
    );
  }

  const initials =
    (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");
  const isConnected = connection?.status === "accepted";
  const isPending = connection?.status === "pending";

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={20} color={colors.white} />
      </Pressable>

      {/* Hero */}
      <View style={styles.hero}>
        {member.avatar_url ? (
          <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
          </View>
        )}

        <Text style={styles.name}>
          {member.first_name} {member.last_name}
        </Text>
        {member.title && (
          <Text style={styles.title}>{member.title}</Text>
        )}
        <View style={styles.metaRow}>
          {member.city && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={colors.grey} />
              <Text style={styles.metaText}>{member.city}</Text>
            </View>
          )}
          {member.industry && (
            <View style={styles.metaItem}>
              <Ionicons name="briefcase-outline" size={12} color={colors.gold} />
              <Text style={[styles.metaText, { color: colors.gold }]}>
                {member.industry.charAt(0).toUpperCase() + member.industry.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action buttons */}
      {user?.uid !== member.id && (
        <View style={styles.actions}>
          <Pressable
            onPress={handleConnect}
            disabled={actionLoading}
            style={[
              styles.actionBtn,
              isConnected
                ? styles.actionBtnConnected
                : isPending
                ? styles.actionBtnPending
                : styles.actionBtnDefault,
            ]}
          >
            <Ionicons
              name={
                isConnected
                  ? "checkmark-circle"
                  : isPending
                  ? "time-outline"
                  : "person-add-outline"
              }
              size={16}
              color={
                isConnected ? "#4CAF50" : isPending ? colors.grey : colors.gold
              }
            />
            <Text
              style={[
                styles.actionBtnText,
                {
                  color: isConnected
                    ? "#4CAF50"
                    : isPending
                    ? colors.grey
                    : colors.gold,
                },
              ]}
            >
              {isConnected ? "Connected" : isPending ? "Pending" : "Connect"}
            </Text>
          </Pressable>

          {isConnected && (
            <Pressable
              onPress={handleMessage}
              disabled={actionLoading}
              style={[styles.actionBtn, styles.actionBtnMsg]}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.black} />
              <Text style={[styles.actionBtnText, { color: colors.black }]}>
                Message
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Bio */}
      {member.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{member.bio}</Text>
        </View>
      ) : null}

      {/* Interests */}
      {member.interests && member.interests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tags}>
            {member.interests.map((interest) => (
              <View key={interest} style={styles.tag}>
                <Text style={styles.tagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Member code */}
      <View style={styles.codeRow}>
        <Text style={styles.codeLabel}>MEMBER CODE</Text>
        <Text style={styles.code}>{member.member_code}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    paddingBottom: 60,
  },
  loader: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 44,
    left: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 110 : 90,
    paddingBottom: 28,
    paddingHorizontal: 28,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: colors.gold,
    marginBottom: 16,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(201,168,76,0.12)",
    borderWidth: 2.5,
    borderColor: colors.gold,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 2,
  },
  name: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  title: {
    color: colors.grey,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: colors.grey,
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
  },
  actionBtnDefault: {
    backgroundColor: "rgba(201,168,76,0.08)",
    borderColor: "rgba(201,168,76,0.25)",
  },
  actionBtnConnected: {
    backgroundColor: "rgba(76,175,80,0.08)",
    borderColor: "rgba(76,175,80,0.25)",
  },
  actionBtnPending: {
    backgroundColor: "rgba(160,160,160,0.06)",
    borderColor: "rgba(160,160,160,0.2)",
  },
  actionBtnMsg: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  bio: {
    color: "rgba(160,160,160,0.85)",
    fontSize: 14,
    lineHeight: 22,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "rgba(160,160,160,0.08)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(160,160,160,0.15)",
  },
  tagText: {
    color: colors.grey,
    fontSize: 13,
    fontWeight: "500",
  },
  codeRow: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  codeLabel: {
    color: "rgba(160,160,160,0.35)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 6,
  },
  code: {
    color: "rgba(160,160,160,0.35)",
    fontSize: 13,
    letterSpacing: 3,
  },
});
