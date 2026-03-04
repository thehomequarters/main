import React from "react";
import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const FAQ = [
  {
    question: "How do I redeem a benefit?",
    answer:
      "Visit a partner venue, open the venue page in the app, tap 'Redeem Benefit', and show the QR code to staff. They'll scan it and confirm your benefit.",
  },
  {
    question: "Can I bring guests to events?",
    answer:
      "Most events allow guests. Check the event details for guest policies. Some exclusive events are members-only.",
  },
  {
    question: "How do connections work?",
    answer:
      "When you send a connection request, the other member will see it on their Discover tab. Once they accept, you can message each other directly.",
  },
  {
    question: "Why is my account pending?",
    answer:
      "New applications are reviewed by our team to maintain community quality. You'll receive an update once your application has been reviewed.",
  },
  {
    question: "How do I update my profile?",
    answer:
      "Go to Account > Edit Profile to update your name, bio, title, city, industry, interests, and avatar.",
  },
];

export default function HelpScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.dark,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </Pressable>
        <View>
          <Text
            style={{
              color: colors.white,
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            Help & Support
          </Text>
          <Text style={{ color: colors.grey, fontSize: 13, marginTop: 2 }}>
            We're here for you
          </Text>
        </View>
      </View>

      {/* Contact options */}
      <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 12 }}>
        <Pressable
          onPress={() => Linking.openURL("mailto:hello@homequarters.co.uk")}
          accessibilityLabel="Email support"
          accessibilityRole="button"
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.dark,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            padding: 16,
            gap: 14,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "rgba(201, 168, 76, 0.1)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="mail-outline" size={20} color={colors.stone} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.white,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Email Us
            </Text>
            <Text style={{ color: colors.grey, fontSize: 12, marginTop: 1 }}>
              hello@homequarters.co.uk
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.darkBorder}
          />
        </Pressable>

        <Pressable
          onPress={() =>
            Linking.openURL("https://instagram.com/homequartersapp")
          }
          accessibilityLabel="Contact on Instagram"
          accessibilityRole="button"
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.dark,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            padding: 16,
            gap: 14,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "rgba(201, 168, 76, 0.1)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="logo-instagram" size={20} color={colors.stone} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.white,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Instagram
            </Text>
            <Text style={{ color: colors.grey, fontSize: 12, marginTop: 1 }}>
              @homequartersapp
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.darkBorder}
          />
        </Pressable>
      </View>

      {/* FAQ section */}
      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 4,
              height: 20,
              borderRadius: 2,
              backgroundColor: colors.stone,
            }}
          />
          <Text
            style={{
              color: colors.white,
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            Frequently Asked Questions
          </Text>
        </View>

        {FAQ.map((item) => (
          <View
            key={item.question}
            style={{
              backgroundColor: colors.dark,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              padding: 16,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              {item.question}
            </Text>
            <Text
              style={{
                color: colors.grey,
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              {item.answer}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
