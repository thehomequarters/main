import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TYPE_CONFIG: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { icon: "checkmark-circle",  color: "#4CAF50", bg: "#1A2E1A" },
  error:   { icon: "alert-circle",      color: "#EF5350", bg: "#2E1A1A" },
  info:    { icon: "information-circle", color: "#9A8E82", bg: "#252320" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [config, setConfig] = useState<ToastConfig>({ message: "", type: "info" });
  const [visible, setVisible] = useState(false);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 120, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,   duration: 220, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [translateY, opacity]);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 3200) => {
      if (timer.current) clearTimeout(timer.current);
      setConfig({ message, type, duration });
      setVisible(true);

      // Reset and animate in
      translateY.setValue(120);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.timing(opacity,    { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();

      timer.current = setTimeout(hide, duration);
    },
    [translateY, opacity, hide]
  );

  const cfg = TYPE_CONFIG[config.type ?? "info"];

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.wrap,
            { bottom: insets.bottom + 100, transform: [{ translateY }], opacity },
          ]}
          pointerEvents="box-none"
        >
          <Pressable onPress={hide} style={[styles.pill, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={18} color={cfg.color} />
            <Text style={styles.message} numberOfLines={3}>
              {config.message}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 9999,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 100,
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  message: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
});
