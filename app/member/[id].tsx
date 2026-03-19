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
  Dimensions,
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

const SCREEN_WIDTH = Dimensions.get("window").width;

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
  const [recVenues, setRecVenues] = useState<Record<string, Venue>>({});

  // ── Animation values ──────────────────────────────────────────────────────

  const heroOpacity    = useRef(new Animated.Value(0)).current;
  const heroScale      = useRef(new Animated.Value(1.04)).current;

  const nameOpacity    = useRef(new Animated.Value(0)).current;
  const nameTranslate  = useRef(new Animated.Value(12)).current;

  const detailOpacity  = useRef(new Animated.Value(0)).current;
  const detailTranslate = useRef(new Animated.Value(10)).current;

  const actionsOpacity = useRef(new Animated.Value(0)).current;

  const sectionsOpacity   = useRef(new Animated.Value(0)).current;
  const sectionsTranslate = useRef(new Animated.Value(16)).current;

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
        // Fetch venue visits and recommendations separately so one failure doesn't block the other
        try {
          const [visitsSnap, recsSnap] = await Promise.all([
            getDocs(query(collection(db, "venue_visits"), where("member_id", "==", id))),
            getDocs(query(collection(db, "recommendations"), where("author_id", "==", id), orderBy("created_at", "desc"))),
          ]);
          const recs = recsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Recommendation);
          setMemberRecs(recs);
          const visitVenueIds = [...new Set(visitsSnap.docs.map((d: any) => d.data().venue_id as string))];
          const recVenueIds = [...new Set(recs.map((r) => r.venue_id))];
          const allVenueIds = [...new Set([...visitVenueIds, ...recVenueIds])];
          if (allVenueIds.length > 0) {
            const venueDocs = await Promise.all(allVenueIds.map((vid) => getDoc(doc(db, "venues", vid))));
            const allVenues = venueDocs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() }) as Venue);
            setVisitedVenues(allVenues.filter((v) => visitVenueIds.includes(v.id)));
            const venueMap: Record<string, Venue> = {};
            allVenues.forEach((v) => { venueMap[v.id] = v; });
            setRecVenues(venueMap);
          }
        } catch {
          // Silently fail for recs/venues — not critical
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
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
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
      Animated.timing(actionsOpacity, {
        toValue: 1,
        duration: 400,
        delay: 370,
        useNativeDriver: true,
      }),
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/discover" as any);
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

  // ── Unified feed items (visited venues + recommendations merged by venue) ──
  const feedItemsMap = new Map<string, {
    venueId: string;
    venueName: string;
    imageUri: string | null;
    isVisited: boolean;
    isRecommended: boolean;
  }>();
  visitedVenues.forEach((venue) => {
    feedItemsMap.set(venue.id, {
      venueId: venue.id,
      venueName: venue.name,
      imageUri: venue.image_url ?? venue.image_urls?.[0] ?? null,
      isVisited: true,
      isRecommended: false,
    });
  });
  memberRecs.forEach((rec) => {
    const venue = recVenues[rec.venue_id];
    const imageUri = venue?.image_url ?? venue?.image_urls?.[0] ?? null;
    if (feedItemsMap.has(rec.venue_id)) {
      feedItemsMap.get(rec.venue_id)!.isRecommended = true;
    } else {
      feedItemsMap.set(rec.venue_id, {
        venueId: rec.venue_id,
        venueName: rec.venue_name,
        imageUri,
        isVisited: false,
        isRecommended: true,
      });
    }
  });
  const feedItems = Array.from(feedItemsMap.values());

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero photo — full width square ───────────────────────────── */}
        <View style={styles.heroContainer}>
          <Animated.View style={[styles.heroImageWrap, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
            {!isMasked && member.avatar_url ? (
              <Image
                source={{ uri: member.avatar_url }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.heroFallback]}>
                <Text style={styles.heroInitials}>{initials.toUpperCase()}</Text>
              </View>
            )}
          </Animated.View>

          {/* Floating back button over the hero */}
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={colors.dark} />
          </Pressable>
        </View>

        {/* ── Profile info ─────────────────────────────────────────────── */}
        <View style={styles.infoBlock}>

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
              <Ionicons name="checkmark-circle" size={22} color="#4F8EF7" style={{ marginTop: 6 }} />
            )}
          </Animated.View>

          {/* Title + role badge */}
          <Animated.View
            style={[
              styles.nameSub,
              { opacity: nameOpacity, transform: [{ translateY: nameTranslate }] },
            ]}
          >
            {!isMasked && member.title ? (
              <Text style={styles.titleText}>{member.title}</Text>
            ) : isMasked ? (
              <Text style={styles.titleText}>HQ Member</Text>
            ) : null}

            {!isMasked && isElevated && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {member.membership_tier === "founding_member" ? "Founding Member" : "Committee Member"}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Meta + bio + locked */}
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

          {/* Interests */}
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

          {/* ── Places & Recommendations — unified Instagram-style grid ── */}
          {!isMasked &&
            !member.hide_venue_log &&
            (feedItems.length > 0 || (member.custom_places?.length ?? 0) > 0) && (
              <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>Places</Text>
                  {feedItems.length > 0 && (
                    <View style={styles.recBadge}>
                      <Text style={styles.recBadgeText}>{feedItems.length}</Text>
                    </View>
                  )}
                </View>

                {feedItems.length > 0 && (
                  <View style={styles.feedGrid}>
                    {feedItems.map((item) => (
                      <Pressable
                        key={item.venueId}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/venue/${item.venueId}` as any);
                        }}
                        style={({ pressed }) => [styles.feedCell, pressed && { opacity: 0.82 }]}
                      >
                        {item.imageUri ? (
                          <Image
                            source={{ uri: item.imageUri }}
                            style={styles.feedCellImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.feedCellImage, styles.feedCellPlaceholder]}>
                            <Ionicons name="storefront-outline" size={24} color={colors.stone} />
                          </View>
                        )}

                        {/* Bottom gradient label */}
                        <View style={styles.feedCellOverlay}>
                          <Text style={styles.feedCellName} numberOfLines={2}>
                            {item.venueName}
                          </Text>
                        </View>

                        {/* Top-right badges */}
                        <View style={styles.feedCellBadges}>
                          {item.isVisited && (
                            <View style={styles.feedBadge}>
                              <Ionicons name="location" size={9} color="#fff" />
                            </View>
                          )}
                          {item.isRecommended && (
                            <View style={[styles.feedBadge, styles.feedBadgeRec]}>
                              <Ionicons name="star" size={9} color="#fff" />
                            </View>
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Custom (non-HQ) places as tags below the grid */}
                {(member.custom_places?.length ?? 0) > 0 && (
                  <View style={[styles.tags, feedItems.length > 0 ? { marginTop: 14 } : {}]}>
                    {member.custom_places!.map((place) => (
                      <View key={place} style={styles.tag}>
                        <Text style={styles.tagText}>{place}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

          {/* Online links — no branded icons */}
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
                      <Ionicons name="link-outline" size={15} color={colors.stone} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatform}>Instagram</Text>
                      <Text style={styles.socialHandle}>@{member.instagram_handle}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={13} color={colors.stone} />
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
                      <Ionicons name="link-outline" size={15} color={colors.stone} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.socialPlatform}>LinkedIn</Text>
                      <Text style={styles.socialHandle}>
                        {member.linkedin_handle!.startsWith("http")
                          ? member.linkedin_handle!
                              .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, "")
                              .replace(/\/$/, "") || "LinkedIn"
                          : member.linkedin_handle}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={13} color={colors.stone} />
                  </Pressable>
                )}
              </View>
            )}

        </Animated.View>

        {/* Member code */}
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

  scroll: {
    paddingBottom: 56,
    alignItems: "center",
  },

  // ── Hero image — full width square ────────────────────────────────────────
  heroContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH, // square
    position: "relative",
    backgroundColor: colors.sand,
  },
  heroImageWrap: {
    width: "100%",
    height: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    backgroundColor: colors.sand,
    justifyContent: "center",
    alignItems: "center",
  },
  heroInitials: {
    color: colors.dark,
    fontSize: 80,
    fontFamily: fonts.display,
    letterSpacing: 2,
    opacity: 0.4,
  },

  // ── Back button — floats over hero ────────────────────────────────────────
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // ── Profile info block ────────────────────────────────────────────────────
  infoBlock: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "flex-start",
  },

  // Name
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: colors.ink,
    fontSize: 32,
    fontFamily: fonts.display,
    letterSpacing: 0.3,
    flex: 1,
  },
  nameSub: {
    width: "100%",
  },
  titleText: {
    color: colors.stone,
    fontSize: 14,
    fontFamily: fonts.medium,
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: "flex-start",
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
    width: "100%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    marginBottom: 20,
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
    marginBottom: 20,
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
    marginTop: 4,
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

  // ── Instagram-style places & recs feed grid ───────────────────────────────
  feedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    marginHorizontal: -2,
  },
  feedCell: {
    width: (SCREEN_WIDTH - 40 - 4) / 3, // 3 columns with 2px gaps
    aspectRatio: 1,
    borderRadius: 3,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.sand,
  },
  feedCellImage: {
    width: "100%",
    height: "100%",
  },
  feedCellPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  feedCellOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 7,
    paddingTop: 20,
    paddingBottom: 7,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  feedCellName: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: fonts.semibold,
    lineHeight: 13,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  feedCellBadges: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "column",
    gap: 3,
  },
  feedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  feedBadgeRec: {
    backgroundColor: "rgba(201,168,76,0.85)",
  },

  // Legacy — keep for sectionLabelRow recBadge usage
  recGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  recGridCell: {
    width: (SCREEN_WIDTH - 44) / 3,
    aspectRatio: 1,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  recGridImage: {
    width: "100%",
    height: "100%",
  },
  recGridPlaceholder: {
    backgroundColor: colors.sand,
    justifyContent: "center",
    alignItems: "center",
  },
  recGridLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.42)",
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  recGridVenueName: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: fonts.semibold,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  socialPlatform: {
    color: colors.stone,
    fontSize: 11,
    fontFamily: fonts.medium,
    marginBottom: 1,
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
