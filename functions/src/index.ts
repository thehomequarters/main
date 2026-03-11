import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as crypto from "crypto";
import {
  onDocumentUpdated,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import Stripe from "stripe";
import { Resend } from "resend";
import {
  applicationReceivedHtml, applicationReceivedText,
  membershipApprovedHtml, membershipApprovedText,
  applicationRejectedHtml, applicationRejectedText,
  membershipSuspendedHtml, membershipSuspendedText,
  passwordResetHtml, passwordResetText,
  vouchReceivedHtml, vouchReceivedText,
  applicationCompleteHtml, applicationCompleteText,
  friendAcceptedHtml, friendAcceptedText,
  inviteeAppliedHtml, inviteeAppliedText,
  webApplicationReceivedHtml, webApplicationReceivedText,
  founderWelcomeText,
  welcomeFeaturesTourHtml, welcomeFeaturesTourText,
  welcomeDiscoverNudgeHtml, welcomeDiscoverNudgeText,
  membershipAcceptedHtml, membershipAcceptedText,
  graceReminderHtml, graceReminderText,
  foundingMemberText,
  committeeMemberText,
} from "./emails";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const resendApiKey = defineSecret("RESEND_API_KEY");

const FROM_EMAIL = "HomeQuarters <noreply@email.thehomequarters.com>";
const FOUNDER_EMAIL = "Valentine Eluwasi <hello@email.thehomequarters.com>";

async function sendEmail(opts: {
  to: string;
  subject: string;
  html?: string;
  text: string;
  apiKey: string;
  from?: string;
  scheduledAt?: Date;
}): Promise<string | null> {
  const resend = new Resend(opts.apiKey);
  const payload: Parameters<typeof resend.emails.send>[0] = {
    from: opts.from ?? FROM_EMAIL,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    ...(opts.html ? { html: opts.html } : {}),
    ...(opts.scheduledAt ? { scheduledAt: opts.scheduledAt.toISOString() } : {}),
  };
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    console.error("Resend error:", error);
    return null;
  }
  return data?.id ?? null;
}

initializeApp();

// ─────────────────────────────────────────────
// onApplicationReceived
// Fires when a new profile document is created (i.e. someone submits
// an application). Sends a branded confirmation email with their code.
// Also notifies the inviter if the applicant used an invitation code.
// ─────────────────────────────────────────────
export const onApplicationReceived = onDocumentCreated(
  { document: "profiles/{userId}", secrets: [resendApiKey] },
  async (event) => {
    const profile = event.data?.data();
    if (!profile) return;
    if (!profile.email || typeof profile.email !== "string") return;

    const status = profile.membership_status as string;
    if (status !== "pending" && status !== "open_application") return;

    const db = getFirestore();
    const firstName = (profile.first_name as string) ?? "there";
    const applicationCode = (profile.application_code as string) ?? "";
    const applicationType = (profile.application_type as "invited" | "open") ?? "open";

    // Send confirmation to the applicant
    try {
      await sendEmail({
        to: profile.email,
        subject: "Your HomeQuarters application is with us",
        html: applicationReceivedHtml({ firstName, applicationCode, applicationType }),
        text: applicationReceivedText({ firstName, applicationCode }),
        apiKey: resendApiKey.value(),
      });
    } catch (err) {
      console.error("Failed to send application received email:", err);
    }

    // If invited, notify the person who sent the invite code
    if (applicationType === "invited" && applicationCode) {
      try {
        // Find the invite record to get the inviter's UID
        const inviteSnap = await db
          .collection("invites")
          .where("used_by", "==", event.params.userId)
          .limit(1)
          .get();

        const inviteDoc = inviteSnap.empty ? null : inviteSnap.docs[0].data();
        const inviterUid = inviteDoc?.created_by as string | undefined;

        if (inviterUid) {
          const inviterDoc = await db.doc(`profiles/${inviterUid}`).get();
          const inviter = inviterDoc.data();
          if (inviter?.email && typeof inviter.email === "string") {
            const inviteeName = `${firstName} ${(profile.last_name as string) ?? ""}`.trim();
            await sendEmail({
              to: inviter.email,
              subject: `${firstName} has applied to HomeQuarters`,
              html: inviteeAppliedHtml({
                firstName: (inviter.first_name as string) ?? "there",
                inviteeName,
              }),
              text: inviteeAppliedText({
                firstName: (inviter.first_name as string) ?? "there",
                inviteeName,
              }),
              apiKey: resendApiKey.value(),
            });
          }
        }
      } catch (err) {
        console.error("Failed to send invitee-applied email to inviter:", err);
      }
    }
  }
);

// ─────────────────────────────────────────────
// onApplicationRejected
// Fires when membership_status changes to "rejected".
// ─────────────────────────────────────────────
export const onApplicationRejected = onDocumentUpdated(
  { document: "profiles/{userId}", secrets: [resendApiKey] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.membership_status === after.membership_status) return;
    if (after.membership_status !== "rejected") return;
    if (!after.email || typeof after.email !== "string") return;

    try {
      await sendEmail({
        to: after.email,
        subject: "HomeQuarters — Membership Decision",
        html: applicationRejectedHtml({ firstName: after.first_name as string ?? "there" }),
        text: applicationRejectedText({ firstName: after.first_name as string ?? "there" }),
        apiKey: resendApiKey.value(),
      });
    } catch (err) {
      console.error("Failed to send rejection email:", err);
    }
  }
);

