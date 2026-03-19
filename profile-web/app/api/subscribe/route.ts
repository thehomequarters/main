import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Resend } from "resend";

// ── Email templates (mirrors functions/src/emails.ts) ────────────────────────

const BASE_URL = "https://thehomequarters.com";
const UNSUBSCRIBE_URL = `${BASE_URL}/unsubscribe`;

function wrap(content: string, recipientEmail?: string): string {
  const unsubLink = recipientEmail
    ? `${UNSUBSCRIBE_URL}?email=${encodeURIComponent(recipientEmail)}`
    : UNSUBSCRIBE_URL;
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
          <p style="margin:0 0 10px;color:#9A8E82;font-size:11px;line-height:18px;text-align:center;">
            HomeQuarters · Private Members&rsquo; Community<br/>
            London, United Kingdom<br/>
            You&rsquo;re receiving this because you subscribed at thehomequarters.com.
          </p>
          <p style="margin:0;text-align:center;">
            <a href="${unsubLink}" style="color:#9A8E82;font-size:11px;text-decoration:underline;">Unsubscribe</a>
            <span style="color:#C8BEB4;font-size:11px;">&nbsp;&middot;&nbsp;</span>
            <a href="${BASE_URL}/privacy" style="color:#9A8E82;font-size:11px;text-decoration:underline;">Privacy Policy</a>
          </p>
          <p style="margin:10px 0 0;color:#C8BEB4;font-size:10px;text-align:center;">&copy; 2026 HomeQuarters. All rights reserved.</p>
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

function ctaButton(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr><td style="background:#1C1C1E;border-radius:100px;">
      <a href="${url}" style="display:inline-block;padding:16px 36px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">${label}</a>
    </td></tr>
  </table>`;
}

function newsletterWelcomeHtml(opts: { firstName?: string; email?: string }): string {
  const greeting = opts.firstName ? `Hi ${opts.firstName},` : "Hello,";
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">YOU&rsquo;RE ON THE LIST</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Welcome to the<br/>HQ community.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      ${greeting} you&rsquo;re now subscribed to HomeQuarters updates. We&rsquo;ll be in touch occasionally with community news, events, and what&rsquo;s happening across our partner venues.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      We keep things intentional — you won&rsquo;t hear from us unless we have something worth saying.
    </p>
    ${goldDivider()}
    <p style="margin:0 0 16px;color:#1C1C1E;font-size:13px;font-weight:700;">Interested in full membership?</p>
    <p style="margin:0 0 20px;color:#9A8E82;font-size:13px;line-height:21px;">
      HomeQuarters is a private members&rsquo; community — by invitation. If you know a current member, ask them for an invitation code and apply directly in the app. Or keep an eye on your inbox — we occasionally open applications to our waitlist.
    </p>
    ${ctaButton("Learn more", BASE_URL)}
  `;
  return wrap(body, opts.email);
}

function newsletterWelcomeText(opts: { firstName?: string }): string {
  const greeting = opts.firstName ? `Hi ${opts.firstName},` : "Hello,";
  return `${greeting}

You're now subscribed to HomeQuarters updates. We'll be in touch occasionally with community news, events, and what's happening at our partner venues.

We keep it intentional — you won't hear from us unless we have something worth saying.

INTERESTED IN FULL MEMBERSHIP?
HomeQuarters is a private members' community, by invitation. If you know a current member, ask them for an invitation code and apply in the app. Or keep an eye on your inbox — we occasionally open applications to our waitlist.

Learn more: ${BASE_URL}

To unsubscribe: ${UNSUBSCRIBE_URL}

HomeQuarters`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

const FROM_EMAIL = "HomeQuarters <hello@email.thehomequarters.com>";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { email?: string; first_name?: string };
  const { email, first_name } = body;

  if (!email?.trim() || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const sanitized = email.trim().toLowerCase();
  const firstName = first_name?.trim() || undefined;

  try {
    await adminDb.collection("newsletter_subscribers").doc(sanitized).set(
      {
        email: sanitized,
        first_name: firstName ?? null,
        subscribed_at: new Date().toISOString(),
        source: "website_popup",
      },
      { merge: true }
    );
  } catch {
    return NextResponse.json({ error: "Could not save subscription." }, { status: 500 });
  }

  // Non-fatal: send welcome email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const encodedEmail = encodeURIComponent(sanitized);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: sanitized,
      subject: "You're on the HomeQuarters list",
      html: newsletterWelcomeHtml({ firstName, email: sanitized }),
      text: newsletterWelcomeText({ firstName }),
      headers: {
        "List-Unsubscribe": `<mailto:unsubscribe@email.thehomequarters.com>, <${UNSUBSCRIBE_URL}?email=${encodedEmail}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  } catch (err) {
    console.error("Failed to send newsletter welcome email:", err);
  }

  return NextResponse.json({ ok: true });
}
