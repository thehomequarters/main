import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
  Image,
} from "react-native";

import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { MembershipCard } from "@/components/MembershipCard";
import { GraceBanner } from "@/components/GraceBanner";

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  showBadge?: boolean;
  danger?: boolean;
}

function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
  showBadge,
  danger,
}: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: danger
            ? "rgba(229, 57, 53, 0.1)"
            : colors.sand,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 14,
        }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={danger ? colors.red : colors.stone}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: danger ? colors.red : colors.dark,
            fontSize: 15,
            fontWeight: "500",
          }}
        >
          {label}
        </Text>
        {subtitle && (
          <Text
            style={{
              color: colors.stone,
              fontSize: 12,
              marginTop: 1,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {showBadge && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.stone,
            marginRight: 8,
          }}
        />
      )}
      {!danger && (
        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      )}
    </Pressable>
  );
}

export default function AccountTab() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isGrace = profile?.membership_status === "accepted";

  const initials =
    (profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "");

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Connect with me on HomeQuarters! I'm ${profile?.first_name} ${profile?.last_name} (${profile?.member_code}).`,
      });
    } catch (e: any) {
      // User cancelled — non-critical
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 66,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
      >
        {/* Profile info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Avatar */}
          <Pressable
            onPress={() => router.push("/profile")}
            style={{ marginRight: 18 }}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  borderWidth: 2,
                  borderColor: colors.border,
                }}
              />
            ) : (
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.sand,
                  borderWidth: 2,
                  borderColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.dark,
                    fontSize: 26,
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  {initials.toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.dark,
                fontSize: 22,
                fontWeight: "700",
              }}
            >
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text
              style={{
                color: colors.stone,
                fontSize: 12,
                letterSpacing: 2,
                marginTop: 2,
              }}
            >
              {profile?.member_code}
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor:
                  profile?.membership_status === "active"
                    ? "rgba(76, 175, 80, 0.12)"
                    : isGrace
                    ? "rgba(245, 166, 35, 0.12)"
                    : colors.sand,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 4,
                marginTop: 6,
              }}
            >
              <Text
                style={{
                  color:
                    profile?.membership_status === "active"
                      ? colors.green
                      : isGrace
                      ? "#F5A623"
                      : colors.stone,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {isGrace ? "GRACE PERIOD" : profile?.membership_status}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginTop: 20,
          }}
        >
          <Pressable
            onPress={() => router.push("/profile")}
            style={{
              flex: 1,
              backgroundColor: colors.white,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.dark,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Edit Profile
            </Text>
          </Pressable>
          <Pressable
            onPress={handleShareProfile}
            accessibilityLabel="Share your profile"
            accessibilityRole="button"
            style={{
              flex: 1,
              backgroundColor: colors.sand,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.dark,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Share Profile
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Grace period banner */}
      <GraceBanner />

      {/* Membership Card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
        <MembershipCard
          firstName={profile?.first_name ?? ""}
          lastName={profile?.last_name ?? ""}
          memberCode={profile?.member_code ?? ""}
          status={profile?.membership_status ?? "pending"}
          acceptedAt={profile?.accepted_at}
        />
      </View>

      {/* Menu Section: Membership */}
      <View style={{ marginBottom: 8 }}>
        <Text
          style={{
            color: colors.stone,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            paddingHorizontal: 20,
            marginBottom: 8,
          }}
        >
          Membership
        </Text>
        <View
          style={{
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MenuItem
            icon="card-outline"
            label="Membership Details"
            subtitle="View your membership information"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toast(`${profile?.member_code} · ${profile?.membership_status?.toUpperCase()}`, "info");
            }}
          />
          <MenuItem
            icon="person-circle-outline"
            label="View My Profile"
            subtitle="See how other members see you"
            onPress={() => router.push(`/member/${user?.uid}` as any)}
          />
          <MenuItem
            icon="star-outline"
            label="Nominate a Member"
            subtitle="Extend an invitation to someone you know"
            onPress={() => router.push("/nominate")}
          />
          <MenuItem
            icon="card-outline"
            label="Billing & Plan"
            subtitle={
              profile?.membership_status === "active"
                ? profile?.membership_tier === "platinum_card"
                  ? "Platinum · £15/mo — Zim venues & eSIM"
                  : "Gold · £5/mo — diaspora deals"
                : "Choose a plan to activate"
            }
            onPress={() => router.push("/billing" as any)}
          />
        </View>
      </View>

      {/* Menu Section: Activity */}
      <View style={{ marginBottom: 8, marginTop: 20 }}>
        <Text
          style={{
            color: colors.stone,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            paddingHorizontal: 20,
            marginBottom: 8,
          }}
        >
          Activity
        </Text>
        <View
          style={{
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MenuItem
            icon="chatbubble-outline"
            label="Messages"
            subtitle="Chat with other members"
            onPress={() => router.push("/messages")}
          />
          <MenuItem
            icon="calendar-outline"
            label="My Bookings"
            subtitle="View upcoming event bookings"
            showBadge
            onPress={() => router.push("/bookings")}
          />
          <MenuItem
            icon="receipt-outline"
            label="Redemption History"
            subtitle="Deals you've redeemed"
            onPress={() => router.push("/redemptions")}
          />
          <MenuItem
            icon="heart-outline"
            label="Saved Venues"
            subtitle="Your favourite spots"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toast("Saved venues coming soon — favourite your go-to spots.", "info");
            }}
          />
          <MenuItem
            icon="airplane-outline"
            label="eSIM & Travel"
            subtitle={isGrace ? "Activate to unlock eSIM perks" : "Get connected in Zimbabwe with Airalo"}
            onPress={() => router.push(isGrace ? "/activate" : ("/esim-intro" as any))}
          />
        </View>
      </View>

      {/* Menu Section: Settings */}
      <View style={{ marginBottom: 8, marginTop: 20 }}>
        <Text
          style={{
            color: colors.stone,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            paddingHorizontal: 20,
            marginBottom: 8,
          }}
        >
          Settings
        </Text>
        <View
          style={{
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            subtitle="Connection requests, messages, and updates"
            onPress={() => router.push("/notifications")}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Privacy"
            subtitle="Control your visibility to members"
            onPress={() => router.push("/privacy")}
          />
          <MenuItem
            icon="document-text-outline"
            label="Privacy Policy"
            subtitle="How we collect and use your data"
            onPress={() => router.push("/policy" as any)}
          />
          <MenuItem
            icon="reader-outline"
            label="Terms of Service"
            subtitle="Membership terms and conditions"
            onPress={() => router.push("/terms" as any)}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="House Rules"
            subtitle="Review the house rules"
            onPress={() => router.push("/house-rules-intro" as any)}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            subtitle="Get help or send feedback"
            onPress={() => router.push("/help")}
          />
        </View>
      </View>

      {/* Sign Out / Delete */}
      <View style={{ marginTop: 20 }}>
        <View
          style={{
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            danger
          />
          <MenuItem
            icon="trash-outline"
            label="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={() => router.push("/delete-account" as any)}
            danger
          />
        </View>
      </View>

      {/* App version */}
      <Text
        style={{
          color: colors.border,
          fontSize: 11,
          textAlign: "center",
          marginTop: 24,
        }}
      >
        HomeQuarters v1.0.0
      </Text>
    </ScrollView>
  );
}