// ─────────────────────────────────────────────
// sendPasswordReset
// Callable from the app. Generates a Firebase Auth password-reset link
// and sends it via Resend with full HQ branding.
// ─────────────────────────────────────────────
export const sendPasswordReset = onCall(
  { secrets: [resendApiKey] },
  async (request) => {
    const email = request.data?.email as string | undefined;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "A valid email address is required.");
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Generate a branded reset link via Admin SDK
    let resetLink: string;
    try {
      resetLink = await getAuth().generatePasswordResetLink(sanitizedEmail, {
        url: process.env.APP_BASE_URL ?? "https://thehomequarters.com",
      });
    } catch (err: any) {
      // If the user doesn't exist, return success to avoid email enumeration
      if (err?.code === "auth/user-not-found") {
        return { sent: true };
      }
      throw new HttpsError("internal", "Could not generate reset link.");
    }

    // Look up first name for personalised greeting
    let firstName: string | undefined;
    try {
      const snap = await getFirestore()
        .collection("profiles")
        .where("email", "==", sanitizedEmail)
        .limit(1)
        .get();
      if (!snap.empty) {
        firstName = snap.docs[0].data().first_name as string | undefined;
      }
    } catch {
      // Non-fatal — send without first name
    }

    try {
      await sendEmail({
        to: sanitizedEmail,
        subject: "Reset your HomeQuarters password",
        html: passwordResetHtml({ firstName, resetLink }),
        text: passwordResetText({ firstName, resetLink }),
        apiKey: resendApiKey.value(),
      });
    } catch (err) {
      console.error("Failed to send password reset email:", err);
      throw new HttpsError("internal", "Could not send reset email.");
    }

    return { sent: true };
  }
);

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
  { document: "profiles/{userId}", secrets: [resendApiKey] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.membership_status === after.membership_status) return;
    if (after.membership_status !== "active") return;

    // Push notification
    const pushToken = after.push_token as string | undefined;
    if (pushToken) {
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
        console.error("Failed to send approval push notification:", err);
      }
    }

    // Email the new member
    if (after.email && typeof after.email === "string") {
      try {
        await sendEmail({
          to: after.email,
          subject: `Welcome to HomeQuarters, ${after.first_name ?? ""}`.trim(),
          html: membershipApprovedHtml({
            firstName: after.first_name as string ?? "there",
            memberCode: after.member_code as string ?? "",
          }),
          text: membershipApprovedText({
            firstName: after.first_name as string ?? "there",
            memberCode: after.member_code as string ?? "",
          }),
          apiKey: resendApiKey.value(),
        });
      } catch (err) {
        console.error("Failed to send approval email:", err);
      }
    }

    // ── Welcome journey: 3 emails scheduled over 10 days ──
    // Resend allows 2 req/s — space calls 600ms apart to stay within the limit.
    if (after.email && typeof after.email === "string") {
      const firstName = (after.first_name as string) ?? "there";
      const now = Date.now();
      const pause = () => new Promise<void>((r) => setTimeout(r, 600));

      // Email 1 — 6 hours after acceptance: Personal plain-text note from Valentine
      await pause();
      const day1 = new Date(now + 6 * 60 * 60 * 1000);
      try {
        await sendEmail({
          from: FOUNDER_EMAIL,
          to: after.email,
          subject: "A personal welcome from me",
          text: founderWelcomeText({ firstName }),
          apiKey: resendApiKey.value(),
          scheduledAt: day1,
        });
      } catch (err) {
        console.error("Failed to schedule founder welcome email:", err);
      }

      // Email 2 — Day 4: Branded features tour
      await pause();
      const day4 = new Date(now + 4 * 24 * 60 * 60 * 1000);
      try {
        await sendEmail({
          to: after.email,
          subject: "Everything that comes with HQ",
          html: welcomeFeaturesTourHtml({ firstName }),
          text: welcomeFeaturesTourText({ firstName }),
          apiKey: resendApiKey.value(),
          scheduledAt: day4,
        });
      } catch (err) {
        console.error("Failed to schedule features tour email:", err);
      }

      // Email 3 — Day 8: Discover nudge
      await pause();
      const day10 = new Date(now + 8 * 24 * 60 * 60 * 1000);
      try {
        await sendEmail({
          to: after.email,
          subject: "Your community is waiting to hear from you",
          html: welcomeDiscoverNudgeHtml({ firstName }),
          text: welcomeDiscoverNudgeText({ firstName }),
          apiKey: resendApiKey.value(),
          scheduledAt: day10,
        });
      } catch (err) {
        console.error("Failed to schedule discover nudge email:", err);
      }
    }

    // Notify all vouchers that their friend was accepted — serialised to respect rate limit
    const vouchers = (after.vouchers as string[]) ?? [];
    if (vouchers.length > 0) {
      const db = getFirestore();
      const pause = () => new Promise<void>((r) => setTimeout(r, 600));
      for (const voucherUid of vouchers) {
        await pause();
        try {
          const voucherDoc = await db.doc(`profiles/${voucherUid}`).get();
          const voucher = voucherDoc.data();
          if (!voucher?.email || typeof voucher.email !== "string") continue;
          await sendEmail({
            to: voucher.email,
            subject: `${after.first_name ?? "Your friend"} has been accepted to HomeQuarters`,
            html: friendAcceptedHtml({
              firstName: (voucher.first_name as string) ?? "there",
              friendFirstName: (after.first_name as string) ?? "",
              friendLastName: (after.last_name as string) ?? "",
            }),
            text: friendAcceptedText({
              firstName: (voucher.first_name as string) ?? "there",
              friendFirstName: (after.first_name as string) ?? "",
              friendLastName: (after.last_name as string) ?? "",
            }),
            apiKey: resendApiKey.value(),
          });
        } catch (err) {
          console.error(`Failed to send friend-accepted email to voucher ${voucherUid}:`, err);
        }
      }
    }
  }
);

