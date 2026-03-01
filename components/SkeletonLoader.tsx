import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { colors } from "@/constants/theme";

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonLoader({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const backgroundColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.dark, colors.darkBorder],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}
