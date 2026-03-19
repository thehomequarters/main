import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Resend } from "resend";

// ── Email templates (mirrors functions/src/emails.ts) ────────────────────────

const BASE_URL = "https://thehomequarters.com";

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>HomeQuarters</title>
</head>
<body style="margin:0;padding:0;background:#F2EBE0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2EBE0;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="background:#1C1C1E;padding:28px 40px;border-radius:16px 16px 0 0;">
          <p style="margin:0;color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:10px;text-transform:uppercase;">HQ</p>
        </td></tr>
        <tr><td style="background:#FFFFFF;padding:40px;border-left:1px solid #E0D5C5;border-right:1px solid #E0D5C5;">
          ${content}
        </td></tr>
        <tr><td style="background:#F2EBE0;padding:28px 40px;border:1px solid #E0D5C5;border-top:none;border-radius:0 0 16px 16px;">
          <p style="margin:0;color:#9A8E82;font-size:11px;line-height:18px;text-align:center;">
            HomeQuarters · Private Members&rsquo; Community<br/>
            &copy; 2026 HomeQuarters. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function goldDivider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr>
      <td style="border-top:1px solid #E0D5C5;"></td>
      <td style="width:32px;padding:0 12px;text-align:center;color:#C9A84C;font-size:14px;">✦</td>
      <td style="border-top:1px solid #E0D5C5;"></td>
    </tr>
  </table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #E0D5C5;">
      <span style="color:#9A8E82;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${label}</span>
    </td>
    <td style="padding:10px 0 10px 16px;border-bottom:1px solid #E0D5C5;text-align:right;">
      <span style="color:#1C1C1E;font-size:13px;font-weight:600;font-family:monospace;letter-spacing:2px;">${value}</span>
    </td>
  </tr>`;
}

// Sent to applicant when no voucher
function webApplicationReceivedHtml(opts: { firstName: string; email: string }): string {
  const body = `
    <p style="margin:0 0 6px;color:#9A8E82;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">OPEN APPLICATION</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">We&rsquo;ve received<br/>your application.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, thank you for your interest in HomeQuarters. Your application has been received and is on file with our membership committee.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      We review open applications on a rolling basis, typically when new membership places become available. If there is a strong match, we will reach out to you directly at this address.
    </p>
    ${goldDivider()}
    <p style="margin:0 0 12px;color:#1C1C1E;font-size:13px;font-weight:600;">Application on file</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("EMAIL", opts.email)}
      ${infoRow("STATUS", "ON FILE")}
    </table>
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      If you receive an invitation code from a current member in the meantime, download the HomeQuarters app and apply directly — invited applications are reviewed with priority.
    </p>
  `;
  return wrap(body);
}

function webApplicationReceivedText(opts: { firstName: string; email: string }): string {
  return `Hi ${opts.firstName},\n\nThank you for your interest in HomeQuarters. Your open application has been received and is on file.\n\nWe review applications on a rolling basis and will reach out to ${opts.email} if there's a match.\n\nIf you receive an invitation code from a member, download the app to apply with priority.\n\nHomeQuarters`;
}