// ─────────────────────────────────────────────
// onMemberAccepted
// Fires when a profile document is updated.
// If membership_status changed to "accepted":
//   — Stamps accepted_at on the profile (used by push notification scheduler)
//   — Immediately sends a welcome + payment CTA email
//   — Schedules 3 grace period reminder emails (day 10, 20, 30)
//   — Stores the 3 Resend email IDs in grace_email_ids so they can be
//     cancelled by onPaymentActivated if the member pays before they fire
// ─────────────────────────────────────────────
export const onMemberAccepted = onDocumentUpdated(
  { document: "profiles/{userId}", secrets: [resendApiKey] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.membership_status === after.membership_status) return;
    if (after.membership_status !== "accepted") return;
    if (!after.email || typeof after.email !== "string") return;

    const firstName = (after.first_name as string) ?? "there";
    const memberCode = (after.member_code as string) ?? "";
    const now = Date.now();
    const acceptedAt = new Date(now).toISOString();

    // Stamp accepted_at on the profile so the push scheduler can calculate timing
    const db = getFirestore();
    await db.doc(`profiles/${event.params.userId}`).update({ accepted_at: acceptedAt });

    // Resend allows 2 req/s. Space the 4 email calls 600ms apart to stay within the limit.
    const pause = () => new Promise<void>((r) => setTimeout(r, 600));

    // Immediate: acceptance email with 30-day grace period intro + payment CTA
    try {
      await sendEmail({
        to: after.email,
        subject: `You're in, ${firstName} — 30 days to explore HomeQuarters`,
        html: membershipAcceptedHtml({ firstName, memberCode }),
        text: membershipAcceptedText({ firstName, memberCode }),
        apiKey: resendApiKey.value(),
      });
    } catch (err) {
      console.error("Failed to send acceptance email:", err);
    }

    // Schedule grace reminder emails and collect their Resend IDs.
    // IDs are stored on the profile so onPaymentActivated can cancel them.
    const gracEmailIds: string[] = [];

    // Day 10 reminder — 20 days remaining
    await pause();
    try {
      const id = await sendEmail({
        to: after.email,
        subject: `Your HomeQuarters membership is waiting, ${firstName}`,
        html: graceReminderHtml({ firstName, daysRemaining: 20, reminderNumber: 1 }),
        text: graceReminderText({ firstName, daysRemaining: 20, reminderNumber: 1 }),
        apiKey: resendApiKey.value(),
        scheduledAt: new Date(now + 10 * 24 * 60 * 60 * 1000),
      });
      if (id) gracEmailIds.push(id);
    } catch (err) {
      console.error("Failed to schedule day 10 grace reminder:", err);
    }

    // Day 20 reminder — 10 days remaining
    await pause();
    try {
      const id = await sendEmail({
        to: after.email,
        subject: `10 days left on your free trial — keep the momentum going`,
        html: graceReminderHtml({ firstName, daysRemaining: 10, reminderNumber: 2 }),
        text: graceReminderText({ firstName, daysRemaining: 10, reminderNumber: 2 }),
        apiKey: resendApiKey.value(),
        scheduledAt: new Date(now + 20 * 24 * 60 * 60 * 1000),
      });
      if (id) gracEmailIds.push(id);
    } catch (err) {
      console.error("Failed to schedule day 20 grace reminder:", err);
    }

    // Day 30 reminder — last day
    await pause();
    try {
      const id = await sendEmail({
        to: after.email,
        subject: "Today is the last day of your HomeQuarters free trial",
        html: graceReminderHtml({ firstName, daysRemaining: 0, reminderNumber: 3 }),
        text: graceReminderText({ firstName, daysRemaining: 0, reminderNumber: 3 }),
        apiKey: resendApiKey.value(),
        scheduledAt: new Date(now + 30 * 24 * 60 * 60 * 1000),
      });
      if (id) gracEmailIds.push(id);
    } catch (err) {
      console.error("Failed to schedule day 30 grace reminder:", err);
    }

    if (gracEmailIds.length > 0) {
      await db.doc(`profiles/${event.params.userId}`).update({
        grace_email_ids: gracEmailIds,
      });
    }
  }
);

