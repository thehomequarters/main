import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import type { VenueStory } from "@/lib/database.types";

const STORY_DURATION = 5000; // ms per story
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function StoriesScreen() {
  const { venueId, venueName } = useLocalSearchParams<{
    venueId: string;
    venueName: string;
  }>();
  const router = useRouter();

  const [stories, setStories] = useState<VenueStory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  // Progress animation for the current story
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(
          collection(db, "venue_stories"),
          where("venue_id", "==", venueId),
          orderBy("order", "asc")
        );
        const snap = await getDocs(q);
        setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VenueStory));
      } catch {
        // orderBy may fail without an index; fall back without ordering
        try {
          const q2 = query(
            collection(db, "venue_stories"),
            where("venue_id", "==", venueId)
          );
          const snap2 = await getDocs(q2);
          const list = snap2.docs
            .map((d) => ({ id: d.id, ...d.data() }) as VenueStory)
            .sort((a, b) => a.order - b.order);
          setStories(list);
        } catch {
          setStories([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [venueId]);

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    progressRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    progressRef.current.start(({ finished }) => {
      if (finished) advance();
    });
  }, [currentIndex, stories.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stories.length === 0 || loading) return;
    startProgress();
    return () => {
      progressRef.current?.stop();
    };
  }, [currentIndex, stories.length, loading]);

  const advance = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      router.back();
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      router.back();
    }
  };

  const handleLongPressIn = () => {
    setPaused(true);
    progressRef.current?.stop();
  };

  const handleLongPressOut = () => {
    setPaused(false);
    // Resume from current position
    const remaining = STORY_DURATION * (1 - (progressAnim as any)._value);
    progressRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remaining,
      useNativeDriver: false,
    });
    progressRef.current.start(({ finished }) => {
      if (finished) advance();
    });
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.black,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (stories.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.black,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 40,
        }}
      >
        <Ionicons name="images-outline" size={56} color={colors.darkBorder} />
        <Text
          style={{
            color: colors.grey,
            fontSize: 16,
            textAlign: "center",
            marginTop: 16,
            lineHeight: 24,
          }}
        >
          No stories yet for{"\n"}
          {decodeURIComponent(venueName ?? "")}
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            backgroundColor: colors.gold,
            borderRadius: 12,
            paddingHorizontal: 28,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: colors.black, fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const story = stories[currentIndex];

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      {/* Full-screen media */}
      <Pressable
        style={{ flex: 1 }}
        onLongPress={handleLongPressIn}
        onPressOut={handleLongPressOut}
        delayLongPress={150}
      >
        <Image
          source={{ uri: story.media_url }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          resizeMode="cover"
        />

        {/* Dark gradient at top */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 140,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
          pointerEvents="none"
        />

        {/* Dark gradient at bottom */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
          pointerEvents="none"
        />

        {/* Progress bars */}
        <View
          style={{
            position: "absolute",
            top: 54,
            left: 12,
            right: 12,
            flexDirection: "row",
            gap: 4,
          }}
          pointerEvents="none"
        >
          {stories.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.3)",
                overflow: "hidden",
              }}
            >
              {i < currentIndex && (
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: colors.white,
                  }}
                />
              )}
              {i === currentIndex && (
                <Animated.View
                  style={{
                    height: "100%",
                    backgroundColor: colors.white,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  }}
                />
              )}
            </View>
          ))}
        </View>

        {/* Venue name & close */}
        <View
          style={{
            position: "absolute",
            top: 66,
            left: 16,
            right: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          pointerEvents="box-none"
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 16,
              fontWeight: "700",
              textShadowColor: "rgba(0,0,0,0.6)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {decodeURIComponent(venueName ?? "")}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="close" size={20} color={colors.white} />
          </Pressable>
        </View>

        {/* Caption */}
        {story.caption && (
          <View
            style={{
              position: "absolute",
              bottom: 60,
              left: 20,
              right: 20,
            }}
            pointerEvents="none"
          >
            <Text
              style={{
                color: colors.white,
                fontSize: 15,
                lineHeight: 22,
                textShadowColor: "rgba(0,0,0,0.7)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }}
            >
              {story.caption}
            </Text>
          </View>
        )}

        {/* Tap zones — left half goes back, right half advances */}
        <View
          style={{ position: "absolute", top: 120, bottom: 100, left: 0, width: SCREEN_WIDTH / 2 }}
        >
          <Pressable style={{ flex: 1 }} onPress={goBack} />
        </View>
        <View
          style={{ position: "absolute", top: 120, bottom: 100, right: 0, width: SCREEN_WIDTH / 2 }}
        >
          <Pressable style={{ flex: 1 }} onPress={advance} />
        </View>
      </Pressable>
    </View>
  );
}
