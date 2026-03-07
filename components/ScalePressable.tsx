import React, { useRef } from "react";
import { Animated, Pressable, StyleProp, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

interface ScalePressableProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  haptic?: "light" | "medium" | "none";
  scale?: number;
  disabled?: boolean;
}

/**
 * Drop-in Pressable replacement that springs on press and optionally fires haptics.
 * Use for primary CTAs, cards, and interactive tiles.
 */
export function ScalePressable({
  onPress,
  style,
  children,
  haptic = "light",
  scale = 0.96,
  disabled = false,
}: ScalePressableProps) {
  const anim = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(anim, {
      toValue: scale,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    if (haptic === "light") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (haptic === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: anim }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