// ─────────────────────────────────────────────
// onPaymentActivated
// Fires when a profile document is updated.
// If stripe_customer_id is newly set (member just paid), cancel any
// pending Resend grace-period reminder emails stored in grace_email_ids.
// Also clears the IDs so the field doesn't linger.
// ─────────────────────────────────────────────
export const onPaymentActivated = onDocumentUpdated(
  { document: "profiles/{userId}", secrets: [resendApiKey] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    // Only fire when stripe_customer_id is newly written (i.e. first payment)
    if (before.stripe_customer_id || !after.stripe_customer_id) return;

    const emailIds = (after.grace_email_ids as string[] | undefined) ?? [];
    if (emailIds.length === 0) return;

    const resend = new Resend(resendApiKey.value());
    await Promise.allSettled(
      emailIds.map(async (id) => {
        try {
          await resend.emails.cancel(id);
          console.log(`Cancelled grace email ${id} for ${event.params.userId}`);
        } catch (err) {
          console.error(`Failed to cancel grace email ${id}:`, err);
        }
      })
    );

    // Clear stored IDs — no longer needed
    await event.data?.after.ref.update({ grace_email_ids: [] });
  }
);

// ─────────────────────────────────────────────
// sendGracePushNotifications
// Runs daily. Finds accepted members who haven't paid and sends
// push notifications at day 2 (welcome nudge) and day 28 (last chance).
// Tracks sent notifications in grace_push_sent to avoid duplicates.
// ─────────────────────────────────────────────
export const sendGracePushNotifications = onSchedule("every 24 hours", async () => {
  const db = getFirestore();
  const now = Date.now();

  const snap = await db
    .collection("profiles")
    .where("membership_status", "==", "accepted")
    .get();

  for (const doc of snap.docs) {
    const profile = doc.data();

    // Skip if already paid
    if (profile.stripe_customer_id) continue;
    // Skip if no push token
    if (!profile.push_token) continue;
    // Skip if no accepted_at timestamp
    if (!profile.accepted_at) continue;

    const acceptedAt = new Date(profile.accepted_at as string).getTime();
    const daysSince = (now - acceptedAt) / (1000 * 60 * 60 * 24);
    const pushSent = (profile.grace_push_sent as number[] | undefined) ?? [];
    const firstName = (profile.first_name as string) ?? "there";

    // Day 2: "Your membership is waiting" nudge (28 days remaining)
    if (daysSince >= 2 && daysSince < 3 && !pushSent.includes(2)) {
      try {
        await getMessaging().send({
          token: profile.push_token as string,
          notification: {
            title: "Your HQ membership is waiting",
            body: "You have 28 days to explore HomeQuarters free. Take a look whenever you're ready.",
          },
          data: { route: "/billing" },
        });
        await doc.ref.update({ grace_push_sent: [...pushSent, 2] });
        console.log(`Sent day-2 push to ${doc.id} (${firstName})`);
      } catch (err) {
        console.error(`Day-2 push failed for ${doc.id}:`, err);
      }
    }

    // Day 28: last-chance push (2 days remaining)
    const pushSentAfterDay2 = pushSent.includes(2) ? pushSent : [...pushSent, 2];
    if (daysSince >= 28 && daysSince < 29 && !pushSent.includes(28)) {
      try {
        await getMessaging().send({
          token: profile.push_token as string,
          notification: {
            title: "2 days left on your free trial",
            body: "Your HomeQuarters trial ends in 2 days. Choose a plan to keep access.",
          },
          data: { route: "/billing" },
        });
        await doc.ref.update({ grace_push_sent: [...pushSentAfterDay2, 28] });
        console.log(`Sent day-28 push to ${doc.id} (${firstName})`);
      } catch (err) {
        console.error(`Day-28 push failed for ${doc.id}:`, err);
      }
    }
  }
});

// ─────────────────────────────────────────────
// onMemberSuspended
// Fires when a profile document is updated.
// If membership_status changed to "suspended", notifies the member.
// ─────────────────────────────────────────────
export const onMemberSuspended = onDocumentUpdated(
  { document: "profiles/{userId}", secrets: [resendApiKey] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.membership_status === after.membership_status) return;
    if (after.membership_status !== "suspended") return;

    // Push notification
    const pushToken = after.push_token as string | undefined;
    if (pushToken) {
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
        console.error("Failed to send suspension push notification:", err);
      }
    }

    // Email
    if (after.email && typeof after.email === "string") {
      try {
        await sendEmail({
          to: after.email,
          subject: "Your HomeQuarters membership has been suspended",
          html: membershipSuspendedHtml({ firstName: after.first_name as string ?? "there" }),
          text: membershipSuspendedText({ firstName: after.first_name as string ?? "there" }),
          apiKey: resendApiKey.value(),
        });
      } catch (err) {
        console.error("Failed to send suspension email:", err);
      }
    }
  }
);

