import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Linking,
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import * as Haptics from "expo-haptics";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { Profile, Connection } from "@/lib/database.types";

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile: myProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!user?.uid || !myProfile || !member) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      const myInitials = (myProfile.first_name?.[0] ?? "") + (myProfile.last_name?.[0] ?? "");
      const theirInitials = (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");
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
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.stone} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: colors.stone, fontSize: 14 }}>Member not found.</Text>
      </View>
    );
  }

  const initials = (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");
  const isConnected = connection?.status === "accepted";
  const isPending = connection?.status === "pending";
  const isSelf = user?.uid === member.id;

  return (
    <View style={styles.root}>
      {/* Nav */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {member.avatar_url ? (
            <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Name & title */}
        <Text style={styles.name}>{member.first_name} {member.last_name}</Text>
        {member.title ? (
          <Text style={styles.title}>{member.title}</Text>
        ) : null}

        {/* Meta chips — location + industry */}
        {(member.city || member.industry) ? (
          <View style={styles.chips}>
            {member.city ? (
              <View style={styles.chip}>
                <Ionicons name="location-outline" size={12} color={colors.stone} />
                <Text style={styles.chipText}>{member.city}</Text>
              </View>
            ) : null}
            {member.industry ? (
              <View style={styles.chip}>
                <Ionicons name="briefcase-outline" size={12} color={colors.stone} />
                <Text style={styles.chipText}>
                  {member.industry.charAt(0).toUpperCase() + member.industry.slice(1)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Action buttons */}
        {!isSelf && (
          <View style={styles.actions}>
            <Pressable
              onPress={handleConnect}
              disabled={actionLoading}
              style={[
                styles.actionBtn,
                isConnected
                  ? styles.connectedBtn
                  : isPending
                  ? styles.pendingBtn
                  : styles.connectBtn,
              ]}
            >
              <Ionicons
                name={isConnected ? "checkmark-circle" : isPending ? "time-outline" : "person-add-outline"}
                size={16}
                color={isConnected ? colors.green : isPending ? colors.stone : colors.white}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isConnected ? colors.green : isPending ? colors.stone : colors.white },
                ]}
              >
                {isConnected ? "Connected" : isPending ? "Pending" : "Connect"}
              </Text>
            </Pressable>

            {isConnected && (
              <Pressable
                onPress={handleMessage}
                disabled={actionLoading}
                style={[styles.actionBtn, styles.messageBtn]}
              >
                <Ionicons name="chatbubble-outline" size={16} color={colors.dark} />
                <Text style={[styles.actionBtnText, { color: colors.dark }]}>Message</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Bio */}
        {member.bio ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ABOUT</Text>
            <Text style={styles.bio}>{member.bio}</Text>
          </View>
        ) : null}

        {/* Interests */}
        {member.interests && member.interests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>INTERESTS</Text>
            <View style={styles.tags}>
              {member.interests.map((interest) => (
                <View key={interest} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Social */}
        {(member.instagram_handle || member.linkedin_handle) && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>FIND ME ONLINE</Text>
            {member.instagram_handle ? (
              <Pressable
                onPress={() => Linking.openURL(`https://instagram.com/${member.instagram_handle}`)}
                style={styles.socialRow}
              >
                <View style={[styles.socialIcon, { backgroundColor: "rgba(225,48,108,0.1)" }]}>
                  <Ionicons name="logo-instagram" size={17} color="#E1306C" />
                </View>
                <Text style={styles.socialHandle}>@{member.instagram_handle}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.stone} style={{ marginLeft: "auto" }} />
              </Pressable>
            ) : null}
            {member.linkedin_handle ? (
              <Pressable
                onPress={() => {
                  const url = member.linkedin_handle!.startsWith("http")
                    ? member.linkedin_handle!
                    : `https://linkedin.com/in/${member.linkedin_handle}`;
                  Linking.openURL(url);
                }}
                style={[styles.socialRow, { borderBottomWidth: 0 }]}
              >
                <View style={[styles.socialIcon, { backgroundColor: "rgba(0,119,181,0.1)" }]}>
                  <Ionicons name="logo-linkedin" size={17} color="#0077B5" />
                </View>
                <Text style={styles.socialHandle}>
                  {member.linkedin_handle!.startsWith("http")
                    ? (member.linkedin_handle!.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, "").replace(/\/$/, "") || "LinkedIn Profile")
                    : member.linkedin_handle}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.stone} style={{ marginLeft: "auto" }} />
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Member code */}
        <Text style={styles.code}>{member.member_code}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loader: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sand,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    alignItems: "center",
  },

  // Avatar
  avatarWrap: {
    marginTop: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.border,
  },
  avatarFallback: {
    backgroundColor: colors.sand,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: colors.dark,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Name
  name: {
    color: colors.dark,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 6,
  },
  title: {
    color: colors.stone,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 14,
  },

  // Chips
  chips: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.stone,
    fontSize: 12,
    fontWeight: "500",
  },

  // Action buttons
  actions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 100,
    paddingVertical: 13,
    borderWidth: 1,
  },
  connectBtn: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  connectedBtn: {
    backgroundColor: "rgba(76,175,80,0.08)",
    borderColor: "rgba(76,175,80,0.25)",
  },
  pendingBtn: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  messageBtn: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Cards
  card: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 12,
  },
  cardLabel: {
    color: colors.stone,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  bio: {
    color: colors.dark,
    fontSize: 14,
    lineHeight: 22,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: colors.sand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.stone,
    fontSize: 13,
    fontWeight: "500",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  socialIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  socialHandle: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "500",
  },

  // Member code
  code: {
    color: colors.stone,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: "500",
    marginTop: 12,
    opacity: 0.5,
  },
});
