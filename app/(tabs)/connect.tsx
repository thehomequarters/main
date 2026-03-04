import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Modal,
  Image,
  ActivityIndicator,
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
import * as Haptics from "expo-haptics";
import { PostCard } from "@/components/PostCard";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useToast } from "@/components/Toast";
import { pickPostImage, uploadPostImage } from "@/lib/storage";
import type { Post, PostTopic, Group, GroupMember, Comment } from "@/lib/database.types";

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
  const { toast } = useToast();
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

  // Create group state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupIcon, setNewGroupIcon] = useState("people-outline");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Comments state
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCompose(false);
      await fetchPosts();
    } catch (e: any) {
      toast("Failed to post. Please try again.", "error");
    } finally {
      setPosting(false);
    }
  };

  const handlePickPostImage = async () => {
    const uri = await pickPostImage();
    if (uri) setPostImageUri(uri);
  };

  const handleOpenComments = async (post: Post) => {
    setCommentPost(post);
    setLoadingComments(true);
    setComments([]);
    try {
      const commentsQuery = query(
        collection(db, "comments"),
        where("post_id", "==", post.id)
      );
      const snap = await getDocs(commentsQuery);
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Comment)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      setComments(list);
    } catch (e: any) {
      // Silently fail
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user?.uid || !profile || !commentPost || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const commentInitials =
        (profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "");
      await addDoc(collection(db, "comments"), {
        post_id: commentPost.id,
        author_id: user.uid,
        author_name: `${profile.first_name} ${profile.last_name}`,
        author_initials: commentInitials.toUpperCase(),
        content: newComment.trim(),
        created_at: new Date().toISOString(),
      });
      await updateDoc(doc(db, "posts", commentPost.id), {
        comments: increment(1),
      });
      // Update local post state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === commentPost.id ? { ...p, comments: p.comments + 1 } : p
        )
      );
      setCommentPost((prev) =>
        prev ? { ...prev, comments: prev.comments + 1 } : prev
      );
      // Add to local comments list
      setComments((prev) => [
        ...prev,
        {
          id: `temp_${Date.now()}`,
          post_id: commentPost.id,
          author_id: user.uid,
          author_name: `${profile.first_name} ${profile.last_name}`,
          author_initials: commentInitials.toUpperCase(),
          content: newComment.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setNewComment("");
    } catch (e: any) {
      toast("Failed to post comment.", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikePost = async (post: Post) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user?.uid) return;
    setCreatingGroup(true);
    try {
      const ref = await addDoc(collection(db, "groups"), {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        icon: newGroupIcon,
        member_count: 1,
        created_at: new Date().toISOString(),
      });
      // Auto-join creator
      await addDoc(collection(db, "group_members"), {
        group_id: ref.id,
        member_id: user.uid,
        joined_at: new Date().toISOString(),
      });
      setNewGroupName("");
      setNewGroupDesc("");
      setNewGroupIcon("people-outline");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateGroup(false);
      await fetchGroups();
    } catch (e: any) {
      toast("Failed to create group. Please try again.", "error");
    } finally {
      setCreatingGroup(false);
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
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.dark,
              fontSize: 30,
              fontWeight: "700",
              letterSpacing: 0.3,
            }}
          >
            Connect
          </Text>
          <Text
            style={{
              color: colors.stone,
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Share, discover, and connect with members
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
        <Pressable
          onPress={() => router.push("/messages")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.dark} />
        </Pressable>
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
          }}
        >
          <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "700" }}>
            {(profile?.first_name?.[0] ?? "")}{(profile?.last_name?.[0] ?? "")}
          </Text>
        </Pressable>
        </View>

      {/* Tab switcher */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 20,
          marginTop: 16,
          marginBottom: 20,
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: 4,
          borderWidth: 1,
          borderColor: colors.border,
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
                activeTab === tab ? colors.dark : "transparent",
            }}
          >
            <Text
              style={{
                color: activeTab === tab ? colors.white : colors.stone,
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
              backgroundColor: colors.white,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.sand,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: colors.dark,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {initials}
              </Text>
            </View>
            <Text
              style={{
                color: colors.stone,
                fontSize: 14,
                flex: 1,
              }}
            >
              What's on your mind?
            </Text>
            <Ionicons name="create-outline" size={20} color={colors.stone} />
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
                    borderColor: isSelected ? colors.dark : colors.border,
                    backgroundColor: isSelected ? colors.dark : colors.white,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? colors.white : colors.dark,
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
                onComment={() => handleOpenComments(post)}
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
                No posts yet. Be the first to share!
              </Text>
            </View>
          )}
        </>
      )}

      {activeTab === "groups" && (
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: colors.stone, fontSize: 13, flex: 1 }}>
              Join groups to connect with members who share your interests.
            </Text>
            <Pressable
              onPress={() => setShowCreateGroup(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: colors.dark,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginLeft: 12,
              }}
            >
              <Ionicons name="add" size={14} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: "700" }}>New</Text>
            </Pressable>
          </View>

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
                  onPress={() =>
                    joined
                      ? router.push(`/group/${group.id}` as any)
                      : handleJoinGroup(group)
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.white,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: colors.sand,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 14,
                    }}
                  >
                    <Ionicons
                      name={group.icon as any}
                      size={22}
                      color={colors.dark}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.dark,
                        fontSize: 15,
                        fontWeight: "600",
                        marginBottom: 2,
                      }}
                    >
                      {group.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.stone,
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
                        ? "rgba(46, 125, 50, 0.12)"
                        : colors.dark,
                      borderWidth: joined ? 1 : 0,
                      borderColor: joined
                        ? "rgba(46, 125, 50, 0.3)"
                        : "transparent",
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: joined ? colors.green : colors.white,
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

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroup}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateGroup(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
            onPress={() => setShowCreateGroup(false)}
          />
          <View
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <Text style={{ color: colors.dark, fontSize: 20, fontWeight: "700", marginBottom: 20 }}>
              Create a Group
            </Text>

            <Text style={{ color: colors.stone, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 }}>
              GROUP NAME
            </Text>
            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="e.g. Harare Foodies"
              placeholderTextColor={colors.stone}
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                color: colors.dark,
                fontSize: 15,
                marginBottom: 16,
              }}
            />

            <Text style={{ color: colors.stone, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 }}>
              DESCRIPTION (OPTIONAL)
            </Text>
            <TextInput
              value={newGroupDesc}
              onChangeText={setNewGroupDesc}
              placeholder="What's this group about?"
              placeholderTextColor={colors.stone}
              multiline
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                color: colors.dark,
                fontSize: 15,
                minHeight: 80,
                textAlignVertical: "top",
                marginBottom: 24,
              }}
            />

            <Pressable
              onPress={handleCreateGroup}
              disabled={creatingGroup || !newGroupName.trim()}
              style={{
                backgroundColor: colors.dark,
                borderRadius: 100,
                paddingVertical: 16,
                alignItems: "center",
                opacity: (!newGroupName.trim() || creatingGroup) ? 0.5 : 1,
              }}
            >
              <Text style={{ color: colors.white, fontSize: 15, fontWeight: "800" }}>
                {creatingGroup ? "Creating..." : "Create Group"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={!!commentPost}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setCommentPost(null);
          setNewComment("");
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
            onPress={() => {
              setCommentPost(null);
              setNewComment("");
            }}
          />
          <View
            style={{
              backgroundColor: colors.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "70%",
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Handle bar */}
            <View style={{ alignItems: "center", paddingTop: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: colors.dark,
                  fontSize: 17,
                  fontWeight: "600",
                }}
              >
                Comments{" "}
                <Text style={{ color: colors.stone, fontWeight: "400" }}>
                  ({commentPost?.comments ?? 0})
                </Text>
              </Text>
              <Pressable
                onPress={() => {
                  setCommentPost(null);
                  setNewComment("");
                }}
              >
                <Ionicons name="close" size={22} color={colors.stone} />
              </Pressable>
            </View>

            {/* Comments list */}
            {loadingComments ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator color={colors.stone} />
              </View>
            ) : comments.length === 0 ? (
              <View
                style={{
                  padding: 40,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={32}
                  color={colors.border}
                />
                <Text
                  style={{
                    color: colors.stone,
                    fontSize: 14,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  No comments yet. Be the first!
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
                renderItem={({ item }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 16,
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: colors.sand,
                        borderWidth: 1,
                        borderColor: colors.border,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: colors.dark,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {item.author_initials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.dark,
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          {item.author_name}
                        </Text>
                        <Text
                          style={{
                            color: colors.stone,
                            fontSize: 11,
                            opacity: 0.7,
                          }}
                        >
                          {timeAgo(item.created_at)}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: colors.dark,
                          fontSize: 13,
                          lineHeight: 19,
                          marginTop: 3,
                          opacity: 0.9,
                        }}
                      >
                        {item.content}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Comment input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                paddingBottom: Platform.OS === "ios" ? 32 : 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.sand,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.dark,
                    fontSize: 10,
                    fontWeight: "700",
                  }}
                >
                  {initials}
                </Text>
              </View>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor={colors.stone}
                style={{
                  flex: 1,
                  color: colors.dark,
                  fontSize: 14,
                  backgroundColor: colors.bg,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <Pressable
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: newComment.trim()
                    ? colors.dark
                    : colors.sand,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={newComment.trim() ? colors.white : colors.stone}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Compose Modal */}
      <Modal visible={showCompose} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: colors.white,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: 40,
                borderTopWidth: 1,
                borderColor: colors.border,
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
                  <Text style={{ color: colors.stone, fontSize: 15 }}>
                    Cancel
                  </Text>
                </Pressable>
                <Text
                  style={{
                    color: colors.dark,
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
                        ? colors.dark
                        : colors.sand,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      color: newPostContent.trim() ? colors.white : colors.stone,
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
                          : colors.border,
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
                            : colors.stone,
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
                placeholderTextColor={colors.stone}
                multiline
                autoFocus
                style={{
                  color: colors.dark,
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
                  borderTopColor: colors.border,
                }}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={colors.stone}
                />
                <Text
                  style={{
                    color: colors.stone,
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