// ─────────────────────────────────────────────
// onMembershipTierChanged
// Fires when a profile's membership_tier is updated.
// Sends a plain-text email from Valentine when tier becomes
// "founding_member" or "committee_member".
// ─────────────────────────────────────────────
export const onMembershipTierChanged = onDocumentUpdated(
  { document: "profiles/{userId}", secrets: [resendApiKey] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.membership_tier === after.membership_tier) return;

    const tier = after.membership_tier as string | undefined;
    if (tier !== "founding_member" && tier !== "committee_member") return;

    const email = after.email as string | undefined;
    if (!email) return;

    const firstName = (after.first_name as string) ?? "there";

    const subject = tier === "founding_member"
      ? "You're a Founding Member of HomeQuarters"
      : "You've been appointed to the HomeQuarters Committee";

    const text = tier === "founding_member"
      ? foundingMemberText({ firstName })
      : committeeMemberText({ firstName });

    try {
      await sendEmail({
        from: FOUNDER_EMAIL,
        to: email,
        subject,
        text,
        apiKey: resendApiKey.value(),
      });
    } catch (err) {
      console.error("Failed to send membership tier email:", err);
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

// ─────────────────────────────────────────────
// onVouchReceived
// Fires when a profile is updated. Detects a voucher_count increase and:
//  - Notifies the applicant who just received a vouch (including voucher name)
//  - If voucher_count just reached 2, also sends an "application complete" email
// ─────────────────────────────────────────────
const REQUIRED_VOUCHES = 2;

export const onVouchReceived = onDocumentUpdated(
  { document: "profiles/{userId}", secrets: [resendApiKey] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const prevCount = (before.voucher_count as number) ?? 0;
    const newCount = (after.voucher_count as number) ?? 0;
    if (newCount <= prevCount) return; // no new vouch

    // Only notify pending applicants, not active members
    if (after.membership_status !== "pending" && after.membership_status !== "open_application") return;
    if (!after.email || typeof after.email !== "string") return;

    const db = getFirestore();
    const firstName = (after.first_name as string) ?? "there";
    const applicationCode = (after.application_code as string) ?? "";

    // Find which voucher was just added by diffing the arrays
    const prevVouchers = (before.vouchers as string[]) ?? [];
    const newVouchers = (after.vouchers as string[]) ?? [];
    const addedUid = newVouchers.find((uid) => !prevVouchers.includes(uid));

    let voucherName = "A HomeQuarters member";
    let voucherIsElevated = false;
    if (addedUid) {
      try {
        const voucherDoc = await db.doc(`profiles/${addedUid}`).get();
        const voucherData = voucherDoc.data();
        if (voucherData) {
          voucherName = `${voucherData.first_name ?? ""} ${voucherData.last_name ?? ""}`.trim() || voucherName;
          const tier = voucherData.membership_tier as string | undefined;
          voucherIsElevated = tier === "founding_member" || tier === "committee_member";
        }
      } catch {
        // Non-fatal — use default name
      }
    }

    // Committee/founding members count as a single sufficient vouch
    const effectiveRequired = voucherIsElevated ? 1 : REQUIRED_VOUCHES;

    // Send vouch notification
    try {
      await sendEmail({
        to: after.email,
        subject: `${voucherName} vouched for your HomeQuarters application`,
        html: vouchReceivedHtml({ firstName, voucherName, voucherCount: newCount, requiredVouches: effectiveRequired, applicationCode }),
        text: vouchReceivedText({ firstName, voucherName, voucherCount: newCount, requiredVouches: effectiveRequired, applicationCode }),
        apiKey: resendApiKey.value(),
      });
    } catch (err) {
      console.error("Failed to send vouch-received email:", err);
    }

    // If just crossed the threshold, also send "application complete" email
    if (prevCount < effectiveRequired && newCount >= effectiveRequired) {
      try {
        await sendEmail({
          to: after.email,
          subject: "Your HomeQuarters application is now complete",
          html: applicationCompleteHtml({ firstName, applicationCode }),
          text: applicationCompleteText({ firstName, applicationCode }),
          apiKey: resendApiKey.value(),
        });
      } catch (err) {
        console.error("Failed to send application-complete email:", err);
      }
    }
  }
);

// ─────────────────────────────────────────────
// getWebsiteContent
// Public GET endpoint that returns Firestore website_content/main as JSON.
// Consumed by the public website to hydrate CMS-managed copy and images.
// Exposed via Firebase Hosting rewrite at /api/content.
// ─────────────────────────────────────────────
export const getWebsiteContent = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const db = getFirestore();
    const snap = await db.collection("website_content").doc("main").get();
    if (!snap.exists) {
      res.json({});
      return;
    }
    res.set("Cache-Control", "public, max-age=60, s-maxage=60");
    res.json(snap.data());
  } catch (e) {
    console.error("getWebsiteContent error:", e);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// ─────────────────────────────────────────────
// handleWebApplication
// HTTP POST endpoint for the public website application form.
// Saves the submission to open_applications/{id} and sends a
// branded confirmation email to the applicant via Resend.
// Exposed via Firebase Hosting rewrite at /api/webApplication.
// ─────────────────────────────────────────────
export const handleWebApplication = onRequest(
  { cors: true, secrets: [resendApiKey] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const {
      first_name,
      last_name,
      email,
      instagram,
      linkedin,
      about,
      marketing_opt_in,
    } = req.body as Record<string, string | boolean | undefined>;

    // Validate required fields
    if (!first_name?.trim() || !last_name?.trim()) {
      res.status(400).json({ error: "First and last name are required." });
      return;
    }
    if (!email?.trim() || !email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }

    const db = getFirestore();
    const firstName = first_name.trim();
    const lastName = last_name.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    // Save to Firestore
    try {
      await db.collection("open_applications").add({
        first_name: firstName,
        last_name: lastName,
        email: sanitizedEmail,
        instagram: (instagram as string)?.trim() ?? null,
        linkedin: (linkedin as string)?.trim() ?? null,
        about: (about as string)?.trim() ?? null,
        marketing_opt_in: marketing_opt_in === true || marketing_opt_in === "true",
        source: "website",
        submitted_at: new Date().toISOString(),
        status: "received",
      });
    } catch (err) {
      console.error("Failed to save web application:", err);
      res.status(500).json({ error: "Could not save application." });
      return;
    }

    // Send confirmation email to applicant
    try {
      await sendEmail({
        to: sanitizedEmail,
        subject: "Your HomeQuarters application has been received",
        html: webApplicationReceivedHtml({ firstName, email: sanitizedEmail }),
        text: webApplicationReceivedText({ firstName, email: sanitizedEmail }),
        apiKey: resendApiKey.value(),
      });
    } catch (err) {
      console.error("Failed to send web application confirmation email:", err);
      // Non-fatal — application was already saved
    }

    res.json({ ok: true });
  }
);

// ─────────────────────────────────────────────
// handleSubscribe
// HTTP POST — newsletter sign-up from the website popup.
// Saves the email to newsletter_subscribers/{email} (idempotent upsert).
// Exposed via Firebase Hosting rewrite at /api/subscribe.
// ─────────────────────────────────────────────
export const handleSubscribe = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { email } = req.body as Record<string, string | undefined>;
  if (!email?.trim() || !email.includes("@")) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }
  const sanitized = email.trim().toLowerCase();
  try {
    const db = getFirestore();
    // Use email as doc ID so duplicate sign-ups are idempotent
    await db.collection("newsletter_subscribers").doc(sanitized).set({
      email: sanitized,
      subscribed_at: new Date().toISOString(),
      source: "website_popup",
    }, { merge: true });
    res.json({ ok: true });
  } catch (err) {
    console.error("handleSubscribe error:", err);
    res.status(500).json({ error: "Could not save subscription." });
  }
});

