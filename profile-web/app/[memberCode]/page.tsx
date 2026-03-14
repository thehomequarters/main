import { notFound } from "next/navigation";
import Image from "next/image";
import { adminDb } from "@/lib/firebase-admin";

// ── Types (mirrors lib/database.types.ts in the mobile app) ─────────────────

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  member_code: string;
  membership_status: string;
  membership_tier: string;
  title: string | null;
  bio: string | null;
  city: string | null;
  industry: string | null;
  interests: string[];
  instagram_handle: string | null;
  linkedin_handle: string | null;
  profile_visibility?: "everyone" | "connections";
  hide_city?: boolean;
  hide_industry?: boolean;
  hide_interests?: boolean;
  hide_social_links?: boolean;
  hide_venue_log?: boolean;
  accepted_at?: string | null;
}

interface Venue {
  id: string;
  name: string;
  logo_url: string | null;
  category: string;
}

// ── Data fetching ────────────────────────────────────────────────────────────

async function getMemberProfile(memberCode: string): Promise<Profile | null> {
  const snap = await adminDb
    .collection("profiles")
    .where("member_code", "==", memberCode)
    .where("membership_status", "==", "active")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Profile;
}

async function getVisitedVenues(memberId: string): Promise<Venue[]> {
  const visitsSnap = await adminDb
    .collection("venue_visits")
    .where("member_id", "==", memberId)
    .get();

  if (visitsSnap.empty) return [];

  const venueIds = [...new Set(visitsSnap.docs.map((d) => d.data().venue_id as string))];
  const venueDocs = await Promise.all(
    venueIds.map((id) => adminDb.collection("venues").doc(id).get())
  );

  return venueDocs
    .filter((d) => d.exists)
    .map((d) => ({ id: d.id, ...d.data() }) as Venue);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function getMemberYear(profile: Profile) {
  if (profile.accepted_at) return new Date(profile.accepted_at).getFullYear();
  return null;
}

function getTierLabel(tier: string) {
  return tier === "founding_member"
    ? "Founding Member"
    : tier === "committee_member"
    ? "Committee Member"
    : tier === "platinum_card"
    ? "Platinum Card"
    : "Gold Card";
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ memberCode: string }>;
}) {
  const { memberCode } = await params;
  const profile = await getMemberProfile(memberCode);

  if (!profile) notFound();

  const isConnectionsOnly = profile.profile_visibility === "connections";
  const initials = getInitials(profile.first_name, profile.last_name);
  const memberYear = getMemberYear(profile);

  let visitedVenues: Venue[] = [];
  if (!isConnectionsOnly && !profile.hide_venue_log) {
    visitedVenues = await getVisitedVenues(profile.id);
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-md mx-auto px-6 py-16">

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={initials}
              width={88}
              height={88}
              className="rounded-full object-cover border-2 border-[#EAE5DC]"
            />
          ) : (
            <div className="w-22 h-22 rounded-full bg-[#1C1C1C] flex items-center justify-center border-2 border-[#EAE5DC]"
              style={{ width: 88, height: 88 }}>
              <span className="text-[#C9A84C] text-2xl font-semibold tracking-widest">
                {initials}
              </span>
            </div>
          )}

          {/* Tier badge */}
          <span className="mt-3 text-[10px] font-bold tracking-[0.2em] uppercase text-[#C9A84C]">
            {getTierLabel(profile.membership_tier)}
          </span>
        </div>

        {/* Name + title */}
        <div className="text-center mb-6">
          <h1 className="font-display text-4xl text-[#1C1C1C] leading-tight">
            {isConnectionsOnly
              ? profile.first_name
              : `${profile.first_name} ${profile.last_name}`}
          </h1>
          {!isConnectionsOnly && profile.title && (
            <p className="mt-1 text-sm text-[#7A7065]">{profile.title}</p>
          )}
        </div>

        {/* Connections-only teaser */}
        {isConnectionsOnly ? (
          <div className="text-center py-8 border border-[#EAE5DC] rounded-2xl bg-white/60">
            <p className="text-[#7A7065] text-sm">
              This profile is visible to connections only.
            </p>
          </div>
        ) : (
          <>
            {/* City + Industry */}
            {(!profile.hide_city || !profile.hide_industry) && (profile.city || profile.industry) && (
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {!profile.hide_city && profile.city && (
                  <span className="px-3 py-1 rounded-full border border-[#EAE5DC] bg-white text-xs text-[#7A7065] font-medium">
                    {profile.city}
                  </span>
                )}
                {!profile.hide_industry && profile.industry && (
                  <span className="px-3 py-1 rounded-full border border-[#EAE5DC] bg-white text-xs text-[#7A7065] font-medium">
                    {capitalise(profile.industry)}
                  </span>
                )}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-[#4A4540] text-sm leading-relaxed text-center mb-8">
                {profile.bio}
              </p>
            )}

            {/* Interests */}
            {!profile.hide_interests && profile.interests && profile.interests.length > 0 && (
              <section className="mb-8">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#B0A89A] mb-3 text-center">
                  Interests
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-full border border-[#EAE5DC] bg-white text-xs text-[#4A4540]"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Places */}
            {!profile.hide_venue_log && visitedVenues.length > 0 && (
              <section className="mb-8">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#B0A89A] mb-3 text-center">
                  Places
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-6 px-6">
                  {visitedVenues.map((venue) => (
                    <div
                      key={venue.id}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-[#EAE5DC] bg-white"
                    >
                      {venue.logo_url && (
                        <Image
                          src={venue.logo_url}
                          alt={venue.name}
                          width={24}
                          height={24}
                          className="rounded-md object-cover"
                        />
                      )}
                      <span className="text-xs font-medium text-[#1C1C1C] whitespace-nowrap">
                        {venue.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Social links */}
            {!profile.hide_social_links && (profile.instagram_handle || profile.linkedin_handle) && (
              <div className="flex gap-3 justify-center mb-8">
                {profile.instagram_handle && (
                  <a
                    href={`https://instagram.com/${profile.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#EAE5DC] bg-white text-xs font-medium text-[#4A4540] hover:border-[#C9A84C] transition-colors"
                  >
                    @{profile.instagram_handle}
                  </a>
                )}
                {profile.linkedin_handle && (
                  <a
                    href={`https://linkedin.com/in/${profile.linkedin_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#EAE5DC] bg-white text-xs font-medium text-[#4A4540] hover:border-[#C9A84C] transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-[#EAE5DC]">
          <a
            href="https://thehomequarters.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-[0.25em] uppercase text-[#B0A89A] hover:text-[#7A7065] transition-colors"
          >
            HomeQuarters
          </a>
          {memberYear && (
            <p className="text-[10px] text-[#C9C0B4] mt-1">
              Member since {memberYear}
            </p>
          )}
        </div>

      </div>
    </main>
  );
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberCode: string }>;
}) {
  const { memberCode } = await params;
  const profile = await getMemberProfile(memberCode);

  if (!profile) return { title: "Member | HomeQuarters" };

  const isConnectionsOnly = profile.profile_visibility === "connections";
  const name = isConnectionsOnly
    ? profile.first_name
    : `${profile.first_name} ${profile.last_name}`;

  return {
    title: `${name} | HomeQuarters`,
    description: profile.bio ?? `${name} is a HomeQuarters member.`,
    openGraph: {
      title: `${name} | HomeQuarters`,
      description: profile.bio ?? `${name} is a HomeQuarters member.`,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}
