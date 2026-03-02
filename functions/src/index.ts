import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  onDocumentUpdated,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

// ─────────────────────────────────────────────
// deleteAuthUser
// Callable from the admin dashboard.
// Deletes a Firebase Auth user and marks their profile as deleted.
// Requires the caller to exist in /admins/{uid}.
// ─────────────────────────────────────────────
export const deleteAuthUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated.");
  }

  const adminDoc = await getFirestore()
    .doc(`admins/${request.auth.uid}`)
    .get();
  if (!adminDoc.exists) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }

  const uid = request.data?.uid as string | undefined;
  if (!uid) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  // Delete the Firebase Auth account
  await getAuth().deleteUser(uid);

  // Remove the Firestore profile document
  await getFirestore().doc(`profiles/${uid}`).delete();

  return { success: true };
});

// ─────────────────────────────────────────────
// onMemberApproved
// Fires when a profile document is updated.
// If membership_status changed to "active", sends a welcome push notification.
// ─────────────────────────────────────────────
export const onMemberApproved = onDocumentUpdated(
  "profiles/{userId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.membership_status === after.membership_status) return;
    if (after.membership_status !== "active") return;

    const pushToken = after.push_token as string | undefined;
    if (!pushToken) return;

    try {
      await getMessaging().send({
        token: pushToken,
        notification: {
          title: "Welcome to HomeQuarters",
          body: `${after.first_name as string}, your membership has been approved. Welcome to the community.`,
        },
        data: { type: "membership_approved" },
      });
    } catch (err) {
      console.error("Failed to send approval notification:", err);
    }
  }
);

// ─────────────────────────────────────────────
// onMemberSuspended
// Fires when a profile document is updated.
// If membership_status changed to "suspended", notifies the member.
// ─────────────────────────────────────────────
export const onMemberSuspended = onDocumentUpdated(
  "profiles/{userId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.membership_status === after.membership_status) return;
    if (after.membership_status !== "suspended") return;

    const pushToken = after.push_token as string | undefined;
    if (!pushToken) return;

    try {
      await getMessaging().send({
        token: pushToken,
        notification: {
          title: "HomeQuarters Membership",
          body: "Your membership has been suspended. Please contact support for more information.",
        },
        data: { type: "membership_suspended" },
      });
    } catch (err) {
      console.error("Failed to send suspension notification:", err);
    }
  }
);

// ─────────────────────────────────────────────
// onNewMessage
// Fires when a new message is created in a conversation.
// Sends a push notification to the recipient.
// ─────────────────────────────────────────────
export const onNewMessage = onDocumentCreated(
  "conversations/{conversationId}/messages/{messageId}",
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const conversationId = event.params.conversationId;

    const convDoc = await getFirestore()
      .doc(`conversations/${conversationId}`)
      .get();
    const conversation = convDoc.data();
    if (!conversation) return;

    const participants = conversation.participants as string[];
    const recipientId = participants.find(
      (p) => p !== (message.sender_id as string)
    );
    if (!recipientId) return;

    const recipientDoc = await getFirestore()
      .doc(`profiles/${recipientId}`)
      .get();
    const recipient = recipientDoc.data();
    if (!recipient?.push_token) return;

    const text = (message.text as string) || "Sent a photo";

    try {
      await getMessaging().send({
        token: recipient.push_token as string,
        notification: {
          title: message.sender_name as string,
          body: text.length > 100 ? text.slice(0, 97) + "..." : text,
        },
        data: {
          type: "message",
          conversationId,
        },
      });
    } catch (err) {
      console.error("Failed to send message notification:", err);
    }
  }
);
