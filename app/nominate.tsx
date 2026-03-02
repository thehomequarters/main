import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const MAX_NOMINATIONS = 3;

function genInviteCode() {
  const s = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HQ-${s()}-${s()}`;
}

type Tab = "send" | "vouch";

export default function NominateScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("send");

  // Send nomination tab
  const [recipientEmail, setRecipientEmail] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sentInvites, setSentInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Vouch tab
  const [vouchCode, setVouchCode] = useState("");
  const [vouching, setVouching] = useState(false);

  const nominationsUsed = profile?.nominations_used ?? 0;
  const nominationsLeft = Math.max(0, MAX_NOMINATIONS - nominationsUsed);
  const canNominate = nominationsLeft > 0;

  const fetchSentInvites = useCallback(async () => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "invites"),
      where("created_by", "==", user.uid)
    );
    const snap = await getDocs(q);
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    setSentInvites(list);
    setLoadingInvites(false);
  }, [user?.uid]);

  useEffect(() => {
    fetchSentInvites();
  }, [fetchSentInvites]);

  const handleSendNomination = async () => {
    if (!user?.uid || !profile) return;
    if (!canNominate) return;
    if (!recipientEmail.trim()) {
      Alert.alert("Enter the email of the person you wish to nominate.");
      return;
    }

    setSending(true);
    try {
      const code = genInviteCode();
      await setDoc(doc(db, "invites", code), {
        code,
        created_by: user.uid,
        created_by_name: `${profile.first_name} ${profile.last_name}`,
        invited_email: recipientEmail.trim().toLowerCase(),
        note: note.trim() || null,
        used: false,
        used_by: null,
        used_at: null,
        created_at: new Date().toISOString(),
        expires_at: null,
      });

      // Decrement nominations remaining on sender's profile
      await updateDoc(doc(db, "profiles", user.uid), {
        nominations_used: increment(1),
      });

      await refreshProfile();

      // Share the code
      await Share.share({
        message:
          `You have been nominated for HomeQuarters — a private members' community.\n\n` +
          `Your invitation code is:\n\n${code}\n\n` +
          `Download the HomeQuarters app and enter your code to begin your application.\n\n` +
          `This invitation is personal and non-transferable.`,
      });

      setRecipientEmail("");
      setNote("");
      await fetchSentInvites();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSending(false);
    }
  };

  const handleVouch = async () => {
    if (!user?.uid || !profile) return;
    const code = vouchCode.trim().toUpperCase();
    if (!code) {
      Alert.alert("Enter the applicant's application code.");
      return;
    }

    setVouching(true);
    try {
      // Find a pending profile with this application_code
      const q = query(
        collection(db, "profiles"),
        where("application_code", "==", code),
        where("membership_status", "==", "pending")
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        Alert.alert(
          "Not Found",
          "No pending application found with this code. Double-check the code with the applicant."
        );
        return;
      }

      const applicantDoc = snap.docs[0];
      const applicantData = applicantDoc.data();

      // Check: member hasn't already vouched
      if ((applicantData.vouchers ?? []).includes(user.uid)) {
        Alert.alert(
          "Already Vouched",
          "You have already vouched for this applicant."
        );
        return;
      }

      // Check: member isn't vouching for themselves
      if (applicantDoc.id === user.uid) {
        Alert.alert("You cannot vouch for yourself.");
        return;
      }

      const newCount = (applicantData.voucher_count ?? 0) + 1;

      await updateDoc(doc(db, "profiles", applicantDoc.id), {
        vouchers: arrayUnion(user.uid),
        voucher_count: newCount,
      });

      const applicantName = `${applicantData.first_name} ${applicantData.last_name}`;
      const isNowComplete = newCount >= 2;

      Alert.alert(
        "Vouch Submitted",
        isNowComplete
          ? `${applicantName} now has all required nominations and their application has been submitted for review.`
          : `Your vouch for ${applicantName} has been recorded. They need ${2 - newCount} more nomination.`
      );

      setVouchCode("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setVouching(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Nominate</Text>
          <Text style={styles.headerSub}>
            {nominationsLeft} of {MAX_NOMINATIONS} nominations remaining
          </Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        {(["send", "vouch"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
          >
            <Text
              style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}
            >
              {t === "send" ? "Send Invitation" : "Vouch for Applicant"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {tab === "send" ? (
          <>
            {/* Nomination counter */}
            <View style={styles.counterCard}>
              <View style={styles.counterRow}>
                {Array.from({ length: MAX_NOMINATIONS }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.counterPip,
                      i < nominationsUsed
                        ? styles.counterPipUsed
                        : styles.counterPipFree,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.counterLabel}>
                {canNominate
                  ? `You have ${nominationsLeft} nomination${nominationsLeft === 1 ? "" : "s"} remaining`
                  : "You have used all your nominations"}
              </Text>
            </View>

            {canNominate ? (
              <>
                <Text style={styles.sectionLabel}>WHO ARE YOU NOMINATING?</Text>
                <Text style={styles.sectionHint}>
                  You are personally vouching for this person. Only nominate
                  someone you know and trust.
                </Text>

                <Text style={styles.fieldLabel}>THEIR EMAIL ADDRESS</Text>
                <TextInput
                  placeholder="their@email.com"
                  placeholderTextColor={colors.grey}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />

                <Text style={styles.fieldLabel}>PERSONAL NOTE (OPTIONAL)</Text>
                <TextInput
                  placeholder="How do you know this person? What would they bring to HQ?"
                  placeholderTextColor={colors.grey}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  style={[styles.input, styles.inputMultiline]}
                />

                <Pressable
                  onPress={handleSendNomination}
                  disabled={sending}
                  style={[styles.btn, { opacity: sending ? 0.6 : 1 }]}
                >
                  <Ionicons
                    name="send-outline"
                    size={16}
                    color={colors.black}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.btnText}>
                    {sending ? "Sending..." : "Send Nomination"}
                  </Text>
                </Pressable>

                <Text style={styles.disclaimer}>
                  Once sent, this nomination cannot be revoked. Your name is
                  attached to this invitation as a guarantor.
                </Text>
              </>
            ) : (
              <View style={styles.exhaustedCard}>
                <Ionicons
                  name="lock-closed-outline"
                  size={32}
                  color={colors.darkBorder}
                />
                <Text style={styles.exhaustedTitle}>
                  Nominations exhausted
                </Text>
                <Text style={styles.exhaustedSub}>
                  You have used all {MAX_NOMINATIONS} of your nominations. Additional
                  nominations may be granted by the membership committee.
                </Text>
              </View>
            )}

            {/* Sent invitations history */}
            {!loadingInvites && sentInvites.length > 0 && (
              <View style={{ marginTop: 32 }}>
                <Text style={styles.sectionLabel}>YOUR SENT NOMINATIONS</Text>
                {sentInvites.map((invite: any) => (
                  <View key={invite.id} style={styles.inviteRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inviteEmail}>
                        {invite.invited_email ?? "—"}
                      </Text>
                      <Text style={styles.inviteCode}>{invite.id}</Text>
                    </View>
                    <View
                      style={[
                        styles.inviteStatus,
                        invite.used
                          ? styles.inviteStatusUsed
                          : styles.inviteStatusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.inviteStatusText,
                          invite.used && styles.inviteStatusTextUsed,
                        ]}
                      >
                        {invite.used ? "Applied" : "Pending"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          /* ─── Vouch for applicant tab ─── */
          <>
            <Text style={styles.sectionLabel}>VOUCH FOR A PENDING APPLICANT</Text>
            <Text style={styles.sectionHint}>
              If someone you know has already applied and needs a second
              nomination, enter their application code below to vouch for them.
            </Text>

            <View style={styles.vouchInfoCard}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={colors.gold}
              />
              <Text style={styles.vouchInfoText}>
                Vouching is a serious responsibility. You are adding your name as
                a second guarantor for this person's membership.
              </Text>
            </View>

            <Text style={styles.fieldLabel}>APPLICANT'S APPLICATION CODE</Text>
            <TextInput
              placeholder="APP-XXXX-XXXX"
              placeholderTextColor="rgba(201,168,76,0.35)"
              value={vouchCode}
              onChangeText={(t) => setVouchCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[styles.input, styles.codeInput]}
            />

            <Pressable
              onPress={handleVouch}
              disabled={vouching || !vouchCode.trim()}
              style={[
                styles.btn,
                { opacity: vouching || !vouchCode.trim() ? 0.5 : 1 },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={colors.black}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.btnText}>
                {vouching ? "Submitting..." : "Add My Vouch"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  headerSub: {
    color: colors.grey,
    fontSize: 12,
    marginTop: 1,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(201,168,76,0.12)",
  },
  tabBtnText: {
    color: colors.grey,
    fontSize: 13,
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: colors.gold,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  counterCard: {
    backgroundColor: colors.dark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: 18,
    marginBottom: 28,
  },
  counterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  counterPip: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  counterPipUsed: {
    backgroundColor: "rgba(201,168,76,0.3)",
  },
  counterPipFree: {
    backgroundColor: colors.gold,
  },
  counterLabel: {
    color: colors.grey,
    fontSize: 13,
  },
  sectionLabel: {
    color: "rgba(160,160,160,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  sectionHint: {
    color: "rgba(160,160,160,0.65)",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },
  fieldLabel: {
    color: "rgba(160,160,160,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: colors.white,
    fontSize: 15,
    marginBottom: 20,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  codeInput: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 3,
    borderColor: "rgba(201,168,76,0.25)",
  },
  btn: {
    flexDirection: "row",
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  btnText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: "800",
  },
  disclaimer: {
    color: "rgba(160,160,160,0.4)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    fontStyle: "italic",
  },
  exhaustedCard: {
    backgroundColor: colors.dark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  exhaustedTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  exhaustedSub: {
    color: colors.grey,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: 14,
    marginBottom: 10,
  },
  inviteEmail: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  inviteCode: {
    color: colors.grey,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 1,
  },
  inviteStatus: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inviteStatusPending: {
    backgroundColor: "rgba(201,168,76,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.25)",
  },
  inviteStatusUsed: {
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.25)",
  },
  inviteStatusText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  inviteStatusTextUsed: {
    color: "#4CAF50",
  },
  vouchInfoCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(201,168,76,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.2)",
    padding: 14,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  vouchInfoText: {
    color: "rgba(160,160,160,0.7)",
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
});
