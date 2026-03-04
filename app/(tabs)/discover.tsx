import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useToast } from "@/components/Toast";
import type { Profile, Connection, MemberIndustry } from "@/lib/database.types";

const INDUSTRY_FILTERS: { key: MemberIndustry | null; label: string }[] = [
  { key: null, label: "All" },
  { key: "creative", label: "Creatives" },
  { key: "tech", label: "Tech" },
  { key: "hospitality", label: "Hospitality" },
  { key: "music", label: "Music" },
  { key: "business", label: "Business" },
  { key: "wellness", label: "Wellness" },
];

export default function DiscoverTab() {
  const { user, profile: myProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [inboundRequests, setInboundRequests] = useState<
    (Connection & { fromProfile?: Profile })[]
  >([]);
  const [selectedIndustry, setSelectedIndustry] =
    useState<MemberIndustry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(async () => {
    // Get all active member profiles (excluding self)
    const profilesQuery = query(
      collection(db, "profiles"),
      where("membership_status", "==", "active")
    );
    const profilesSnap = await getDocs(profilesQuery);
    const memberList = profilesSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Profile)
      .filter((m) => m.id !== user?.uid);
    setMembers(memberList);

    // Fetch existing connections (outbound)
    if (user?.uid) {
      const connQuery = query(
        collection(db, "connections"),
        where("from_id", "==", user.uid)
      );
      const connSnap = await getDocs(connQuery);
      setConnections(
        connSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Connection)
      );

      // Fetch inbound pending requests
      const inboundQuery = query(
        collection(db, "connections"),
        where("to_id", "==", user.uid),
        where("status", "==", "pending")
      );
      const inboundSnap = await getDocs(inboundQuery);
      const inbound = inboundSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Connection
      );

      // Attach sender profile info
      const enriched = inbound.map((conn) => {
        const fromProfile = memberList.find((m) => m.id === conn.from_id);
        return { ...conn, fromProfile };
      });
      setInboundRequests(enriched);
    }

    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  }, [fetchMembers]);

  const getConnectionStatus = (memberId: string) => {
    const conn = connections.find((c) => c.to_id === memberId);
    return conn?.status ?? null;
  };

  const handleConnect = async (member: Profile) => {
    if (!user?.uid) return;

    const existing = connections.find((c) => c.to_id === member.id);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (existing) {
      // Remove connection
      await deleteDoc(doc(db, "connections", existing.id));
      setConnections((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      // Send connection request
      const ref = await addDoc(collection(db, "connections"), {
        from_id: user.uid,
        to_id: member.id,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      setConnections((prev) => [
        ...prev,
        {
          id: ref.id,
          from_id: user.uid,
          to_id: member.id,
          status: "pending" as const,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleMessage = async (member: Profile) => {
    if (!user?.uid || !myProfile) return;

    // Check if a conversation already exists between these two users
    const convQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );
    const convSnap = await getDocs(convQuery);
    const existing = convSnap.docs.find((d) => {
      const participants = d.data().participants as string[];
      return participants.includes(member.id);
    });

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    // Create a new conversation
    const myInitials =
      (myProfile.first_name?.[0] ?? "") + (myProfile.last_name?.[0] ?? "");
    const otherInitials =
      (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");

    const ref = await addDoc(collection(db, "conversations"), {
      participants: [user.uid, member.id],
      participant_names: {
        [user.uid]: `${myProfile.first_name} ${myProfile.last_name}`,
        [member.id]: `${member.first_name} ${member.last_name}`,
      },
      participant_initials: {
        [user.uid]: myInitials.toUpperCase(),
        [member.id]: otherInitials.toUpperCase(),
      },
      last_message: "",
      last_message_at: "",
      last_sender_id: "",
      created_at: new Date().toISOString(),
    });

    router.push(`/messages/${ref.id}`);
  };

  const handleAcceptConnection = async (conn: Connection) => {
    try {
      await updateDoc(doc(db, "connections", conn.id), {
        status: "accepted",
      });
      // Also create reverse connection so both sides see "Connected"
      await addDoc(collection(db, "connections"), {
        from_id: conn.to_id,
        to_id: conn.from_id,
        status: "accepted",
        created_at: new Date().toISOString(),
      });
      setInboundRequests((prev) => prev.filter((r) => r.id !== conn.id));
      await fetchMembers();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      toast("Something went wrong. Please try again.", "error");
    }
  };

  const handleRejectConnection = async (conn: Connection) => {
    try {
      await updateDoc(doc(db, "connections", conn.id), {
        status: "rejected",
      });
      setInboundRequests((prev) => prev.filter((r) => r.id !== conn.id));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: any) {
      toast("Something went wrong. Please try again.", "error");
    }
  };

  const filteredMembers = selectedIndustry
    ? members.filter((m) => m.industry === selectedIndustry)
    : members;

  // Count unique industries
  const industryCount = new Set(
    members.map((m) => m.industry).filter(Boolean)
  ).size;
  const cityCount = new Set(members.map((m) => m.city).filter(Boolean)).size;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: 80,
          paddingHorizontal: 20,
        }}
      >
        <SkeletonLoader width="40%" height={28} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="60%" height={14} style={{ marginBottom: 28 }} />
        <SkeletonLoader
          width="100%"
          height={120}
          borderRadius={16}
          style={{ marginBottom: 14 }}
        />
        <SkeletonLoader
          width="100%"
          height={120}
          borderRadius={16}
          style={{ marginBottom: 14 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.stone}
        />
      }
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 66,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              color: colors.dark,
              fontSize: 30,
              fontWeight: "700",
              letterSpacing: 0.3,
            }}
          >
            Discover
          </Text>
          <Text
            style={{
              color: colors.stone,
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Find and connect with fellow members
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/account" as any)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.sand,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "700" }}>
            {(myProfile?.first_name?.[0] ?? "")}{(myProfile?.last_name?.[0] ?? "")}
          </Text>
        </Pressable>
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 20,
          marginTop: 16,
          marginBottom: 24,
          gap: 12,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: colors.dark, fontSize: 24, fontWeight: "800" }}
          >
            {members.length}
          </Text>
          <Text
            style={{
              color: colors.stone,
              fontSize: 11,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            Members
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: colors.dark, fontSize: 24, fontWeight: "800" }}
          >
            {industryCount || "—"}
          </Text>
          <Text
            style={{
              color: colors.stone,
              fontSize: 11,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            Industries
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: colors.dark, fontSize: 24, fontWeight: "800" }}
          >
            {cityCount || "—"}
          </Text>
          <Text
            style={{
              color: colors.stone,
              fontSize: 11,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            {cityCount === 1 ? "City" : "Cities"}
          </Text>
        </View>
      </View>

      {/* Industry filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
          marginBottom: 24,
        }}
      >
        {INDUSTRY_FILTERS.map((filter) => {
          const isSelected = selectedIndustry === filter.key;
          return (
            <Pressable
              key={filter.label}
              onPress={() => setSelectedIndustry(filter.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isSelected ? colors.dark : colors.border,
                backgroundColor: isSelected ? colors.dark : colors.white,
              }}
            >
              <Text
                style={{
                  color: isSelected ? colors.white : colors.dark,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Inbound connection requests */}
      {inboundRequests.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              paddingHorizontal: 20,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 4,
                height: 20,
                borderRadius: 2,
                backgroundColor: colors.dark,
              }}
            />
            <Text
              style={{
                color: colors.dark,
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              Connection Requests
            </Text>
            <View
              style={{
                backgroundColor: colors.dark,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 4,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {inboundRequests.length}
              </Text>
            </View>
          </View>

          {inboundRequests.map((req) => {
            const profile = req.fromProfile;
            const reqInitials =
              (profile?.first_name?.[0] ?? "?") +
              (profile?.last_name?.[0] ?? "");
            return (
              <View
                key={req.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  marginBottom: 10,
                  marginHorizontal: 20,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {/* Avatar */}
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      marginRight: 12,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: colors.sand,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.dark,
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {reqInitials.toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.dark,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    {profile?.first_name} {profile?.last_name}
                  </Text>
                  <Text
                    style={{
                      color: colors.stone,
                      fontSize: 12,
                      marginTop: 1,
                    }}
                    numberOfLines={1}
                  >
                    {profile?.title || "HQ Member"}
                    {profile?.city ? ` · ${profile.city}` : ""}
                  </Text>
                </View>

                {/* Accept / Reject buttons */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => handleRejectConnection(req)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "rgba(229, 57, 53, 0.1)",
                      borderWidth: 1,
                      borderColor: "rgba(229, 57, 53, 0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="close" size={18} color={colors.red} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleAcceptConnection(req)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "rgba(76, 175, 80, 0.15)",
                      borderWidth: 1,
                      borderColor: "rgba(76, 175, 80, 0.3)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.green}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Section label */}
      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <View
          style={{
            width: 4,
            height: 20,
            borderRadius: 2,
            backgroundColor: colors.dark,
          }}
        />
        <Text
          style={{
            color: colors.dark,
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          {selectedIndustry
            ? `${INDUSTRY_FILTERS.find((f) => f.key === selectedIndustry)?.label ?? ""}`
            : "All Members"}
        </Text>
      </View>

      {/* Member list */}
      {filteredMembers.map((member) => {
        const status = getConnectionStatus(member.id);
        const connected = status === "pending" || status === "accepted";
        const memberInitials =
          (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");

        return (
          <Pressable
            key={member.id}
            onPress={() => router.push(`/member/${member.id}` as any)}
            style={{
              backgroundColor: colors.white,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
              marginBottom: 14,
              marginHorizontal: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              {/* Avatar */}
              {member.avatar_url ? (
                <Image
                  source={{ uri: member.avatar_url }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    marginRight: 14,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: colors.sand,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                  }}
                >
                  <Text
                    style={{
                      color: colors.dark,
                      fontSize: 17,
                      fontWeight: "700",
                      letterSpacing: 1,
                    }}
                  >
                    {memberInitials.toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.dark,
                    fontSize: 15,
                    fontWeight: "600",
                    marginBottom: 2,
                  }}
                >
                  {member.first_name} {member.last_name}
                </Text>
                <Text
                  style={{ color: colors.stone, fontSize: 12, marginBottom: 6 }}
                  numberOfLines={1}
                >
                  {member.title || "HQ Member"}
                </Text>

                {/* Location + industry */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  {member.city && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={colors.stone}
                      />
                      <Text style={{ color: colors.stone, fontSize: 11 }}>
                        {member.city}
                      </Text>
                    </View>
                  )}
                  {member.industry && (
                    <>
                      <Text
                        style={{ color: colors.border, fontSize: 11 }}
                      >
                        ·
                      </Text>
                      <Text
                        style={{
                          color: colors.stone,
                          fontSize: 11,
                          fontWeight: "500",
                          textTransform: "capitalize",
                        }}
                      >
                        {member.industry}
                      </Text>
                    </>
                  )}
                </View>

                {/* Interests */}
                {member.interests && member.interests.length > 0 && (
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                  >
                    {member.interests.slice(0, 3).map((interest) => (
                      <View
                        key={interest}
                        style={{
                          backgroundColor: colors.sand,
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.stone,
                            fontSize: 10,
                            fontWeight: "500",
                          }}
                        >
                          {interest}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Action buttons */}
              <View style={{ alignItems: "flex-end", gap: 6, marginTop: 4 }}>
                <Pressable
                  onPress={() => handleConnect(member)}
                  style={{
                    backgroundColor: connected
                      ? "rgba(46, 125, 50, 0.12)"
                      : colors.dark,
                    borderWidth: 1,
                    borderColor: connected
                      ? "rgba(46, 125, 50, 0.3)"
                      : colors.dark,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: connected ? colors.green : colors.white,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {status === "accepted"
                      ? "Connected"
                      : status === "pending"
                        ? "Pending"
                        : "Connect"}
                  </Text>
                </Pressable>
                {connected && (
                  <Pressable
                    onPress={() => handleMessage(member)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                    }}
                  >
                    <Ionicons name="chatbubble-outline" size={12} color={colors.dark} />
                    <Text
                      style={{
                        color: colors.dark,
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      Message
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Pressable>
        );
      })}

      {filteredMembers.length === 0 && (
        <View
          style={{
            alignItems: "center",
            marginTop: 48,
            paddingHorizontal: 40,
          }}
        >
          <Ionicons
            name="people-outline"
            size={48}
            color={colors.border}
          />
          <Text
            style={{
              color: colors.stone,
              fontSize: 15,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            {members.length === 0
              ? "No other members yet. Invite friends to join HQ!"
              : "No members found in this industry."}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
