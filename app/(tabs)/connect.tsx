import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";
import { POSTS } from "@/data/posts";
import type { PostTopic } from "@/data/posts";

type ConnectTab = "noticeboard" | "groups";

const GROUPS = [
  { id: "g1", name: "Creatives Hub", members: 234, icon: "brush-outline" as const },
  { id: "g2", name: "Foodies Harare", members: 187, icon: "restaurant-outline" as const },
  { id: "g3", name: "Tech & Startups", members: 156, icon: "code-slash-outline" as const },
  { id: "g4", name: "Wellness Circle", members: 98, icon: "leaf-outline" as const },
  { id: "g5", name: "Music Scene", members: 312, icon: "musical-notes-outline" as const },
  { id: "g6", name: "Flat Swaps", members: 76, icon: "home-outline" as const },
];

export default function ConnectTab() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ConnectTab>("noticeboard");
  const [topicFilter, setTopicFilter] = useState<PostTopic | null>(null);

  const initials =
    (profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "");

  const filteredPosts = topicFilter
    ? POSTS.filter((p) => p.topic === topicFilter)
    : POSTS;

  const topics: { key: PostTopic | null; label: string }[] = [
    { key: null, label: "All" },
    { key: "collaboration", label: "Collabs" },
    { key: "meetup", label: "Meetups" },
    { key: "flat-swap", label: "Flat Swaps" },
    { key: "recommendation", label: "Recs" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 66,
          paddingHorizontal: 20,
          paddingBottom: 8,
        }}
      >
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
        {(["noticeboard", "groups"] as ConnectTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor:
                activeTab === tab ? "rgba(201, 168, 76, 0.12)" : "transparent",
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
            <Ionicons name="image-outline" size={20} color={colors.grey} />
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
            {topics.map((topic) => {
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

          {/* Posts feed */}
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {filteredPosts.length === 0 && (
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
                No posts in this category yet.
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

          {GROUPS.map((group) => (
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
                <Ionicons name={group.icon} size={22} color={colors.gold} />
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
                  {group.members} members
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(201, 168, 76, 0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(201, 168, 76, 0.25)",
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    color: colors.gold,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  Join
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