// ─────────────────────────────────────────────
// stripeWebhook
// Stripe sends events here when subscription state changes.
// Handles: checkout.session.completed, customer.subscription.updated,
//          customer.subscription.deleted, invoice.payment_failed
// Endpoint URL to register in Stripe dashboard:
//   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/stripeWebhook
// ─────────────────────────────────────────────

// Map Stripe Price ID → membership tier (configured in functions/.env)
// Covers both monthly and annual price IDs — tier is the same regardless of interval.
function tierFromPriceId(
  priceId: string
): "gold_card" | "platinum_card" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_GOLD_PRICE_ID) return "gold_card";
  if (priceId === process.env.STRIPE_PLATINUM_PRICE_ID) return "platinum_card";
  if (priceId === process.env.STRIPE_GOLD_ANNUAL_PRICE_ID) return "gold_card";
  if (priceId === process.env.STRIPE_PLATINUM_ANNUAL_PRICE_ID) return "platinum_card";
  return null;
}

function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id;
}

export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    const stripe = new Stripe(stripeSecretKey.value());
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      res.status(400).send("Webhook signature verification failed");
      return;
    }

    const db = getFirestore();

    try {
      switch (event.type) {
        // ── New subscription created via Payment Link ──
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const uid = session.client_reference_id;
          if (!uid) break;

          // Expand line items to get price ID → map to tier
          const expanded = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["line_items"],
          });
          const priceId = expanded.line_items?.data[0]?.price?.id ?? "";
          const tier = tierFromPriceId(priceId);

          // Get current_period_end and billing interval from subscription
          let periodEnd: string | null = null;
          let billingInterval: string = "month";
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(
              session.subscription as string
            );
            periodEnd = new Date(sub.current_period_end * 1000).toISOString();
            billingInterval = sub.items.data[0]?.plan?.interval ?? "month";
          }

          const update: Record<string, unknown> = {
            stripe_customer_id: customerId(session.customer),
            stripe_subscription_id: session.subscription ?? null,
            subscription_status: "active",
            current_period_end: periodEnd,
            billing_interval: billingInterval,
            membership_status: "active",
          };
          if (tier) update.membership_tier = tier;

          await db.doc(`profiles/${uid}`).update(update);
          break;
        }

        // ── Subscription plan changed or status updated ──
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const custId = customerId(sub.customer);
          if (!custId) break;

          const snap = await db
            .collection("profiles")
            .where("stripe_customer_id", "==", custId)
            .limit(1)
            .get();
          if (snap.empty) break;

          const priceId = sub.items.data[0]?.price?.id ?? "";
          const tier = tierFromPriceId(priceId);
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          const billingInterval = sub.items.data[0]?.plan?.interval ?? "month";

          const update: Record<string, unknown> = {
            subscription_status: sub.status,
            current_period_end: periodEnd,
            billing_interval: billingInterval,
          };
          if (tier) update.membership_tier = tier;
          if (sub.status === "active") update.membership_status = "active";

          await snap.docs[0].ref.update(update);
          break;
        }

        // ── Subscription cancelled (by member via portal, or admin) ──
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const custId = customerId(sub.customer);
          if (!custId) break;

          const snap = await db
            .collection("profiles")
            .where("stripe_customer_id", "==", custId)
            .limit(1)
            .get();
          if (snap.empty) break;

          await snap.docs[0].ref.update({
            subscription_status: "canceled",
            membership_status: "suspended",
            stripe_subscription_id: null,
            current_period_end: null,
          });
          break;
        }

        // ── Payment succeeded (recurring or first invoice) ──
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          const custId = customerId(invoice.customer);
          if (!custId) break;

          // Skip $0 invoices (e.g. trial starts)
          if ((invoice.amount_paid ?? 0) === 0) break;

          const snap = await db
            .collection("profiles")
            .where("stripe_customer_id", "==", custId)
            .limit(1)
            .get();

          const profile = snap.empty ? null : snap.docs[0].data();
          const priceId = invoice.lines?.data[0]?.price?.id ?? "";
          const tier = tierFromPriceId(priceId);

          await db.collection("payments").add({
            stripe_customer_id: custId,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent ?? null,
            stripe_subscription_id: invoice.subscription ?? null,
            user_id: snap.empty ? null : snap.docs[0].id,
            user_name: profile
              ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
              : null,
            email: profile?.email ?? invoice.customer_email ?? null,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            membership_tier: tier,
            status: "succeeded",
            created_at: new Date(invoice.created * 1000).toISOString(),
          });
          break;
        }

        // ── Payment failed (card declined, etc.) ──
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const custId = customerId(invoice.customer);
          if (!custId) break;

          const snap = await db
            .collection("profiles")
            .where("stripe_customer_id", "==", custId)
            .limit(1)
            .get();
          if (snap.empty) break;

          await snap.docs[0].ref.update({ subscription_status: "past_due" });

          const profile = snap.docs[0].data();
          const priceId = invoice.lines?.data[0]?.price?.id ?? "";
          const tier = tierFromPriceId(priceId);

          await db.collection("payments").add({
            stripe_customer_id: custId,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: invoice.payment_intent ?? null,
            stripe_subscription_id: invoice.subscription ?? null,
            user_id: snap.docs[0].id,
            user_name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
            email: profile.email ?? null,
            amount: invoice.amount_due,
            currency: invoice.currency,
            membership_tier: tier,
            status: "failed",
            created_at: new Date(invoice.created * 1000).toISOString(),
          });
          break;
        }

        default:
          // Unhandled event — acknowledge and ignore
          break;
      }
    } catch (err) {
      console.error("Error processing webhook event:", event.type, err);
      res.status(500).send("Internal error");
      return;
    }

    res.json({ received: true });
  }
);

