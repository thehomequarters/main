import React from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

interface PaywallSheetProps {
  visible: boolean;
  onClose: () => void;
  featureTitle: string;
  featureDescription: string;
}

export function PaywallSheet({
  visible,
  onClose,
  featureTitle,
  featureDescription,
}: PaywallSheetProps) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 28,
            paddingBottom: 52,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: colors.border,
              alignSelf: "center", marginBottom: 24,
            }}
          />

          {/* Lock icon */}
          <View
            style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: colors.sand,
              borderWidth: 1, borderColor: colors.border,
              justifyContent: "center", alignItems: "center",
              alignSelf: "center", marginBottom: 18,
            }}
          >
            <Ionicons name="lock-closed-outline" size={24} color={colors.dark} />
          </View>

          <Text
            style={{
              color: colors.dark, fontSize: 20, fontWeight: "700",
              textAlign: "center", marginBottom: 10,
            }}
          >
            {featureTitle}
          </Text>

          <Text
            style={{
              color: colors.stone, fontSize: 14, lineHeight: 22,
              textAlign: "center", marginBottom: 28,
            }}
          >
            {featureDescription}
          </Text>

          <Pressable
            onPress={() => { onClose(); router.push("/activate"); }}
            style={{
              backgroundColor: colors.dark,
              borderRadius: 12, paddingVertical: 16,
              alignItems: "center", marginBottom: 14,
            }}
          >
            <Text style={{ color: colors.white, fontSize: 15, fontWeight: "700" }}>
              Activate Membership
            </Text>
          </Pressable>

          <Text style={{ color: colors.stone, fontSize: 12, textAlign: "center" }}>
            Join active members already enjoying these benefits
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
