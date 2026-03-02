import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Modal,
  Image,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PostCard } from "@/components/PostCard";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { pickPostImage, uploadPostImage } from "@/lib/storage";
import type { Post, PostTopic, Group, GroupMember } from "@/lib/database.types";

type ConnectTabView = "noticeboard" | "groups";

const TOPIC_OPTIONS: { key: PostTopic; label: string; color: string }[] = [
  { key: "general", label: "General", color: "#A0A0A0" },
  { key: "collaboration", label: "Collaboration", color: "#C9A84C" },
  { key: "meetup", label: "Meetup", color: "#FF6B6B" },
  { key: "flat-swap", label: "Flat Swap", color: "#4ECDC4" },
  { key: "recommendation", label: "Recommendation", color: "#7B68EE" },
];

const FILTER_OPTIONS: { key: PostTopic | null; label: string }[] = [
  { key: null, label: "All" },
  { key: "collaboration", label: "Collabs" },
  { key: "meetup", label: "Meetups" },
  { key: "flat-swap", label: "Flat Swaps" },
  { key: "recommendation", label: "Recs" },
];

export default function ConnectTab() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ConnectTabView>("noticeboard");
  const [topicFilter, setTopicFilter] = useState<PostTopic | null>(null);

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTopic, setNewPostTopic] = useState<PostTopic>("general");
  const [posting, setPosting] = useState(false);
  const [postImageUri, setPostImageUri] = useState<string | null>(null);

  const initials =
    (profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "");

  const fetchPosts = useCallback(async () => {
    const postsSnap = await getDocs(collection(db, "posts"));
    const postList = postsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Post)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    setPosts(postList);
    setLoadingPosts(false);
  }, []);

  const fetchGroups = useCallback(async () => {
    const groupsSnap = await getDocs(collection(db, "groups"));
    const groupList = groupsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Group)
      .sort((a, b) => b.member_count - a.member_count);
    setGroups(groupList);

    // Check which groups the user has joined
    if (user?.uid) {
      const membershipQuery = query(
        collection(db, "group_members"),
        where("member_id", "==", user.uid)
      );
      const membershipSnap = await getDocs(membershipQuery);
      const ids = new Set(
        membershipSnap.docs.map((d) => d.data().group_id as string)
      );
      setMyGroupIds(ids);
    }
    setLoadingGroups(false);
  }, [user?.uid]);

  useEffect(() => {
    fetchPosts();
    fetchGroups();
  }, [fetchPosts, fetchGroups]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(), fetchGroups()]);
    setRefreshing(false);
  }, [fetchPosts, fetchGroups]);

  const handleCreatePost = async () => {
    if (!user?.uid || !profile || (!newPostContent.trim() && !postImageUri))
      return;

    setPosting(true);
    try {
      const topicOption = TOPIC_OPTIONS.find((t) => t.key === newPostTopic);

      // Upload image if attached
      let imageUrl: string | null = null;
      if (postImageUri) {
        const tempId = `${user.uid}_${Date.now()}`;
        imageUrl = await uploadPostImage(tempId, postImageUri);
      }

      await addDoc(collection(db, "posts"), {
        author_id: user.uid,
        author_name: `${profile.first_name} ${profile.last_name}`,
        author_initials: initials.toUpperCase(),
        author_title: profile.title || "HQ Member",
        author_city: profile.city || "Harare",
        content: newPostContent.trim(),
        topic: newPostTopic,
        color: topicOption?.color || "#A0A0A0",
        image_url: imageUrl,
        likes: 0,
        comments: 0,
        created_at: new Date().toISOString(),
      });
      setNewPostContent("");
      setNewPostTopic("general");
      setPostImageUri(null);
      setShowCompose(false);
      await fetchPosts();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setPosting(false);
    }
  };

  const handlePickPostImage = async () => {
    const uri = await pickPostImage();
    if (uri) setPostImageUri(uri);
  };

  const handleLikePost = async (post: Post) => {
    try {
      await updateDoc(doc(db, "posts", post.id), {
        likes: increment(1),
      });
      // Update local state immediately
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, likes: p.likes + 1 } : p
        )
      );
    } catch (e: any) {
      // Silently fail — non-critical
    }
  };

  const handleJoinGroup = async (group: Group) => {
    if (!user?.uid) return;

    if (myGroupIds.has(group.id)) {
      // Leave group
      const membershipQuery = query(
        collection(db, "group_members"),
        where("group_id", "==", group.id),
        where("member_id", "==", user.uid)
      );
      const snap = await getDocs(membershipQuery);
      for (const d of snap.docs) {
        const { deleteDoc: delDoc } = await import("firebase/firestore");
        await delDoc(doc(db, "group_members", d.id));
      }
      await updateDoc(doc(db, "groups", group.id), {
        member_count: increment(-1),
      });
      setMyGroupIds((prev) => {
        const next = new Set(prev);
        next.delete(group.id);
        return next;
      });
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, member_count: g.member_count - 1 }
            : g
        )
      );
    } else {
      // Join group
      await addDoc(collection(db, "group_members"), {
        group_id: group.id,
        member_id: user.uid,
        joined_at: new Date().toISOString(),
      });
      await updateDoc(doc(db, "groups", group.id), {
        member_count: increment(1),
      });
      setMyGroupIds((prev) => new Set(prev).add(group.id));
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, member_count: g.member_count + 1 }
            : g
        )
      );
    }
  };

  const filteredPosts = topicFilter
    ? posts.filter((p) => p.topic === topicFilter)
    : posts;

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.gold}
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
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.white,
              fontSize: 30,
              fontWeight: "700",
              letterSpacing: 0.3,
            }}
          >
            Connect
          </Text>
          <Text
            style={{
              color: colors.grey,
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Share, discover, and connect with members
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/messages")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.dark,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.white} />
        </Pressable>
      </View>

      {/* Tab switcher */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 20,
          marginTop: 16,
          marginBottom: 20,
          backgroundColor: colors.dark,
          borderRadius: 12,
          padding: 4,
          borderWidth: 1,
          borderColor: colors.darkBorder,
        }}
      >
        {(["noticeboard", "groups"] as ConnectTabView[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor:
                activeTab === tab
                  ? "rgba(201, 168, 76, 0.12)"
                  : "transparent",
            }}
          >
            <Text
              style={{
                color: activeTab === tab ? colors.gold : colors.grey,
                fontSize: 14,
                fontWeight: "600",
                textAlign: "center",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "noticeboard" && (
        <>
          {/* Compose prompt */}
          <Pressable
            onPress={() => setShowCompose(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: colors.dark,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              padding: 14,
              gap: 12,
            }}
          >
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
                style={{
                  color: colors.gold,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {initials}
              </Text>
            </View>
            <Text
              style={{
                color: "rgba(160, 160, 160, 0.5)",
                fontSize: 14,
                flex: 1,
              }}
            >
              What's on your mind?
            </Text>
            <Ionicons name="create-outline" size={20} color={colors.grey} />
          </Pressable>

          {/* Topic filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 8,
              marginBottom: 20,
            }}
          >
            {FILTER_OPTIONS.map((topic) => {
              const isSelected = topicFilter === topic.key;
              return (
                <Pressable
                  key={topic.label}
                  onPress={() => setTopicFilter(topic.key)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: isSelected
                      ? colors.gold
                      : "rgba(160, 160, 160, 0.25)",
                    backgroundColor: isSelected
                      ? "rgba(201, 168, 76, 0.12)"
                      : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? colors.gold : colors.grey,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {topic.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Loading state */}
          {loadingPosts && (
            <View style={{ paddingHorizontal: 20, gap: 14 }}>
              <SkeletonLoader width="100%" height={180} borderRadius={16} />
              <SkeletonLoader width="100%" height={180} borderRadius={16} />
            </View>
          )}

          {/* Posts feed */}
          {!loadingPosts &&
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                timeAgo={timeAgo(post.created_at)}
                onLike={() => handleLikePost(post)}
              />
            ))}

          {!loadingPosts && filteredPosts.length === 0 && (
            <View
              style={{
                alignItems: "center",
                marginTop: 48,
                paddingHorizontal: 40,
              }}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={colors.darkBorder}
              />
              <Text
                style={{
                  color: colors.grey,
                  fontSize: 15,
                  textAlign: "center",
                  marginTop: 16,
                }}
              >
                No posts yet. Be the first to share!
              </Text>
            </View>
          )}
        </>
      )}

      {activeTab === "groups" && (
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              color: colors.grey,
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            Join groups to connect with members who share your interests.
          </Text>

          {loadingGroups && (
            <View style={{ gap: 12 }}>
              <SkeletonLoader width="100%" height={80} borderRadius={14} />
              <SkeletonLoader width="100%" height={80} borderRadius={14} />
              <SkeletonLoader width="100%" height={80} borderRadius={14} />
            </View>
          )}

          {!loadingGroups &&
            groups.map((group) => {
              const joined = myGroupIds.has(group.id);
              return (
                <Pressable
                  key={group.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.dark,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.darkBorder,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: "rgba(201, 168, 76, 0.1)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 14,
                    }}
                  >
                    <Ionicons
                      name={group.icon as any}
                      size={22}
                      color={colors.gold}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: 15,
                        fontWeight: "600",
                        marginBottom: 2,
                      }}
                    >
                      {group.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.grey,
                        fontSize: 12,
                      }}
                    >
                      {group.member_count} members
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handleJoinGroup(group)}
                    style={{
                      backgroundColor: joined
                        ? "rgba(76, 175, 80, 0.15)"
                        : "rgba(201, 168, 76, 0.12)",
                      borderWidth: 1,
                      borderColor: joined
                        ? "rgba(76, 175, 80, 0.3)"
                        : "rgba(201, 168, 76, 0.25)",
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: joined ? colors.green : colors.gold,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {joined ? "Joined" : "Join"}
                    </Text>
                  </Pressable>
                </Pressable>
              );
            })}
        </View>
      )}

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: colors.dark,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: 40,
                borderTopWidth: 1,
                borderColor: colors.darkBorder,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Pressable onPress={() => setShowCompose(false)}>
                  <Text style={{ color: colors.grey, fontSize: 15 }}>
                    Cancel
                  </Text>
                </Pressable>
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 17,
                    fontWeight: "600",
                  }}
                >
                  New Post
                </Text>
                <Pressable
                  onPress={handleCreatePost}
                  disabled={posting || !newPostContent.trim()}
                  style={{
                    backgroundColor:
                      newPostContent.trim()
                        ? colors.gold
                        : "rgba(201, 168, 76, 0.3)",
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.black,
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {posting ? "Posting..." : "Post"}
                  </Text>
                </Pressable>
              </View>

              {/* Topic selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginBottom: 16 }}
              >
                {TOPIC_OPTIONS.map((topic) => (
                  <Pressable
                    key={topic.key}
                    onPress={() => setNewPostTopic(topic.key)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor:
                        newPostTopic === topic.key
                          ? topic.color
                          : colors.darkBorder,
                      backgroundColor:
                        newPostTopic === topic.key
                          ? `${topic.color}15`
                          : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          newPostTopic === topic.key
                            ? topic.color
                            : colors.grey,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {topic.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Text input */}
              <TextInput
                value={newPostContent}
                onChangeText={setNewPostContent}
                placeholder="Share something with the community..."
                placeholderTextColor="rgba(160, 160, 160, 0.5)"
                multiline
                autoFocus
                style={{
                  color: colors.white,
                  fontSize: 16,
                  lineHeight: 24,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
              />

              {/* Image preview */}
              {postImageUri && (
                <View
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Image
                    source={{ uri: postImageUri }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 10,
                    }}
                  />
                  <Pressable onPress={() => setPostImageUri(null)}>
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color={colors.red}
                    />
                  </Pressable>
                </View>
              )}

              {/* Attach image button */}
              <Pressable
                onPress={handlePickPostImage}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 16,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.darkBorder,
                }}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={colors.gold}
                />
                <Text
                  style={{
                    color: colors.gold,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  Add Photo
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