// ─────────────────────────────────────────────
// getStripePortalUrl
// Callable from the app. Creates a Stripe Customer Portal session
// so the member can manage or cancel their subscription without
// touching our backend.
// Requires Customer Portal to be enabled in Stripe dashboard:
//   https://dashboard.stripe.com/settings/billing/portal
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// verifyRedemption
// Public HTTP endpoint — no auth required (security comes from venue PIN + expiring token).
// Called by the /verify page when staff scan a member's QR code.
//
// Body: { token: string, pin: string }
//   token — encodeURIComponent(JSON.stringify(payload)) from the member's QR
//   pin   — 6-digit venue PIN entered by staff
//
// Checks:
//  1. Token structure and timestamp (< 10 minute window, max 60s clock skew)
//  2. Venue PIN matches venue_pins/{venue_id} (Admin SDK — never exposed to clients)
//  3. Member exists and is active
//  4. Deal exists and is active
//  5. No duplicate redemption for same member + deal + venue in the last 24 hours
//
// On success: writes a confirmed redemption and returns member/deal info for the UI.
// ─────────────────────────────────────────────
export const verifyRedemption = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { token, pin } = req.body as { token?: unknown; pin?: unknown };

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Missing token." });
    return;
  }

  if (!pin || typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
    res.status(400).json({ error: "PIN must be 6 digits." });
    return;
  }

  // Decode token
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(decodeURIComponent(token)) as Record<string, unknown>;
  } catch {
    res.status(400).json({ error: "Invalid token." });
    return;
  }

  const { type, member_id, venue_id, deal_id, ts } = payload;

  if (
    type !== "hq_redeem" ||
    typeof member_id !== "string" || !member_id ||
    typeof venue_id !== "string" || !venue_id ||
    typeof deal_id !== "string" || !deal_id ||
    typeof ts !== "string" || !ts
  ) {
    res.status(400).json({ error: "Malformed token." });
    return;
  }

  // Timestamp window: must be within the last 10 minutes, tolerate 60s clock skew
  const tokenAge = Date.now() - new Date(ts).getTime();
  if (tokenAge > 10 * 60 * 1000 || tokenAge < -60 * 1000) {
    res.status(410).json({ error: "QR code has expired. Ask the member to generate a fresh one." });
    return;
  }

  const db = getFirestore();

  // Validate venue PIN — stored in venue_pins/{venue_id}, readable only via Admin SDK
  const pinDoc = await db.doc(`venue_pins/${venue_id}`).get();
  if (!pinDoc.exists) {
    res.status(403).json({ error: "No PIN configured for this venue. Contact HomeQuarters support." });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  const storedPin = pinDoc.data()!.pin as string;
  const pinMatch = storedPin.length === pin.length &&
    crypto.timingSafeEqual(Buffer.from(storedPin), Buffer.from(pin));
  if (!pinMatch) {
    res.status(403).json({ error: "Incorrect PIN. Please try again." });
    return;
  }

  // Validate member is active
  const profileDoc = await db.doc(`profiles/${member_id}`).get();
  if (!profileDoc.exists) {
    res.status(404).json({ error: "Member not found." });
    return;
  }
  const profile = profileDoc.data()!;
  if (profile.membership_status !== "active") {
    res.status(403).json({ error: "This member's subscription is not currently active." });
    return;
  }

  // Validate deal is active
  const dealDoc = await db.doc(`deals/${deal_id}`).get();
  if (!dealDoc.exists || !dealDoc.data()?.is_active) {
    res.status(404).json({ error: "Deal not found or no longer active." });
    return;
  }

  // Duplicate check: same member + same deal at this venue in the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const dupeSnap = await db
    .collection("redemptions")
    .where("member_id", "==", member_id)
    .where("deal_id", "==", deal_id)
    .where("venue_id", "==", venue_id)
    .where("redeemed_at", ">", since)
    .limit(1)
    .get();

  if (!dupeSnap.empty) {
    res.status(409).json({ error: "This deal has already been redeemed by this member today." });
    return;
  }

  // Write confirmed redemption
  const memberName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  await db.collection("redemptions").add({
    member_id,
    venue_id,
    deal_id,
    redeemed_at: new Date().toISOString(),
    verified_by_venue: true,
    member_name: memberName,
    member_tier: profile.membership_tier ?? null,
  });

  res.json({
    ok: true,
    member_name: memberName,
    member_tier: profile.membership_tier ?? null,
    deal_title: dealDoc.data()!.title as string,
    venue_name: (pinDoc.data()!.venue_name as string | undefined) ?? (payload.venue_name as string | undefined) ?? "",
  });
});

