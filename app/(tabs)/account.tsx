import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { MembershipCard } from "@/components/MembershipCard";

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
        borderBottomColor: colors.darkBorder,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: danger
            ? "rgba(229, 57, 53, 0.1)"
            : "rgba(160, 160, 160, 0.08)",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 14,
        }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={danger ? colors.red : colors.grey}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: danger ? colors.red : colors.white,
            fontSize: 15,
            fontWeight: "500",
          }}
        >
          {label}
        </Text>
        {subtitle && (
          <Text
            style={{
              color: colors.grey,
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
            backgroundColor: colors.gold,
            marginRight: 8,
          }}
        />
      )}
      {!danger && (
        <Ionicons name="chevron-forward" size={16} color={colors.darkBorder} />
      )}
    </Pressable>
  );
}

export default function AccountTab() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
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
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(201, 168, 76, 0.12)",
              borderWidth: 2,
              borderColor: colors.gold,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 18,
            }}
          >
            <Text
              style={{
                color: colors.gold,
                fontSize: 26,
                fontWeight: "700",
                letterSpacing: 1,
              }}
            >
              {initials.toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.white,
                fontSize: 22,
                fontWeight: "700",
              }}
            >
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text
              style={{
                color: colors.grey,
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
                    ? "rgba(76, 175, 80, 0.15)"
                    : "rgba(201, 168, 76, 0.15)",
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
                      : colors.gold,
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {profile?.membership_status}
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
              backgroundColor: colors.dark,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Edit Profile
            </Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(201, 168, 76, 0.1)",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(201, 168, 76, 0.25)",
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.gold,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Share Profile
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Membership Card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
        <MembershipCard
          firstName={profile?.first_name ?? ""}
          lastName={profile?.last_name ?? ""}
          memberCode={profile?.member_code ?? ""}
          status={profile?.membership_status ?? "pending"}
        />
      </View>

      {/* Menu Section: Membership */}
      <View style={{ marginBottom: 8 }}>
        <Text
          style={{
            color: colors.grey,
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
            backgroundColor: colors.dark,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.darkBorder,
          }}
        >
          <MenuItem
            icon="card-outline"
            label="Membership Details"
            subtitle="View your membership information"
          />
          <MenuItem
            icon="people-outline"
            label="Guest Invitations"
            subtitle="Invite guests to venues"
          />
          <MenuItem
            icon="qr-code-outline"
            label="QR Code"
            subtitle="Show your membership QR"
            onPress={() => router.push("/qr")}
          />
        </View>
      </View>

      {/* Menu Section: Activity */}
      <View style={{ marginBottom: 8, marginTop: 20 }}>
        <Text
          style={{
            color: colors.grey,
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
            backgroundColor: colors.dark,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.darkBorder,
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
          />
        </View>
      </View>

      {/* Menu Section: Settings */}
      <View style={{ marginBottom: 8, marginTop: 20 }}>
        <Text
          style={{
            color: colors.grey,
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
            backgroundColor: colors.dark,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.darkBorder,
          }}
        >
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            subtitle="Manage notification preferences"
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Privacy"
            subtitle="Control your visibility to members"
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="House Rules"
            subtitle="Review the house rules"
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            subtitle="Get help or send feedback"
          />
        </View>
      </View>

      {/* Sign Out */}
      <View style={{ marginTop: 20 }}>
        <View
          style={{
            backgroundColor: colors.dark,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.darkBorder,
          }}
        >
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            danger
          />
        </View>
      </View>

      {/* App version */}
      <Text
        style={{
          color: colors.darkBorder,
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
