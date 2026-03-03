import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function PrivacyScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [hideCity, setHideCity] = useState(profile?.hide_city ?? false);
  const [hideIndustry, setHideIndustry] = useState(profile?.hide_industry ?? false);
  const [hideInterests, setHideInterests] = useState(profile?.hide_interests ?? false);
  const [hideSocialLinks, setHideSocialLinks] = useState(profile?.hide_social_links ?? false);
  const [allowMessages, setAllowMessages] = useState<"all" | "connections">(
    profile?.allow_messages ?? "all"
  );
  const [saving, setSaving] = useState(false);

  const save = async (patch: Record<string, unknown>) => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "profiles", user.uid), patch);
      await refreshProfile();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (
    field: string,
    current: boolean,
    setter: (v: boolean) => void
  ) => {
    setter(!current);
    await save({ [field]: !current });
  };

  const setMessages = async (value: "all" | "connections") => {
    setAllowMessages(value);
    await save({ allow_messages: value });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Privacy</Text>
          <Text style={styles.headerSub}>Control your visibility to members</Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="eye-outline" size={16} color={colors.gold} />
        <Text style={styles.infoBannerText}>
          Your name and photo are always visible to active members. These settings
          control additional profile details.
        </Text>
      </View>

      {/* Profile visibility */}
      <Text style={styles.sectionLabel}>PROFILE DETAILS</Text>
      <View style={styles.card}>
        <ToggleRow
          icon="location-outline"
          label="Show City"
          subtitle="Let members see where you're based"
          value={!hideCity}
          onToggle={() => toggle("hide_city", hideCity, setHideCity)}
          disabled={saving}
        />
        <View style={styles.divider} />
        <ToggleRow
          icon="briefcase-outline"
          label="Show Industry"
          subtitle="Display your industry on your profile"
          value={!hideIndustry}
          onToggle={() => toggle("hide_industry", hideIndustry, setHideIndustry)}
          disabled={saving}
        />
        <View style={styles.divider} />
        <ToggleRow
          icon="heart-outline"
          label="Show Interests"
          subtitle="Show your interest tags to other members"
          value={!hideInterests}
          onToggle={() => toggle("hide_interests", hideInterests, setHideInterests)}
          disabled={saving}
        />
        <View style={styles.divider} />
        <ToggleRow
          icon="share-social-outline"
          label="Show Social Links"
          subtitle="Show Instagram and LinkedIn on your profile"
          value={!hideSocialLinks}
          onToggle={() => toggle("hide_social_links", hideSocialLinks, setHideSocialLinks)}
          disabled={saving}
        />
      </View>

      {/* Messaging */}
      <Text style={styles.sectionLabel}>DIRECT MESSAGES</Text>
      <View style={styles.card}>
        <Pressable
          onPress={() => setMessages("all")}
          style={styles.radioRow}
        >
          <View style={styles.radioIconWrap}>
            <Ionicons name="people-outline" size={18} color={colors.grey} />
          </View>
          <View style={styles.radioBody}>
            <Text style={styles.radioLabel}>All members</Text>
            <Text style={styles.radioSub}>Any HQ member can message you</Text>
          </View>
          <View style={[styles.radioCircle, allowMessages === "all" && styles.radioCircleActive]}>
            {allowMessages === "all" && <View style={styles.radioInner} />}
          </View>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          onPress={() => setMessages("connections")}
          style={styles.radioRow}
        >
          <View style={styles.radioIconWrap}>
            <Ionicons name="person-outline" size={18} color={colors.grey} />
          </View>
          <View style={styles.radioBody}>
            <Text style={styles.radioLabel}>Connections only</Text>
            <Text style={styles.radioSub}>Only members you're connected with</Text>
          </View>
          <View style={[styles.radioCircle, allowMessages === "connections" && styles.radioCircleActive]}>
            {allowMessages === "connections" && <View style={styles.radioInner} />}
          </View>
        </Pressable>
      </View>

      {/* Privacy policy link */}
      <Text style={styles.policyNote}>
        Changes are saved automatically. For questions about how your data is
        stored and used, review our full privacy policy below.
      </Text>
    </ScrollView>
  );
}

interface ToggleRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function ToggleRow({ icon, label, subtitle, value, onToggle, disabled }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIconWrap}>
        <Ionicons name={icon} size={18} color={colors.grey} />
      </View>
      <View style={styles.toggleBody}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{
          false: "rgba(160,160,160,0.2)",
          true: "rgba(201,168,76,0.5)",
        }}
        thumbColor={value ? colors.gold : "rgba(160,160,160,0.6)"}
        ios_backgroundColor="rgba(160,160,160,0.2)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scroll: {
    paddingBottom: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "700",
  },
  headerSub: {
    color: colors.grey,
    fontSize: 13,
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: "rgba(201,168,76,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.15)",
    padding: 14,
    alignItems: "flex-start",
  },
  infoBannerText: {
    color: "rgba(160,160,160,0.75)",
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  sectionLabel: {
    color: "rgba(160,160,160,0.45)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.dark,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.darkBorder,
    marginBottom: 28,
  },
  divider: {
    height: 1,
    backgroundColor: colors.darkBorder,
    marginLeft: 68,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  toggleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(160,160,160,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toggleBody: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
  },
  toggleSub: {
    color: colors.grey,
    fontSize: 12,
    marginTop: 1,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  radioIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(160,160,160,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioBody: {
    flex: 1,
  },
  radioLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
  },
  radioSub: {
    color: colors.grey,
    fontSize: 12,
    marginTop: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(160,160,160,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleActive: {
    borderColor: colors.gold,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  policyNote: {
    color: "rgba(160,160,160,0.4)",
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 20,
    textAlign: "center",
  },
});
