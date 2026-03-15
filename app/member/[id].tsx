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
  useWindowDimensions,
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
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Profile, Connection, Venue } from "@/lib/database.types";

const TIER_LABELS: Record<string, string> = {
  founding_member: "Founding Member",
  committee_member: "Committee Member",
  platinum_card: "Platinum Card",
  gold_card: "Gold Card",
};

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile: myProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const [member, setMember] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [visitedVenues, setVisitedVenues] = useState<Venue[]>([]);

  const HERO_HEIGHT = screenHeight * 0.56;

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
      const visitsSnap = await getDocs(
        query(collection(db, "venue_visits"), where("member_id", "==", id))
      );
      const venueIds = [...new Set(visitsSnap.docs.map((d) => d.data().venue_id as string))];
      if (venueIds.length > 0) {
        const venueDocs = await Promise.all(venueIds.map((vid) => getDoc(doc(db, "venues", vid))));
        setVisitedVenues(venueDocs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() }) as Venue));
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
  const isMasked = member.profile_visibility === "connections" && !isConnected && !isSelf;
  const tierLabel = TIER_LABELS[member.membership_tier ?? ""] ?? "";
  const showAvatar = !isMasked && !!member.avatar_url;

  return (
    <View style={styles.root}>
      {/* ── Floating back button (over hero) ── */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 12 }]}
      >
        <Ionicons name="close" size={18} color="white" />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={{ height: HERO_HEIGHT, overflow: "hidden" }}>

          {/* Image or initials fallback */}
          {showAvatar ? (
            <Image
              source={{ uri: member.avatar_url! }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroFallback]}>
              <Text style={styles.heroInitials}>{initials.toUpperCase()}</Text>
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.80)"]}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Text overlay — bottom of hero */}
          <View style={styles.heroInfo}>
            {tierLabel ? (
              <Text style={styles.heroTier}>{tierLabel.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.heroName}>
              {isMasked
                ? `${member.first_name} ${member.last_name?.[0] ?? ""}.`
                : `${member.first_name} ${member.last_name}`}
            </Text>
            {!isMasked && member.title ? (
              <Text style={styles.heroTitle}>{member.title}</Text>
            ) : isMasked ? (
              <Text style={styles.heroTitle}>HomeQuarters Member</Text>
            ) : null}

            {/* Location + industry pills */}
            {!isMasked && (member.city || member.industry) ? (
              <View style={styles.heroPills}>
                {!member.hide_city && member.city ? (
                  <View style={styles.heroPill}>
                    <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroPillText}>{member.city}</Text>
                  </View>
                ) : null}
                {!member.hide_industry && member.industry ? (
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillText}>
                      {member.industry.charAt(0).toUpperCase() + member.industry.slice(1)}
                    </Text>
                  </View>
                ) : null}
                {!member.hide_social_links && member.instagram_handle ? (
                  <View style={styles.heroPill}>
                    <Ionicons name="logo-instagram" size={10} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroPillText}>@{member.instagram_handle}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Edit button (own profile only) */}
          {isSelf && (
            <Pressable
              onPress={() => router.push("/profile")}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          )}
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>

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

          {/* Locked profile notice */}
          {isMasked && (
            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.stone} />
              <Text style={{ color: colors.stone, fontSize: 14, flex: 1, lineHeight: 20 }}>
                Connect to see this member's full profile
              </Text>
            </View>
          )}

          {/* Bio */}
          {!isMasked && member.bio ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>ABOUT</Text>
              <Text style={styles.bio}>{member.bio}</Text>
            </View>
          ) : null}

          {/* Interests */}
          {!isMasked && !member.hide_interests && member.interests && member.interests.length > 0 && (
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

          {/* Places */}
          {!isMasked && !member.hide_venue_log && (visitedVenues.length > 0 || (member.custom_places?.length ?? 0) > 0) && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>PLACES</Text>
              {visitedVenues.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -18 }}
                  contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}
                >
                  {visitedVenues.map((venue) => (
                    <Pressable
                      key={venue.id}
                      onPress={() => router.push(`/venue/${venue.id}` as any)}
                      style={styles.venueChip}
                    >
                      {venue.logo_url ? (
                        <Image source={{ uri: venue.logo_url }} style={styles.venueChipLogo} />
                      ) : null}
                      <Text style={styles.venueChipText}>{venue.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {(member.custom_places?.length ?? 0) > 0 && (
                <View style={[styles.tags, visitedVenues.length > 0 ? { marginTop: 12 } : {}]}>
                  {member.custom_places!.map((place) => (
                    <View key={place} style={styles.tag}>
                      <Text style={styles.tagText}>{place}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Social */}
          {!isMasked && !member.hide_social_links && (member.instagram_handle || member.linkedin_handle) && (
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

        </View>
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

  // Floating back button
  backBtn: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Hero fallback (no avatar)
  heroFallback: {
    backgroundColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  heroInitials: {
    color: colors.gold,
    fontSize: 72,
    fontFamily: fonts.display,
    letterSpacing: 4,
    opacity: 0.9,
  },

  // Hero text overlay
  heroInfo: {
    position: "absolute",
    bottom: 24,
    left: 22,
    right: 22,
  },
  heroTier: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: fonts.display,
    letterSpacing: -0.3,
    lineHeight: 32,
    marginBottom: 4,
  },
  heroTitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontFamily: fonts.medium,
    marginBottom: 10,
  },
  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontFamily: fonts.medium,
  },

  // Edit button (own profile)
  editBtn: {
    position: "absolute",
    bottom: 24,
    right: 22,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  editBtnText: {
    color: colors.dark,
    fontSize: 14,
    fontFamily: fonts.bold,
  },

  // Content area below hero
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 56,
  },

  // Action buttons
  actions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
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
    fontFamily: fonts.bold,
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
    fontFamily: fonts.bold,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  bio: {
    color: colors.dark,
    fontSize: 14,
    fontFamily: fonts.body,
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
    fontFamily: fonts.medium,
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
    fontFamily: fonts.medium,
  },
  venueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  venueChipLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  venueChipText: {
    color: colors.dark,
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  // Member code
  code: {
    color: colors.stone,
    fontSize: 11,
    letterSpacing: 3,
    fontFamily: fonts.medium,
    marginTop: 12,
    textAlign: "center",
    opacity: 0.5,
  },
});
