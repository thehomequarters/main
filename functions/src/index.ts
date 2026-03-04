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
// Deletes a Firebase Auth user and cascades to remove their profile,
// posts, bookings, and unused invites. Requires caller in /admins.
// ─────────────────────────────────────────────
export const deleteAuthUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated.");
  }

  // Verify caller is an admin
  const db = getFirestore();
  const adminDoc = await db.doc(`admins/${request.auth.uid}`).get();
  if (!adminDoc.exists) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }

  const uid = request.data?.uid as string | undefined;
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  // Basic UID format validation
  if (!/^[a-zA-Z0-9]{20,128}$/.test(uid)) {
    throw new HttpsError("invalid-argument", "Invalid uid format.");
  }

  // Prevent admins from deleting themselves
  if (uid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Cannot delete your own account.");
  }

  // Cascade: collect all data to remove
  const [postsSnap, bookingsSnap, invitesSnap] = await Promise.all([
    db.collection("posts").where("author_id", "==", uid).get(),
    db.collection("bookings").where("user_id", "==", uid).get(),
    db.collection("invites").where("created_by", "==", uid).get(),
  ]);

  const unusedInvites = invitesSnap.docs.filter((d) => !d.data().used);

  // Batch delete (Firestore batch limit is 500 writes)
  const batch = db.batch();
  postsSnap.docs.forEach((d) => batch.delete(d.ref));
  bookingsSnap.docs.forEach((d) => batch.delete(d.ref));
  unusedInvites.forEach((d) => batch.delete(d.ref));
  batch.delete(db.doc(`profiles/${uid}`));
  await batch.commit();

  // Delete the Firebase Auth account
  await getAuth().deleteUser(uid);

  // Write an audit log entry
  await db.collection("admin_audit_logs").add({
    action: "delete_user",
    target_uid: uid,
    performed_by: request.auth.uid,
    performed_at: new Date().toISOString(),
    cascade: {
      posts_deleted: postsSnap.size,
      bookings_deleted: bookingsSnap.size,
      invites_deleted: unusedInvites.length,
    },
  });

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
