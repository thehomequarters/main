import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
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

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

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

// ─────────────────────────────────────────────
// stripeWebhook
// Stripe sends events here when subscription state changes.
// Handles: checkout.session.completed, customer.subscription.updated,
//          customer.subscription.deleted, invoice.payment_failed
// Endpoint URL to register in Stripe dashboard:
//   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/stripeWebhook
// ─────────────────────────────────────────────

// Map Stripe Price ID → membership tier (configured in functions/.env)
function tierFromPriceId(
  priceId: string
): "gold_card" | "platinum_card" | null {
  if (priceId && priceId === process.env.STRIPE_GOLD_PRICE_ID) return "gold_card";
  if (priceId && priceId === process.env.STRIPE_PLATINUM_PRICE_ID) return "platinum_card";
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

          // Get current_period_end from subscription
          let periodEnd: string | null = null;
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(
              session.subscription as string
            );
            periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          }

          const update: Record<string, unknown> = {
            stripe_customer_id: customerId(session.customer),
            stripe_subscription_id: session.subscription ?? null,
            subscription_status: "active",
            current_period_end: periodEnd,
            membership_status: "active",
          };
          if (tier) update.membership_tier = tier;

          await db.doc(`profiles/${uid}`).update(update);
          console.log(`Activated subscription for uid=${uid} tier=${tier}`);
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

          const update: Record<string, unknown> = {
            subscription_status: sub.status,
            current_period_end: periodEnd,
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
      "https://homequarters.co.uk";

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }
);