// Sent to applicant when they applied via a member's card
function vouchedApplicationReceivedHtml(opts: {
  firstName: string;
  email: string;
  memberFirstName: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#9A8E82;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">APPLICATION</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">We&rsquo;ve received<br/>your application.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, thank you for applying to HomeQuarters via ${opts.memberFirstName}&rsquo;s membership.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      ${opts.memberFirstName} has been notified and will confirm their vouch. Once they do, your application will be reviewed by our membership committee.
    </p>
    ${goldDivider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("EMAIL", opts.email)}
      ${infoRow("VOUCHER", opts.memberFirstName.toUpperCase())}
      ${infoRow("STATUS", "PENDING VOUCH")}
    </table>
  `;
  return wrap(body);
}

function vouchedApplicationReceivedText(opts: {
  firstName: string;
  email: string;
  memberFirstName: string;
}): string {
  return `Hi ${opts.firstName},\n\nThank you for applying to HomeQuarters via ${opts.memberFirstName}'s membership.\n\n${opts.memberFirstName} has been notified and will confirm their vouch. Once confirmed, your application will be reviewed by our committee.\n\nHomeQuarters`;
}

// Sent to the member asking them to vouch
function memberVouchRequestHtml(opts: {
  memberFirstName: string;
  applicantName: string;
  applicantAbout: string | null;
  vouchUrl: string;
}): string {
  const aboutSection = opts.applicantAbout
    ? `<p style="margin:0 0 24px;color:#9A8E82;font-size:14px;line-height:22px;font-style:italic;">&ldquo;${opts.applicantAbout}&rdquo;</p>`
    : "";
  const body = `
    <p style="margin:0 0 6px;color:#9A8E82;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">VOUCH REQUEST</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Someone wants<br/>to join.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.memberFirstName}, <strong style="color:#1C1C1E;">${opts.applicantName}</strong> has applied to HomeQuarters via your membership card and listed you as their voucher.
    </p>
    ${aboutSection}
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      If you&rsquo;re happy to vouch for them, tap the button below. This confirms you know ${opts.applicantName.split(" ")[0]} and are comfortable recommending them for membership.
    </p>
    ${goldDivider()}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:0;">
      <tr><td align="center">
        <a href="${opts.vouchUrl}"
           style="display:inline-block;padding:14px 36px;background:#C9A84C;color:#1C1C1E;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;text-decoration:none;border-radius:6px;">
          Confirm Vouch
        </a>
      </td></tr>
    </table>
    ${goldDivider()}
    <p style="margin:0;color:#C9C0B4;font-size:11px;line-height:18px;">
      If you don&rsquo;t recognise this person or aren&rsquo;t comfortable vouching, simply ignore this email. No action is required.
    </p>
  `;
  return wrap(body);
}

function memberVouchRequestText(opts: {
  memberFirstName: string;
  applicantName: string;
  applicantAbout: string | null;
  vouchUrl: string;
}): string {
  const about = opts.applicantAbout ? `\n\nAbout them: "${opts.applicantAbout}"` : "";
  return `Hi ${opts.memberFirstName},\n\n${opts.applicantName} has applied to HomeQuarters via your membership card and listed you as their voucher.${about}\n\nIf you're happy to vouch, confirm here:\n${opts.vouchUrl}\n\nIf you don't recognise them, simply ignore this email.\n\nHomeQuarters`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

const FROM_EMAIL = "HomeQuarters <hello@email.thehomequarters.com>";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, string | undefined>;
  const {
    first_name,
    last_name,
    email,
    instagram,
    linkedin,
    about,
    marketing_opt_in,
    vouched_by_member_code,
  } = body;

  if (!first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }
  if (!email?.trim() || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const firstName = first_name.trim();
  const lastName = last_name.trim();
  const sanitizedEmail = email.trim().toLowerCase();
  const hasVoucher = !!vouched_by_member_code?.trim();
  const memberCode = vouched_by_member_code?.trim().toUpperCase() ?? null;
  const vouchToken = hasVoucher ? crypto.randomUUID() : null;

  // ── Save application ─────────────────────────────────────────────────────
  let docRef: FirebaseFirestore.DocumentReference;
  try {
    docRef = await adminDb.collection("open_applications").add({
      first_name: firstName,
      last_name: lastName,
      email: sanitizedEmail,
      instagram: instagram?.trim() ?? null,
      linkedin: linkedin?.trim() ?? null,
      about: about?.trim() ?? null,
      marketing_opt_in: marketing_opt_in === "true",
      source: hasVoucher ? "member_card" : "website",
      submitted_at: new Date().toISOString(),
      status: "received",
      ...(hasVoucher && {
        vouched_by_member_code: memberCode,
        vouch_token: vouchToken,
        vouched: false,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not save application." }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // ── Look up vouching member (if applicable) ──────────────────────────────
  let memberProfile: { first_name: string; email: string } | null = null;
  if (hasVoucher && memberCode) {
    try {
      const memberSnap = await adminDb
        .collection("profiles")
        .where("member_code", "==", memberCode)
        .limit(1)
        .get();
      if (!memberSnap.empty) {
        const d = memberSnap.docs[0].data();
        memberProfile = { first_name: d.first_name as string, email: d.email as string };
      }
    } catch (err) {
      console.error("Failed to look up vouching member:", err);
    }
  }

  // ── Send applicant confirmation ──────────────────────────────────────────
  try {
    if (hasVoucher && memberProfile) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: sanitizedEmail,
        subject: "Your HomeQuarters application has been received",
        html: vouchedApplicationReceivedHtml({
          firstName,
          email: sanitizedEmail,
          memberFirstName: memberProfile.first_name,
        }),
        text: vouchedApplicationReceivedText({
          firstName,
          email: sanitizedEmail,
          memberFirstName: memberProfile.first_name,
        }),
      });
    } else {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: sanitizedEmail,
        subject: "Your HomeQuarters application has been received",
        html: webApplicationReceivedHtml({ firstName, email: sanitizedEmail }),
        text: webApplicationReceivedText({ firstName, email: sanitizedEmail }),
      });
    }
  } catch (err) {
    console.error("Failed to send applicant confirmation email:", err);
  }

  // ── Send member vouch request ────────────────────────────────────────────
  if (hasVoucher && memberProfile && vouchToken) {
    try {
      const vouchUrl = `${BASE_URL}/api/vouch?token=${vouchToken}`;
      await resend.emails.send({
        from: FROM_EMAIL,
        to: memberProfile.email,
        subject: `${firstName} ${lastName} wants to join HomeQuarters — will you vouch?`,
        html: memberVouchRequestHtml({
          memberFirstName: memberProfile.first_name,
          applicantName: `${firstName} ${lastName}`,
          applicantAbout: about?.trim() ?? null,
          vouchUrl,
        }),
        text: memberVouchRequestText({
          memberFirstName: memberProfile.first_name,
          applicantName: `${firstName} ${lastName}`,
          applicantAbout: about?.trim() ?? null,
          vouchUrl,
        }),
      });
    } catch (err) {
      console.error("Failed to send member vouch request email:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
