import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  const snap = await adminDb.collection("website_content").doc("main").get();
  if (!snap.exists) return NextResponse.json({});
  return NextResponse.json(snap.data(), {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=60" },
  });
}
