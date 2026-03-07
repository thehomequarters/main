import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}

const db = getFirestore();

interface TokenData {
  member_id: string;
  member_code: string;
  member_name: string;
  venue_id: string;
  venue_name: string;
  deal_id: string;
  deal_title: string;
  ts: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { token, pin } = req.body ?? {};
  if (!token || !pin)
    return res.status(400).json({ error: "Missing token or pin" });

  // Decode base64url token
  let data: TokenData;
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    data = JSON.parse(json);
  } catch {
    return res.status(400).json({ error: "Invalid QR code" });
  }

  // Check token expiry (10 minutes)
  const tokenAgeMs = Date.now() - new Date(data.ts).getTime();
  if (tokenAgeMs > 10 * 60 * 1000) {
    return res
      .status(400)
      .json({ error: "QR code expired. Ask the member to regenerate." });
  }

  // Validate PIN against stored value
  const pinDoc = await db.collection("venue_pins").doc(data.venue_id).get();
  if (!pinDoc.exists) {
    return res
      .status(400)
      .json({ error: "No PIN set for this venue. Contact admin." });
  }
  const storedPin = pinDoc.data()!.pin as string;
  if (storedPin !== String(pin)) {
    return res.status(401).json({ error: "Incorrect PIN. Try again." });
  }

  // Duplicate check: same member + deal + venue within 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const dupeSnap = await db
    .collection("redemptions")
    .where("member_id", "==", data.member_id)
    .where("deal_id", "==", data.deal_id)
    .where("venue_id", "==", data.venue_id)
    .where("redeemed_at", ">", since)
    .limit(1)
    .get();

  if (!dupeSnap.empty) {
    return res.status(409).json({
      error: "This deal was already redeemed at this venue today.",
    });
  }

  // Write verified redemption
  await db.collection("redemptions").add({
    member_id: data.member_id,
    member_code: data.member_code,
    member_name: data.member_name,
    venue_id: data.venue_id,
    deal_id: data.deal_id,
    deal_title: data.deal_title,
    redeemed_at: new Date().toISOString(),
    verified_by_venue: true,
  });

  return res.status(200).json({ ok: true });
}
