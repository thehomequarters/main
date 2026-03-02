import React from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { Post } from "@/data/posts";
import { topicLabels, topicColors } from "@/data/posts";

interface PostCardProps {
  post: Post;
  onPress?: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  const topicColor = topicColors[post.topic];

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.dark,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        padding: 18,
        marginBottom: 14,
        marginHorizontal: 20,
      }}
    >
      {/* Author row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(201, 168, 76, 0.12)",
            borderWidth: 1,
            borderColor: "rgba(201, 168, 76, 0.25)",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Text
            style={{
              color: colors.gold,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            {post.author.initials}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.white,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {post.author.name}
          </Text>
          <Text
            style={{
              color: colors.grey,
              fontSize: 11,
            }}
            numberOfLines={1}
          >
            {post.author.title} · {post.author.city}
          </Text>
        </View>

        <Text
          style={{
            color: colors.grey,
            fontSize: 11,
            opacity: 0.7,
          }}
        >
          {post.created_at}
        </Text>
      </View>

      {/* Topic badge */}
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: `${topicColor}15`,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: topicColor,
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {topicLabels[post.topic]}
        </Text>
      </View>

      {/* Content */}
      <Text
        style={{
          color: colors.white,
          fontSize: 14,
          lineHeight: 21,
          marginBottom: 16,
        }}
      >
        {post.content}
      </Text>

      {/* Actions row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
          borderTopWidth: 1,
          borderTopColor: colors.darkBorder,
          paddingTop: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="heart-outline" size={18} color={colors.grey} />
          <Text style={{ color: colors.grey, fontSize: 12 }}>
            {post.likes}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={colors.grey}
          />
          <Text style={{ color: colors.grey, fontSize: 12 }}>
            {post.comments}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Ionicons
          name="share-outline"
          size={18}
          color={colors.grey}
        />
      </View>
    </Pressable>
  );
}