// ─────────────────────────────────────────────
// sendBroadcastNotification
// Callable from the admin dashboard.
// Sends a push notification to all active members who have a push token.
// FCM multicast is capped at 500 tokens per call, so we chunk automatically.
// Logs each broadcast to broadcast_notifications/{id}.
// ─────────────────────────────────────────────
export const sendBroadcastNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated.");
  }

  const db = getFirestore();

  // Verify caller is an admin
  const adminDoc = await db.doc(`admins/${request.auth.uid}`).get();
  if (!adminDoc.exists) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }

  const { title, body, type, data: extraData } = request.data as {
    title: string;
    body: string;
    type: string;
    data?: Record<string, string>;
  };

  if (!title?.trim() || !body?.trim()) {
    throw new HttpsError("invalid-argument", "title and body are required.");
  }

  // Fetch all active members with a push token
  const snap = await db
    .collection("profiles")
    .where("membership_status", "==", "active")
    .where("push_token", "!=", null)
    .get();

  const tokens = snap.docs
    .map((d) => d.data().push_token as string)
    .filter(Boolean);

  if (tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Chunk into batches of 500 (FCM multicast limit)
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 500) {
    chunks.push(tokens.slice(i, i + 500));
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const chunk of chunks) {
    try {
      const result = await getMessaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title: title.trim(), body: body.trim() },
        data: { type, ...(extraData ?? {}) },
      });
      totalSent += result.successCount;
      totalFailed += result.failureCount;
    } catch (err) {
      console.error("FCM multicast error:", err);
      totalFailed += chunk.length;
    }
  }

  // Log the broadcast
  await db.collection("broadcast_notifications").add({
    title: title.trim(),
    body: body.trim(),
    type,
    sent_to: totalSent,
    failed: totalFailed,
    total_tokens: tokens.length,
    sent_by: request.auth.uid,
    sent_at: new Date().toISOString(),
  });

  return { sent: totalSent, failed: totalFailed };
});

export const getStripePortalUrl = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated.");
    }

    const db = getFirestore();
    const profileDoc = await db.doc(`profiles/${request.auth.uid}`).get();
    const stripeCustomerId = profileDoc.data()?.stripe_customer_id as
      | string
      | undefined;

    if (!stripeCustomerId) {
      throw new HttpsError(
        "not-found",
        "No active Stripe subscription found for this account."
      );
    }

    const stripe = new Stripe(stripeSecretKey.value());
    const returnUrl =
      (request.data?.return_url as string | undefined) ||
      process.env.STRIPE_PORTAL_RETURN_URL ||
      "https://thehomequarters.com";

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }
);
