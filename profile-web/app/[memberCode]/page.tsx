import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import BusinessCard, { type Profile } from "./BusinessCard";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getMemberProfile(memberCode: string): Promise<Profile | null> {
  const snap = await adminDb
    .collection("profiles")
    .where("member_code", "==", memberCode.toUpperCase())
    .where("membership_status", "==", "active")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Profile;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberCode: string }>;
}) {
  const { memberCode } = await params;
  const profile = await getMemberProfile(memberCode);
  if (!profile) return { title: "HomeQuarters" };
  const name = `${profile.first_name} ${profile.last_name}`;
  return {
    title: `${name} | HomeQuarters`,
    description: profile.bio ?? `${name} is a HomeQuarters member.`,
    openGraph: {
      title: `${name} | HomeQuarters`,
      description: profile.bio ?? `${name} is a HomeQuarters member.`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ memberCode: string }>;
}) {
  const { memberCode } = await params;
  const profile = await getMemberProfile(memberCode);
  if (!profile) notFound();
  return <BusinessCard profile={profile} />;
}
