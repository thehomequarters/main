import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import * as Haptics from "expo-haptics";
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { Profile, Connection, Venue, Recommendation } from "@/lib/database.types";
import { RecommendationCard } from "@/components/RecommendationCard";

// ── Button press helpers ──────────────────────────────────────────────────────

function pressIn(anim: Animated.Value) {
  Animated.spring(anim, {
    toValue: 0.95,
    tension: 280,
    friction: 12,
    useNativeDriver: true,
  }).start();
}

function pressOut(anim: Animated.Value) {
  Animated.spring(anim, {
    toValue: 1,
    tension: 200,
    friction: 9,
    useNativeDriver: true,
  }).start();
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile: myProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [member, setMember] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [visitedVenues, setVisitedVenues] = useState<Venue[]>([]);
  const [memberRecs, setMemberRecs] = useState<Recommendation[]>([]);

  // ── Animation values ──────────────────────────────────────────────────────

  // Group 1 — avatar
  const avatarOpacity  = useRef(new Animated.Value(0)).current;
  const avatarScale    = useRef(new Animated.Value(0.84)).current;

  // Group 2 — name + title + badge
  const nameOpacity    = useRef(new Animated.Value(0)).current;
  const nameTranslate  = useRef(new Animated.Value(12)).current;

  // Group 3 — meta + bio + stats + locked
  const detailOpacity  = useRef(new Animated.Value(0)).current;
  const detailTranslate = useRef(new Animated.Value(10)).current;

  // Group 4 — action buttons
  const actionsOpacity = useRef(new Animated.Value(0)).current;

  // Group 5 — divider + content sections
  const sectionsOpacity   = useRef(new Animated.Value(0)).current;
  const sectionsTranslate = useRef(new Animated.Value(16)).current;

  // Elevated member: breathing gold halo behind avatar
  const ringPulse = useRef(new Animated.Value(0.15)).current;

  // CTA button press scales
  const connectScale = useRef(new Animated.Value(1)).current;
  const messageScale = useRef(new Animated.Value(1)).current;

  // ── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
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
        const [visitsSnap, recsSnap] = await Promise.all([
          getDocs(query(collection(db, "venue_visits"), where("member_id", "==", id))),
          getDocs(query(collection(db, "recommendations"), where("author_id", "==", id), orderBy("created_at", "desc"))),
        ]);
        setMemberRecs(recsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Recommendation));
        const venueIds = [...new Set(visitsSnap.docs.map((d: any) => d.data().venue_id as string))];
        if (venueIds.length > 0) {
          const venueDocs = await Promise.all(venueIds.map((vid) => getDoc(doc(db, "venues", vid))));
          setVisitedVenues(venueDocs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() }) as Venue));
        }
      } catch (e) {
        console.warn("loadMember:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user?.uid]);

  // ── Mount animation — staggered reveal ───────────────────────────────────

  useEffect(() => {
    if (loading || !member) return;

    Animated.parallel([
      // Avatar: spring scale + fade
      Animated.spring(avatarScale, {
        toValue: 1,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(avatarOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      // Name row: fade + rise
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 440,
        delay: 110,
        useNativeDriver: true,
      }),
      Animated.timing(nameTranslate, {
        toValue: 0,
        duration: 440,
        delay: 110,
        useNativeDriver: true,
      }),
      // Detail block: fade + rise
      Animated.timing(detailOpacity, {
        toValue: 1,
        duration: 440,
        delay: 230,
        useNativeDriver: true,
      }),
      Animated.timing(detailTranslate, {
        toValue: 0,
        duration: 440,
        delay: 230,
        useNativeDriver: true,
      }),
      // Action buttons: fade
      Animated.timing(actionsOpacity, {
        toValue: 1,
        duration: 400,
        delay: 370,
        useNativeDriver: true,
      }),
      // Sections: fade + rise
      Animated.timing(sectionsOpacity, {
        toValue: 1,
        duration: 500,
        delay: 530,
        useNativeDriver: true,
      }),
      Animated.timing(sectionsTranslate, {
        toValue: 0,
        duration: 500,
        delay: 530,
        useNativeDriver: true,
      }),
    ]).start();

    // Gold halo pulse for founding / committee members
    const elevated =
      member.membership_tier === "founding_member" ||
      member.membership_tier === "committee_member";

    if (elevated) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(ringPulse, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(ringPulse, {
            toValue: 0.15,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [loading, member]);

  // ── Actions ───────────────────────────────────────────────────────────────

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

  // ── Guards ────────────────────────────────────────────────────────────────

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

  const initials    = (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");
  const isConnected = connection?.status === "accepted";
  const isPending   = connection?.status === "pending";
  const isSelf      = user?.uid === member.id;
  const isMasked    = member.profile_visibility === "connections" && !isConnected && !isSelf;
  const isElevated  = member.membership_tier === "founding_member" || member.membership_tier === "committee_member";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>

      {/* Floating back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={18} color={colors.dark} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <View style={styles.hero}>

          {/* Avatar with optional halo ring */}
          <View style={styles.avatarContainer}>

            {/* Breathing gold halo — only visible for elevated members */}
            {isElevated && (
              <Animated.View style={[styles.avatarHalo, { opacity: ringPulse }]} />
            )}

            {/* Avatar ring */}
            <Animated.View
              style={[
                styles.avatarRing,
                isElevated && styles.avatarRingGold,
                { opacity: avatarOpacity, transform: [{ scale: avatarScale }] },
              ]}
            >
              {!isMasked && member.avatar_url ? (
                <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials.toUpperCase()}</Text>
                </View>
              )}
            </Animated.View>
          </View>

          {/* Name + committee badge */}
          <Animated.View
            style={[
              styles.nameRow,
              { opacity: nameOpacity, transform: [{ translateY: nameTranslate }] },
            ]}
          >
            <Text style={styles.name}>
              {isMasked
                ? `${member.first_name} ${member.last_name?.[0] ?? ""}.`
                : `${member.first_name} ${member.last_name}`}
            </Text>
            {!isMasked && member.membership_tier === "committee_member" && (
              <Ionicons name="checkmark-circle" size={22} color="#4F8EF7" />
            )}
          </Animated.View>

          {/* Title + role badge — same animation group as name */}
          <Animated.View
            style={[
              styles.nameSub,
              { opacity: nameOpacity, transform: [{ translateY: nameTranslate }] },
            ]}
          >
            {!isMasked && member.title ? (
              <Text style={styles.title}>{member.title}</Text>
            ) : isMasked ? (
              <Text style={styles.title}>HQ Member</Text>
            ) : null}

            {!isMasked && isElevated && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {member.membership_tier === "founding_member" ? "Founding Member" : "Committee Member"}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Meta + bio + stats + locked */}
          <Animated.View
            style={[
              styles.detailBlock,
              { opacity: detailOpacity, transform: [{ translateY: detailTranslate }] },
            ]}
          >
            {!isMasked && (member.city || member.industry) && (
              <View style={styles.metaRow}>
                {member.city && !member.hide_city && (
                  <Text style={styles.metaText}>
                    <Ionicons name="location-outline" size={11} color={colors.stone} />{" "}
                    {member.city}
                  </Text>
                )}
                {member.city && !member.hide_city && member.industry && !member.hide_industry && (
                  <Text style={styles.metaDot}>·</Text>
                )}
                {member.industry && !member.hide_industry && (
                  <Text style={styles.metaText}>
                    {member.industry.charAt(0).toUpperCase() + member.industry.slice(1)}
                  </Text>
                )}
              </View>
            )}

            {!isMasked && member.bio ? (
              <Text style={styles.bio}>{member.bio}</Text>
            ) : null}

            {!isMasked && memberRecs.length > 0 && (
              <View style={styles.statsRow}>
                <Text style={styles.statNum}>{memberRecs.length}</Text>
                <Text style={styles.statLabel}>
                  {memberRecs.length === 1 ? "recommendation" : "recommendations"}
                </Text>
              </View>
            )}

            {isMasked && (
              <View style={styles.lockedRow}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.stone} />
                <Text style={styles.lockedText}>
                  Connect to see this member's full profile
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Action buttons */}
          {!isSelf && (
            <Animated.View style={[styles.actions, { opacity: actionsOpacity }]}>

              <Animated.View style={[styles.actionBtnWrap, { transform: [{ scale: connectScale }] }]}>
                <Pressable
                  onPress={handleConnect}
                  onPressIn={() => pressIn(connectScale)}
                  onPressOut={() => pressOut(connectScale)}
                  disabled={actionLoading}
                  style={[
                    styles.actionBtn,
                    isConnected ? styles.btnConnected : isPending ? styles.btnPending : styles.btnConnect,
                  ]}
                >
                  <Ionicons
                    name={isConnected ? "checkmark-circle" : isPending ? "time-outline" : "person-add-outline"}
                    size={15}
                    color={isConnected ? colors.green : isPending ? colors.stone : colors.white}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      {
                        color: isConnected
                          ? colors.green
                          : isPending
                          ? colors.stone
                          : colors.white,
                      },
                    ]}
                  >
                    {isConnected ? "Connected" : isPending ? "Request sent" : "Connect"}
                  </Text>
                </Pressable>
              </Animated.View>

              {isConnected && (
                <Animated.View style={[styles.actionBtnWrap, { transform: [{ scale: messageScale }] }]}>
                  <Pressable
                    onPress={handleMessage}
                    onPressIn={() => pressIn(messageScale)}
                    onPressOut={() => pressOut(messageScale)}
                    disabled={actionLoading}
                    style={[styles.actionBtn, styles.btnMessage]}
                  >
                    <Ionicons name="chatbubble-outline" size={15} color={colors.dark} />
                    <Text style={[styles.actionBtnText, { color: colors.dark }]}>Message</Text>
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <Animated.View style={[styles.divider, { opacity: sectionsOpacity }]} />

        {/* ── Content sections ──────────────────────────────────────────── */}
        <Animated.View
          style={{
            width: "100%",
            opacity: sectionsOpacity,
            transform: [{ translateY: sectionsTranslate }],
          }}
        >

          {/* Interests — pressable tags with haptic */}
          {!isMasked && !member.hide_interests && (member.interests?.length ?? 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Interests</Text>
              <View style={styles.tags}>
                {member.interests!.map((interest) => (
                  <Pressable
                    key={interest}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    style={({ pressed }) => [styles.tag, pressed && styles.tagPressed]}
                  >
                    <Text style={styles.tagText}>{interest}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* My HQ */}
          {!isMasked && member.favourite_hq_venue && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>My HQ</Text>
              <Text style={styles.hqVenue}>{member.favourite_hq_venue}</Text>
            </View>
          )}

          {/* Places — venue chips with haptic */}
          {!isMasked &&
            !member.hide_venue_log &&
            (visitedVenues.length > 0 || (member.custom_places?.length ?? 0) > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Places</Text>

                {visitedVenues.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                  >
                    {visitedVenues.map((venue) => (
                      <Pressable
                        key={venue.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/venue/${venue.id}` as any);
                        }}
                        style={({ pressed }) => [styles.venueChip, pressed && styles.venueChipPressed]}
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

          {/* Recommendations */}
          {!isMasked && memberRecs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>Recommendations</Text>
                <View style={styles.recBadge}>
                  <Text style={styles.recBadgeText}>{memberRecs.length}</Text>
                </View>
              </View>
              {memberRecs.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  showVenue
                  onPress={() => router.push(`/venue/${rec.venue_id}` as any)}
                />
              ))}
            </View>
          )}

          {/* Social links — haptic + icon tiles */}
          {!isMasked &&
            !member.hide_social_links &&
            (member.instagram_handle || member.linkedin_handle) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Online</Text>

                {member.instagram_handle && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL(`https://instagram.com/${member.instagram_handle}`);
                    }}
                    style={({ pressed }) => [styles.socialRow, pressed && styles.socialRowPressed]}
                  >
                    <View style={styles.socialIconWrap}>
                      <Ionicons name="logo-instagram" size={16} color="#C13584" />
                    </View>
                    <Text style={styles.socialHandle}>@{member.instagram_handle}</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={13}
                      color={colors.stone}
                      style={{ marginLeft: "auto" }}
                    />
                  </Pressable>
                )}

                {member.linkedin_handle && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const url = member.linkedin_handle!.startsWith("http")
                        ? member.linkedin_handle!
                        : `https://linkedin.com/in/${member.linkedin_handle}`;
                      Linking.openURL(url);
                    }}
                    style={({ pressed }) => [
                      styles.socialRow,
                      styles.socialRowLast,
                      pressed && styles.socialRowPressed,
                    ]}
                  >
                    <View style={styles.socialIconWrap}>
                      <Ionicons name="logo-linkedin" size={16} color="#0A66C2" />
                    </View>
                    <Text style={styles.socialHandle}>
                      {member.linkedin_handle!.startsWith("http")
                        ? member.linkedin_handle!
                            .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, "")
                            .replace(/\/$/, "") || "LinkedIn"
                        : member.linkedin_handle}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={13}
                      color={colors.stone}
                      style={{ marginLeft: "auto" }}
                    />
                  </Pressable>
                )}
              </View>
            )}

        </Animated.View>

        {/* Member code — subtle signature at the bottom */}
        <Animated.Text style={[styles.code, { opacity: sectionsOpacity }]}>
          {member.member_code}
        </Animated.Text>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  // ── Back button — floating ────────────────────────────────────────────────
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },

  scroll: {
    paddingTop: Platform.OS === "ios" ? 110 : 96,
    paddingBottom: 56,
    alignItems: "center",
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // Avatar
  avatarContainer: {
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatarHalo: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: "rgba(201,168,76,0.18)",
  },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 5,
    overflow: "hidden",
  },
  avatarRingGold: {
    borderColor: colors.gold,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
  },
  avatarFallback: {
    backgroundColor: colors.sand,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    color: colors.dark,
    fontSize: 44,
    fontFamily: fonts.display,
    letterSpacing: 1,
  },

  // Name
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: colors.ink,
    fontSize: 36,
    fontFamily: fonts.display,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  nameSub: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    color: colors.stone,
    fontSize: 14,
    fontFamily: fonts.medium,
    textAlign: "center",
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: "center",
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.30)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 14,
  },
  roleBadgeText: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Detail block
  detailBlock: {
    alignItems: "center",
    width: "100%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  metaText: {
    color: colors.stone,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  metaDot: {
    color: colors.border,
    fontSize: 13,
  },
  bio: {
    color: colors.dark,
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    marginBottom: 24,
  },
  statNum: {
    color: colors.dark,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  statLabel: {
    color: colors.stone,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedText: {
    color: colors.stone,
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  // Action buttons
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  actionBtnWrap: {
    flex: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 100,
    paddingVertical: 14,
    borderWidth: 1,
  },
  btnConnect: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  btnConnected: {
    backgroundColor: "rgba(46,125,50,0.07)",
    borderColor: "rgba(46,125,50,0.20)",
  },
  btnPending: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  btnMessage: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 8,
  },

  // ── Content sections ──────────────────────────────────────────────────────
  section: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionLabel: {
    color: colors.stone,
    fontSize: 11,
    fontFamily: fonts.semibold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  recBadge: {
    backgroundColor: colors.goldLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  recBadgeText: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.bold,
  },

  // Tags
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  tagPressed: {
    opacity: 0.65,
    backgroundColor: colors.sand,
  },

  tagText: {
    color: colors.dark,
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  // My HQ
  hqVenue: {
    color: colors.dark,
    fontSize: 20,
    fontFamily: fonts.display,
    letterSpacing: 0.2,
  },

  // Venue chips
  venueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  venueChipPressed: {
    opacity: 0.65,
    backgroundColor: colors.sand,
  },
  venueChipLogo: {
    width: 22,
    height: 22,
    borderRadius: 5,
  },
  venueChipText: {
    color: colors.dark,
    fontSize: 13,
    fontFamily: fonts.medium,
  },

  // Social rows
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  socialRowLast: {
    borderBottomWidth: 0,
  },
  socialRowPressed: {
    opacity: 0.65,
  },
  socialIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  socialHandle: {
    color: colors.dark,
    fontSize: 14,
    fontFamily: fonts.medium,
  },

  // Member code
  code: {
    color: colors.stone,
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: fonts.medium,
    marginTop: 24,
    opacity: 0.4,
  },
});
