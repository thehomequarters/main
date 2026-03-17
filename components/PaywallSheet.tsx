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
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.white,
          padding: 28,
          paddingTop: 60,
          paddingBottom: 52,
          justifyContent: "center",
        }}
      >
        <Pressable onPress={onClose} style={{ position: "absolute", top: 60, right: 28 }}>
          <Ionicons name="close" size={24} color={colors.stone} />
        </Pressable>

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
      </View>
    </Modal>
  );
}
