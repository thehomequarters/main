import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { Post, PostTopic } from "@/lib/database.types";

const topicLabels: Record<PostTopic, string> = {
  collaboration: "Collaboration",
  "flat-swap": "Flat Swap",
  meetup: "Meetup",
  general: "General",
  recommendation: "Recommendation",
};

const topicColors: Record<PostTopic, string> = {
  collaboration: "#C9A84C",
  "flat-swap": "#4ECDC4",
  meetup: "#FF6B6B",
  general: "#A0A0A0",
  recommendation: "#7B68EE",
};

interface PostCardProps {
  post: Post;
  timeAgo?: string;
  onLike?: () => void;
  onComment?: () => void;
  onPress?: () => void;
}

export function PostCard({ post, timeAgo, onLike, onComment, onPress }: PostCardProps) {
  const topicColor = topicColors[post.topic];

  return (
    <Pressable
      onPress={onPress}
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
            backgroundColor: colors.sand,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Text
            style={{
              color: colors.dark,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            {post.author_initials}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.dark,
              fontSize: 14,
              fontFamily: fonts.semibold,
            }}
          >
            {post.author_name}
          </Text>
          <Text
            style={{
              color: colors.stone,
              fontSize: 11,
              fontFamily: fonts.body,
            }}
            numberOfLines={1}
          >
            {post.author_title} · {post.author_city}
          </Text>
        </View>

        <Text
          style={{
            color: colors.stone,
            fontSize: 11,
            fontFamily: fonts.body,
            opacity: 0.7,
          }}
        >
          {timeAgo ?? ""}
        </Text>
      </View>

      {/* Topic badge */}
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: `${topicColor}1A`,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: topicColor,
            fontSize: 9,
            fontFamily: fonts.bold,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {topicLabels[post.topic]}
        </Text>
      </View>

      {/* Post image */}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 12,
            marginBottom: 12,
          }}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <Text
        style={{
          color: colors.dark,
          fontSize: 14,
          fontFamily: fonts.body,
          lineHeight: 22,
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
          borderTopColor: colors.border,
          paddingTop: 12,
        }}
      >
        <Pressable
          onPress={onLike}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name="heart-outline" size={18} color={colors.stone} />
          <Text style={{ color: colors.stone, fontSize: 12, fontFamily: fonts.body }}>
            {post.likes}
          </Text>
        </Pressable>
        <Pressable
          onPress={onComment}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={colors.stone}
          />
          <Text style={{ color: colors.stone, fontSize: 12, fontFamily: fonts.body }}>
            {post.comments}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Ionicons name="share-outline" size={18} color={colors.stone} />
      </View>
    </Pressable>
  );
}
