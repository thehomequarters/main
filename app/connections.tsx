import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import type { Profile } from "@/lib/database.types";

export default function ConnectionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!user?.uid) { setLoading(false); return; }
    try {
      const snap = await getDocs(
        query(
          collection(db, "connections"),
          where("from_id", "==", user.uid),
          where("status", "==", "accepted")
        )
      );
      const profiles: Profile[] = [];
      for (const conn of snap.docs) {
        const toId = conn.data().to_id as string;
        const profileSnap = await getDoc(doc(db, "profiles", toId));
        if (profileSnap.exists()) {
          profiles.push({ id: profileSnap.id, ...profileSnap.data() } as Profile);
        }
      }
      setConnections(profiles);
    } catch {
      // silent — list just stays empty
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConnections();
    setRefreshing(false);
  }, [fetchConnections]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Nav */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: Platform.OS === "ios" ? 60 : 44,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.sand,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 14,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>
        <View>
          <Text style={{ color: colors.ink, fontSize: 22, fontFamily: fonts.display }}>
            Connections
          </Text>
          {!loading && (
            <Text style={{ color: colors.stone, fontSize: 12, fontFamily: fonts.body, marginTop: 1 }}>
              {connections.length} {connections.length === 1 ? "person" : "people"}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={72} borderRadius={14} style={{ marginBottom: 10 }} />
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.stone} />
          }
        >
          {connections.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 72, gap: 14 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.sand,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="people-outline" size={32} color={colors.stone} />
              </View>
              <Text style={{ color: colors.ink, fontSize: 17, fontFamily: fonts.semibold, textAlign: "center" }}>
                No connections yet
              </Text>
              <Text
                style={{
                  color: colors.stone,
                  fontSize: 14,
                  fontFamily: fonts.body,
                  textAlign: "center",
                  lineHeight: 20,
                  paddingHorizontal: 20,
                }}
              >
                Head to Discover to connect with fellow members.
              </Text>
            </View>
          ) : (
            connections.map((member) => {
              const initials = (member.first_name?.[0] ?? "") + (member.last_name?.[0] ?? "");
              return (
                <Pressable
                  key={member.id}
                  onPress={() => router.push(`/member/${member.id}` as any)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.white,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  {/* Avatar */}
                  {member.avatar_url ? (
                    <Image
                      source={{ uri: member.avatar_url }}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        borderWidth: 1.5,
                        borderColor: colors.border,
                        marginRight: 14,
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
                        marginRight: 14,
                      }}
                    >
                      <Text style={{ color: colors.dark, fontSize: 15, fontWeight: "700" }}>
                        {initials.toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.dark, fontSize: 15, fontFamily: fonts.semibold }}>
                      {member.first_name} {member.last_name}
                    </Text>
                    <Text
                      style={{ color: colors.stone, fontSize: 12, fontFamily: fonts.body, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {member.title || "HQ Member"}
                      {member.city && !member.hide_city ? ` · ${member.city}` : ""}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color={colors.border} />
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
