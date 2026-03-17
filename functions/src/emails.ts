// ─────────────────────────────────────────────
// HQ Branded Email Templates
// All styles are inline - required for email client compatibility.
// Palette: cream #F2EBE0 · dark #1C1C1E · gold #C9A84C · stone #9A8E82
// ─────────────────────────────────────────────

const BASE_URL = process.env.APP_BASE_URL ?? "https://thehomequarters.com";
const UNSUBSCRIBE_URL = `${BASE_URL}/unsubscribe`;

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

        <!-- Wordmark header -->
        <tr><td style="background:#1C1C1E;padding:28px 40px;border-radius:16px 16px 0 0;">
          <p style="margin:0;color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:10px;text-transform:uppercase;">HQ</p>
        </td></tr>

        <!-- Body card -->
        <tr><td style="background:#FFFFFF;padding:40px;border-left:1px solid #E0D5C5;border-right:1px solid #E0D5C5;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F2EBE0;padding:28px 40px;border:1px solid #E0D5C5;border-top:none;border-radius:0 0 16px 16px;">
          <p style="margin:0 0 10px;color:#9A8E82;font-size:11px;line-height:18px;text-align:center;">
            HomeQuarters · Private Members&rsquo; Community<br/>
            London, United Kingdom<br/>
            This email was sent because you have an account or subscription with HomeQuarters.
          </p>
          <p style="margin:0;text-align:center;">
            <a href="${UNSUBSCRIBE_URL}" style="color:#9A8E82;font-size:11px;text-decoration:underline;">Unsubscribe</a>
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

function ctaButton(label: string, url: string, color = "#1C1C1E"): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr><td style="background:${color};border-radius:100px;">
      <a href="${url}" style="display:inline-block;padding:16px 36px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">${label}</a>
    </td></tr>
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

// ─────────────────────────────────────────────
// 1. Application Received
// ─────────────────────────────────────────────
export function applicationReceivedHtml(opts: {
  firstName: string;
  applicationCode: string;
  applicationType: "invited" | "open";
}): string {
  const isInvited = opts.applicationType === "invited";
  const body = `
    <p style="margin:0 0 6px;color:#9A8E82;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${isInvited ? "INVITED APPLICATION" : "OPEN APPLICATION"}</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">We&rsquo;ve received<br/>your application.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, thank you for applying to HomeQuarters. Your application is now with our membership committee.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      ${isInvited
        ? "As an invited applicant, your application will be reviewed shortly. A member of the committee will be in touch."
        : "We review open applications on a rolling basis. If there is a match, we will reach out directly."
      }
    </p>
    ${goldDivider()}
    <p style="margin:0 0 12px;color:#1C1C1E;font-size:13px;font-weight:600;">Your application details</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("APPLICATION CODE", opts.applicationCode)}
      ${infoRow("STATUS", "UNDER REVIEW")}
    </table>
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      You can strengthen your application by getting current members to vouch for you. Share your application code - <strong style="color:#1C1C1E;font-family:monospace;">${opts.applicationCode}</strong> - with people who know you and are already in the community.
    </p>
  `;
  return wrap(body);
}

export function applicationReceivedText(opts: {
  firstName: string;
  applicationCode: string;
}): string {
  return `Hi ${opts.firstName},\n\nWe've received your HomeQuarters application. Your application code is ${opts.applicationCode}.\n\nShare this code with current members to vouch for you. We'll be in touch soon.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 2. Membership Approved
// ─────────────────────────────────────────────
export function membershipApprovedHtml(opts: {
  firstName: string;
  memberCode: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">MEMBERSHIP APPROVED</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Welcome to<br/>HomeQuarters, ${opts.firstName}.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Your application has been approved by the membership committee. You are now a HomeQuarters member.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Open the app to explore member benefits, discover partner venues, and connect with the community.
    </p>
    ${ctaButton("Open HomeQuarters", BASE_URL)}
    ${goldDivider()}
    <p style="margin:0 0 12px;color:#1C1C1E;font-size:13px;font-weight:600;">Your membership details</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("MEMBER CODE", opts.memberCode)}
      ${infoRow("STATUS", "ACTIVE")}
    </table>
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Your member code is your identity within the community. Keep it private - it&rsquo;s used to verify your membership at partner venues.
    </p>
  `;
  return wrap(body);
}

export function membershipApprovedText(opts: {
  firstName: string;
  memberCode: string;
}): string {
  return `Hi ${opts.firstName},\n\nWelcome to HomeQuarters. Your membership has been approved.\n\nYour member code is ${opts.memberCode}. Keep it private.\n\nOpen the app to get started: ${BASE_URL}\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 3. Application Rejected
// ─────────────────────────────────────────────
export function applicationRejectedHtml(opts: {
  firstName: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#9A8E82;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">MEMBERSHIP DECISION</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Thank you for<br/>your interest.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, thank you for taking the time to apply to HomeQuarters.
    </p>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      After careful review, the membership committee has decided not to move forward with your application at this time. This decision is not a reflection of your character or achievements - our membership is shaped by the community&rsquo;s current composition and needs.
    </p>
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      We wish you well. If you believe this decision was made in error, or if your circumstances change, you are welcome to reach out to us at <a href="mailto:hello@thehomequarters.com" style="color:#1C1C1E;font-weight:600;">hello@thehomequarters.com</a>.
    </p>
  `;
  return wrap(body);
}

export function applicationRejectedText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},\n\nThank you for applying to HomeQuarters. After careful consideration, we are not able to move forward at this time.\n\nIf you have any questions, contact us at hello@thehomequarters.com.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 4. Membership Suspended
// ─────────────────────────────────────────────
export function membershipSuspendedHtml(opts: {
  firstName: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#E53935;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">ACCOUNT NOTICE</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Your membership<br/>has been suspended.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, your HomeQuarters membership has been temporarily suspended. Access to member benefits, venues, and the community has been paused.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      If you believe this is an error, or if you would like to understand the reason for suspension, please contact the team.
    </p>
    ${ctaButton("Contact Support", "mailto:hello@thehomequarters.com", "#1C1C1E")}
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Reach us at <a href="mailto:hello@thehomequarters.com" style="color:#1C1C1E;font-weight:600;">hello@thehomequarters.com</a>. We handle all queries confidentially and fairly.
    </p>
  `;
  return wrap(body);
}

export function membershipSuspendedText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},\n\nYour HomeQuarters membership has been suspended. Access to member benefits has been paused.\n\nFor questions, contact hello@thehomequarters.com.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 5. Vouch Received
// ─────────────────────────────────────────────
export function vouchReceivedHtml(opts: {
  firstName: string;
  voucherName: string;
  voucherCount: number;
  requiredVouches: number;
  applicationCode: string;
}): string {
  const remaining = Math.max(0, opts.requiredVouches - opts.voucherCount);
  const isComplete = remaining === 0;
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">VOUCH RECEIVED</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">${opts.voucherName}<br/>vouched for you.</h1>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, a member of the HomeQuarters community has vouched for your application. Every vouch brings you one step closer to membership.
    </p>
    ${goldDivider()}
    <p style="margin:0 0 12px;color:#1C1C1E;font-size:13px;font-weight:600;">Your application progress</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("VOUCHES RECEIVED", `${opts.voucherCount} / ${opts.requiredVouches}`)}
      ${infoRow("APPLICATION CODE", opts.applicationCode)}
      ${infoRow("STATUS", isComplete ? "COMPLETE - UNDER REVIEW" : "IN PROGRESS")}
    </table>
    ${goldDivider()}
    ${isComplete
      ? `<p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">Your application is now complete and has been passed to the membership committee for review. We&rsquo;ll be in touch soon.</p>`
      : `<p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">You need <strong style="color:#1C1C1E;">${remaining} more ${remaining === 1 ? "vouch" : "vouches"}</strong> to complete your application. Share your code - <strong style="color:#1C1C1E;font-family:monospace;">${opts.applicationCode}</strong> - with other members who know you.</p>`
    }
  `;
  return wrap(body);
}

export function vouchReceivedText(opts: {
  firstName: string;
  voucherName: string;
  voucherCount: number;
  requiredVouches: number;
  applicationCode: string;
}): string {
  const remaining = Math.max(0, opts.requiredVouches - opts.voucherCount);
  const isComplete = remaining === 0;
  return `Hi ${opts.firstName},\n\n${opts.voucherName} has vouched for your HomeQuarters application.\n\nVouches: ${opts.voucherCount}/${opts.requiredVouches}\n\n${isComplete ? "Your application is now complete and under committee review." : `You need ${remaining} more ${remaining === 1 ? "vouch" : "vouches"}. Share your code (${opts.applicationCode}) with members who know you.`}\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 6. Application Complete
// ─────────────────────────────────────────────
export function applicationCompleteHtml(opts: {
  firstName: string;
  applicationCode: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">APPLICATION COMPLETE</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Your application<br/>is now complete.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, you&rsquo;ve received all the vouches needed. Your application has been passed to the HomeQuarters membership committee for review.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      The committee reviews applications carefully. We&rsquo;ll notify you by email as soon as a decision has been made - usually within a few days.
    </p>
    ${goldDivider()}
    <p style="margin:0 0 12px;color:#1C1C1E;font-size:13px;font-weight:600;">Your application details</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("APPLICATION CODE", opts.applicationCode)}
      ${infoRow("STATUS", "WITH COMMITTEE")}
    </table>
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      You can check your status at any time by opening the HomeQuarters app and signing in with your email and password.
    </p>
  `;
  return wrap(body);
}

export function applicationCompleteText(opts: {
  firstName: string;
  applicationCode: string;
}): string {
  return `Hi ${opts.firstName},\n\nYour HomeQuarters application is now complete and has been passed to the membership committee.\n\nApplication code: ${opts.applicationCode}\n\nWe'll be in touch once a decision has been made. You can check your status by opening the app and signing in with your email.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 7. Friend Accepted (to the voucher)
// ─────────────────────────────────────────────
export function friendAcceptedHtml(opts: {
  firstName: string;
  friendFirstName: string;
  friendLastName: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GREAT NEWS</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">${opts.friendFirstName} has<br/>joined HQ.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, the membership committee has approved the application of <strong style="color:#1C1C1E;">${opts.friendFirstName} ${opts.friendLastName}</strong> - someone you vouched for.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      They&rsquo;re now a full member of HomeQuarters. Thank you for your recommendation - the quality of our community is built on the trust of people like you.
    </p>
    ${ctaButton("Open HomeQuarters", BASE_URL)}
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Your vouching record reflects the strength and character of your network. We appreciate your contribution to the community.
    </p>
  `;
  return wrap(body);
}

export function friendAcceptedText(opts: {
  firstName: string;
  friendFirstName: string;
  friendLastName: string;
}): string {
  return `Hi ${opts.firstName},\n\n${opts.friendFirstName} ${opts.friendLastName}, someone you vouched for, has been accepted into HomeQuarters.\n\nThank you for your recommendation - it means a great deal to the community.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 8. Invitee Applied (to the person who sent the invite)
// ─────────────────────────────────────────────
export function inviteeAppliedHtml(opts: {
  firstName: string;
  inviteeName: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">INVITATION UPDATE</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">${opts.inviteeName}<br/>has applied.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, someone you invited - <strong style="color:#1C1C1E;">${opts.inviteeName}</strong> - has used your invitation code and submitted their application to HomeQuarters.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Their application is now with the membership committee. You&rsquo;ve already counted as one of their vouches by virtue of your invitation. You can also vouch for them directly in the app using their application code.
    </p>
    ${ctaButton("Open HomeQuarters", BASE_URL)}
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Thank you for introducing great people to the community. Your invitation reflects your trust in this person.
    </p>
  `;
  return wrap(body);
}

export function inviteeAppliedText(opts: {
  firstName: string;
  inviteeName: string;
}): string {
  return `Hi ${opts.firstName},\n\n${opts.inviteeName}, someone you invited, has submitted their application to HomeQuarters.\n\nYou already count as one of their vouches. You can also vouch for them directly in the app.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 9. Web Application Received (open application via website)
// ─────────────────────────────────────────────
export function webApplicationReceivedHtml(opts: {
  firstName: string;
  email: string;
}): string {
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
      If you receive an invitation code from a current member in the meantime, download the HomeQuarters app and apply directly - invited applications are reviewed with priority.
    </p>
  `;
  return wrap(body);
}

export function webApplicationReceivedText(opts: {
  firstName: string;
  email: string;
}): string {
  return `Hi ${opts.firstName},\n\nThank you for your interest in HomeQuarters. Your open application has been received and is on file.\n\nWe review applications on a rolling basis and will reach out to ${opts.email} if there's a match.\n\nIf you receive an invitation code from a member, download the app to apply with priority.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 10. Welcome Journey - Day 1: Personal note from Valentine
// Plain text only. Warm, human, founder's voice.
// ─────────────────────────────────────────────
export function founderWelcomeText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},

I wanted to drop you a quick note personally.

Welcome to HomeQuarters.

We built this community around a simple idea - that people who share a connection to a homeland, wherever they are in the world, deserve a place that feels like their own. Somewhere with a real sense of belonging, not just another app or membership card.

I'm genuinely glad you're here.

Take your time settling in. Explore the app, connect with a few members, and don't hesitate to reach out if you have any questions or feedback.

With warmth,

Valentine Eluwasi
Founder, HomeQuarters
hello@thehomequarters.com`;
}

// ─────────────────────────────────────────────
// 11. Welcome Journey - Day 4: Features tour
// Branded. Introduces the key pillars of the community.
// ─────────────────────────────────────────────
export function welcomeFeaturesTourHtml(opts: { firstName: string }): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">YOUR MEMBERSHIP</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Everything that<br/>comes with HQ.</h1>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, now that you&rsquo;re settled in, here&rsquo;s a quick look at what your membership unlocks.
    </p>

    ${goldDivider()}

    <!-- Feature: Venues & Deals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="width:40px;vertical-align:top;padding-top:2px;">
          <p style="margin:0;font-size:22px;line-height:1;">🏛</p>
        </td>
        <td style="padding-left:16px;vertical-align:top;">
          <p style="margin:0 0 4px;color:#1C1C1E;font-size:14px;font-weight:700;letter-spacing:-0.2px;">Partner Venues &amp; Deals</p>
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">Access exclusive offers at a curated selection of restaurants, bars, hotels, and cultural spaces. Present your member QR code to redeem.</p>
        </td>
      </tr>
    </table>

    <!-- Feature: Discover -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="width:40px;vertical-align:top;padding-top:2px;">
          <p style="margin:0;font-size:22px;line-height:1;">✦</p>
        </td>
        <td style="padding-left:16px;vertical-align:top;">
          <p style="margin:0 0 4px;color:#1C1C1E;font-size:14px;font-weight:700;letter-spacing:-0.2px;">Discover</p>
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">The community feed. A space to share what you&rsquo;re up to, where you&rsquo;ve been, what you&rsquo;ve found. Think of it as a private journal that only your people can see.</p>
        </td>
      </tr>
    </table>

    <!-- Feature: Connect -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="width:40px;vertical-align:top;padding-top:2px;">
          <p style="margin:0;font-size:22px;line-height:1;">◎</p>
        </td>
        <td style="padding-left:16px;vertical-align:top;">
          <p style="margin:0 0 4px;color:#1C1C1E;font-size:14px;font-weight:700;letter-spacing:-0.2px;">Connect</p>
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">Browse member profiles and send a direct message to anyone in the community. No cold introductions - everyone here was vouched for.</p>
        </td>
      </tr>
    </table>

    <!-- Feature: Events -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:0;">
      <tr>
        <td style="width:40px;vertical-align:top;padding-top:2px;">
          <p style="margin:0;font-size:22px;line-height:1;">◈</p>
        </td>
        <td style="padding-left:16px;vertical-align:top;">
          <p style="margin:0 0 4px;color:#1C1C1E;font-size:14px;font-weight:700;letter-spacing:-0.2px;">Events</p>
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">Members-only gatherings, dinners, and cultural moments. Keep an eye on the Events tab - these fill up quickly.</p>
        </td>
      </tr>
    </table>

    ${goldDivider()}

    ${ctaButton("Open the App", BASE_URL)}

    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      If you ever have a question, a suggestion, or just want to share something - reply to this email. We&rsquo;re always listening.
    </p>
  `;
  return wrap(body);
}

export function welcomeFeaturesTourText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},

Here's a quick look at everything your HomeQuarters membership gives you.

PARTNER VENUES & DEALS
Exclusive offers at restaurants, bars, hotels, and cultural spaces. Show your member QR code to redeem.

DISCOVER
The community feed. Share what you're up to, where you've been, what you've found. Private - members only.

CONNECT
Browse member profiles and message anyone in the community directly. Everyone here was vouched for.

EVENTS
Members-only gatherings and cultural moments. Check the Events tab regularly - they fill up fast.

Open the app to explore: ${BASE_URL}

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 12. Welcome Journey - Day 10: Discover nudge
// Branded. Encourages first post on the community feed.
// ─────────────────────────────────────────────
export function welcomeDiscoverNudgeHtml(opts: { firstName: string }): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">COMMUNITY</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Say something,<br/>${opts.firstName}.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      The best communities are built by the people in them. Discover is your space - a private feed where members share the moments, places, and thoughts that make up their lives.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      It could be a restaurant you just tried, a city you&rsquo;re visiting, a thought you want to share with people who get it. There&rsquo;s no pressure - just a space that gets richer the more you put into it.
    </p>
    ${goldDivider()}
    <p style="margin:0 0 20px;color:#1C1C1E;font-size:14px;font-weight:600;line-height:22px;">
      Your first post is waiting.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:13px;line-height:21px;">
      Open the app, tap <strong style="color:#1C1C1E;">Discover</strong>, and share something - anything. The community will be glad you did.
    </p>
    ${ctaButton("Post on Discover", BASE_URL)}
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Not sure what to post? Share a place you love, a photo from your travels, or simply introduce yourself. There&rsquo;s no wrong answer here.
    </p>
  `;
  return wrap(body);
}

export function welcomeDiscoverNudgeText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},

The best communities are built by the people in them.

Discover is the HQ community feed - a private space where members share moments, places, and thoughts with people who get it.

Your first post is waiting. Open the app, tap Discover, and share something. A place you love, a city you're visiting, an introduction. Anything.

The community will be glad you did.

${BASE_URL}

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 13. Password Reset
// ─────────────────────────────────────────────
export function passwordResetHtml(opts: {
  firstName?: string;
  resetLink: string;
}): string {
  const greeting = opts.firstName ? `Hi ${opts.firstName},` : "Hello,";
  const body = `
    <p style="margin:0 0 6px;color:#9A8E82;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">ACCOUNT SECURITY</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Reset your<br/>password.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      ${greeting} we received a request to reset the password for your HomeQuarters account.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Tap the button below to set a new password. This link expires in <strong style="color:#1C1C1E;">1 hour</strong>.
    </p>
    ${ctaButton("Reset Password", opts.resetLink)}
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      If you did not request a password reset, you can safely ignore this email. Your password will not change. If you&rsquo;re concerned about your account security, contact us at <a href="mailto:hello@thehomequarters.com" style="color:#1C1C1E;font-weight:600;">hello@thehomequarters.com</a>.
    </p>
  `;
  return wrap(body);
}

export function passwordResetText(opts: {
  firstName?: string;
  resetLink: string;
}): string {
  const greeting = opts.firstName ? `Hi ${opts.firstName},` : "Hello,";
  return `${greeting}\n\nReset your HomeQuarters password using the link below. It expires in 1 hour.\n\n${opts.resetLink}\n\nIf you didn't request this, ignore this email.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 14. Membership Accepted (grace period begins)
// Sent immediately when admin sets status → "accepted".
// Introduces the grace period and prompts the member to choose a plan.
// ─────────────────────────────────────────────
export function membershipAcceptedHtml(opts: {
  firstName: string;
  memberCode: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">YOU'RE IN</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Welcome to<br/>HomeQuarters, ${opts.firstName}.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Your application has been approved by the membership committee. You are now part of the HomeQuarters community.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      You have <strong style="color:#1C1C1E;">30 free days</strong> to explore the app before your membership begins. When you're ready, choose a plan to unlock the full experience - and to help keep this community going.
    </p>

    <!-- Membership CTA -->
    ${ctaButton("Choose your plan", `${BASE_URL}/membership`, "#C9A84C")}

    ${goldDivider()}

    <!-- Why your membership matters -->
    <p style="margin:0 0 16px;color:#1C1C1E;font-size:13px;font-weight:700;letter-spacing:-0.1px;">Why your membership matters</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F0E8DC;">
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🌍 &nbsp;Supports our growing member community</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F0E8DC;">
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🔧 &nbsp;Keeps the app running and well maintained</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F0E8DC;">
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">✨ &nbsp;Funds new features and product improvements</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🏡 &nbsp;Brings more partner venues on board for you</p>
        </td>
      </tr>
    </table>

    ${goldDivider()}

    <p style="margin:0 0 12px;color:#1C1C1E;font-size:13px;font-weight:600;">Your membership details</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("MEMBER CODE", opts.memberCode)}
      ${infoRow("STATUS", "ACCEPTED - 30 DAY TRIAL")}
      ${infoRow("PLANS FROM", "£5 / MONTH")}
    </table>

    ${goldDivider()}

    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Questions about plans or billing? Reply to this email - we&rsquo;re happy to help. Your member code is your identity within the community. Keep it private - it&rsquo;s used to verify your membership at partner venues.
    </p>
  `;
  return wrap(body);
}

export function membershipAcceptedText(opts: {
  firstName: string;
  memberCode: string;
}): string {
  return `Hi ${opts.firstName},

Welcome to HomeQuarters. Your application has been approved.

You have 30 free days to explore the app before your membership begins. When you're ready, choose a plan - your support is what keeps this community, the app, and our partner venues growing.

Choose your plan: ${BASE_URL}/membership

WHY YOUR MEMBERSHIP MATTERS
- Supports our growing member community
- Keeps the app running and well maintained
- Funds new features and product improvements
- Brings more partner venues on board for you

Plans start from £5/month.

Your member code: ${opts.memberCode}
Keep this private - it's used to verify your membership at partner venues.

Any questions? Reply to this email.

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 15. Grace Period Payment Reminders
// Sent at day 10, day 20, and day 30 after acceptance.
// Each has a different subject and value angle, but always
// mentions remaining days and the four community pillars.
// ─────────────────────────────────────────────

const GRACE_VALUE_BLOCK = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #F0E8DC;">
        <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🌍 &nbsp;Supports our growing member community</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #F0E8DC;">
        <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🔧 &nbsp;Keeps the app running and well maintained</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #F0E8DC;">
        <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">✨ &nbsp;Funds new features and product improvements</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0;">
        <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🏡 &nbsp;Brings more partner venues on board for you</p>
      </td>
    </tr>
  </table>
`;

export function graceReminderHtml(opts: {
  firstName: string;
  daysRemaining: number;
  reminderNumber: 1 | 2 | 3;
}): string {
  const { firstName, daysRemaining, reminderNumber } = opts;

  const tagline = reminderNumber === 1
    ? "A gentle nudge"
    : reminderNumber === 2
    ? "Still time"
    : "Last chance";

  const headline = reminderNumber === 1
    ? `Your membership is waiting,<br/>${firstName}.`
    : reminderNumber === 2
    ? `${daysRemaining} days left on<br/>your free trial.`
    : `Today's the last day<br/>of your free trial.`;

  const intro = reminderNumber === 1
    ? `You've been exploring HomeQuarters for 10 days now. We hope it's been worth it. You still have <strong style="color:#1C1C1E;">${daysRemaining} days</strong> before you'll need a plan to keep access.`
    : reminderNumber === 2
    ? `Your free trial is almost up. You have <strong style="color:#1C1C1E;">${daysRemaining} days</strong> left before you'll need a plan to stay in the community.`
    : `Your 30-day free trial ends today. After today, you'll need an active membership to continue using HomeQuarters.`;

  const valueIntro = reminderNumber === 1
    ? `Choosing a plan is more than unlocking features - it's what makes this whole thing work.`
    : reminderNumber === 2
    ? `Your membership directly supports everything you've been enjoying. Here's what it goes towards:`
    : `Every membership counts. Here's what yours would support:`;

  const closingNote = reminderNumber === 1
    ? `Plans start from <strong style="color:#1C1C1E;">£5/month</strong>. No pressure - you've got ${daysRemaining} days. But when you're ready, we'd love to have you as a full member.`
    : reminderNumber === 2
    ? `Plans from <strong style="color:#1C1C1E;">£5/month</strong>. Annual plans save you 15%. Take a look - it only takes a minute.`
    : `Plans from <strong style="color:#1C1C1E;">£5/month</strong>. Thank you for being part of this community - we hope you'll stick around.`;

  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${tagline.toUpperCase()}</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">${headline}</h1>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">${intro}</p>

    ${goldDivider()}

    <p style="margin:0 0 16px;color:#1C1C1E;font-size:13px;font-weight:700;letter-spacing:-0.1px;">${valueIntro}</p>

    ${GRACE_VALUE_BLOCK}

    ${ctaButton("Choose your plan", `${BASE_URL}/membership`, "#C9A84C")}

    ${goldDivider()}

    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">${closingNote}</p>
  `;
  return wrap(body);
}

export function graceReminderText(opts: {
  firstName: string;
  daysRemaining: number;
  reminderNumber: 1 | 2 | 3;
}): string {
  const { firstName, daysRemaining, reminderNumber } = opts;

  const intro = reminderNumber === 1
    ? `You've been exploring HomeQuarters for 10 days. We hope you've been enjoying it. You still have ${daysRemaining} days left on your free trial.`
    : reminderNumber === 2
    ? `Your free trial is nearly up. You have ${daysRemaining} days left before you'll need a plan to stay in the community.`
    : `Your 30-day free trial ends today. After today, an active membership is required to continue using HomeQuarters.`;

  const closing = reminderNumber === 1
    ? `No rush - you have ${daysRemaining} days. But when you're ready, we'd love to have you as a full member.`
    : reminderNumber === 2
    ? `Plans start from £5/month. Annual plans save 15%. Takes a minute to set up.`
    : `Plans start from £5/month. Thank you for being part of this - we hope you'll stay.`;

  return `Hi ${firstName},

${intro}

Your membership supports:
- Our growing member community
- Keeping the app running and maintained
- New features and product improvements
- Bringing more partner venues on board

Choose your plan: ${BASE_URL}/membership

${closing}

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 16. Payment Confirmed
// Sent when a member completes their first payment (grace period ends early
// or they pay on day 0). Replaces silence with a warm confirmation.
// ─────────────────────────────────────────────
export function paymentConfirmedHtml(opts: {
  firstName: string;
  memberCode: string;
  tier: string;
  nextBillingDate: string;
}): string {
  const tierLabel = opts.tier === "platinum_card" ? "Platinum" : "Gold";
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">MEMBERSHIP CONFIRMED</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">You&rsquo;re a full<br/>HQ member, ${opts.firstName}.</h1>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Your payment was successful. Your <strong style="color:#1C1C1E;">${tierLabel}</strong> membership is now active — thank you for being part of this community.
    </p>
    ${goldDivider()}
    <p style="margin:0 0 12px;color:#1C1C1E;font-size:13px;font-weight:600;">Your membership details</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("MEMBER CODE", opts.memberCode)}
      ${infoRow("TIER", tierLabel.toUpperCase())}
      ${infoRow("NEXT BILLING DATE", opts.nextBillingDate)}
    </table>
    ${goldDivider()}
    <p style="margin:0 0 20px;color:#9A8E82;font-size:13px;line-height:21px;">
      You have full access to partner venues, deals, events, and the member community. Your QR code is in the app whenever you need it.
    </p>
    ${ctaButton("Open HomeQuarters", BASE_URL)}
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Questions about billing? Visit Account &rsaquo; Billing in the app, or reply to this email. You can manage or cancel your subscription at any time.
    </p>
  `;
  return wrap(body);
}

export function paymentConfirmedText(opts: {
  firstName: string;
  memberCode: string;
  tier: string;
  nextBillingDate: string;
}): string {
  const tierLabel = opts.tier === "platinum_card" ? "Platinum" : "Gold";
  return `Hi ${opts.firstName},

Your payment was successful. Your ${tierLabel} HomeQuarters membership is now active.

Member code: ${opts.memberCode}
Tier: ${tierLabel}
Next billing date: ${opts.nextBillingDate}

You have full access to partner venues, deals, events, and the member community.

Open the app: ${BASE_URL}

Questions about billing? Reply to this email or visit Account > Billing in the app.

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 17. Payment Failed
// Sent when invoice.payment_failed fires. Urgent but not alarmist.
// Directs member to the Stripe portal to update their card.
// ─────────────────────────────────────────────
export function paymentFailedHtml(opts: {
  firstName: string;
  portalUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#E53935;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">ACTION REQUIRED</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Your payment<br/>didn&rsquo;t go through.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, we weren&rsquo;t able to process your HomeQuarters subscription payment. This is usually because a card has expired or a billing detail has changed — it happens.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Please update your payment method to keep your membership active. It only takes a minute.
    </p>
    ${ctaButton("Update payment method", opts.portalUrl, "#E53935")}
    ${goldDivider()}
    <p style="margin:0 0 16px;color:#9A8E82;font-size:13px;line-height:21px;">
      Stripe will automatically retry your payment in the next few days. If the retry also fails, your membership will be suspended until payment is resolved.
    </p>
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      If you&rsquo;re having trouble, reply to this email and we&rsquo;ll sort it out together.
    </p>
  `;
  return wrap(body);
}

export function paymentFailedText(opts: {
  firstName: string;
  portalUrl: string;
}): string {
  return `Hi ${opts.firstName},

We weren't able to process your HomeQuarters subscription payment. This is usually a card expiry or billing detail change.

Please update your payment method to keep your membership active:
${opts.portalUrl}

Stripe will retry automatically in the next few days. If the retry also fails, your membership will be suspended.

Reply to this email if you need help.

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 18. Subscription Cancelled (Win-Back)
// Sent 24 hours after customer.subscription.deleted fires.
// Plain-text style from Valentine — warm, no hard sell.
// ─────────────────────────────────────────────
export function subscriptionCancelledText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},

Your HomeQuarters membership has ended. I wanted to reach out personally.

Thank you for being part of the community — even briefly. I hope it was worth your time, and I'm sorry if it wasn't everything you were hoping for.

If there's something we got wrong, or something we could do better, I genuinely want to know. Reply to this email — I read every one.

If life just got in the way and you'd like to come back when the time is right, the door is always open. You won't need to reapply — just reach out.

With warmth,

Valentine Eluwasi
Founder, HomeQuarters
hello@thehomequarters.com`;
}

// ─────────────────────────────────────────────
// 19. Newsletter Subscriber Welcome
// Sent immediately when someone subscribes via the website popup.
// Warm confirmation + soft membership CTA.
// ─────────────────────────────────────────────
export function newsletterWelcomeHtml(opts: { firstName?: string }): string {
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
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      To unsubscribe at any time, reply to this email with &ldquo;unsubscribe&rdquo; in the subject line.
    </p>
  `;
  return wrap(body);
}

export function newsletterWelcomeText(opts: { firstName?: string }): string {
  const greeting = opts.firstName ? `Hi ${opts.firstName},` : "Hello,";
  return `${greeting}

You're now subscribed to HomeQuarters updates. We'll be in touch occasionally with community news, events, and what's happening at our partner venues.

We keep it intentional — you won't hear from us unless we have something worth saying.

INTERESTED IN FULL MEMBERSHIP?
HomeQuarters is a private members' community, by invitation. If you know a current member, ask them for an invitation code and apply in the app. Or keep an eye on your inbox — we occasionally open applications to our waitlist.

Learn more: ${BASE_URL}

To unsubscribe, reply with "unsubscribe" in the subject.

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 20. Welcome Journey — Day 30: Invite a friend
// Sent 30 days after membership becomes active.
// The community grows through members — this is the viral nudge.
// ─────────────────────────────────────────────
export function welcomeInviteNudgeHtml(opts: { firstName: string }): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">ONE MONTH IN</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Who would belong<br/>here, ${opts.firstName}?</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      You&rsquo;ve been a HomeQuarters member for a month now. We hope it&rsquo;s been everything we promised.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      The people you bring in are the people who shape what this community becomes. If someone comes to mind — a friend, a colleague, someone you&rsquo;d want to run into at a venue — consider inviting them.
    </p>
    ${goldDivider()}
    <p style="margin:0 0 16px;color:#1C1C1E;font-size:13px;font-weight:700;">How to invite someone</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #F0E8DC;">
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">1 &nbsp;&nbsp;Open the app and go to <strong style="color:#1C1C1E;">Account</strong></p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #F0E8DC;">
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">2 &nbsp;&nbsp;Tap <strong style="color:#1C1C1E;">Nominate a Member</strong></p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;">
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">3 &nbsp;&nbsp;Your personal invitation code will be generated — share it with them directly</p>
        </td>
      </tr>
    </table>
    ${ctaButton("Nominate a member", BASE_URL)}
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Your nomination is a personal endorsement — it means you&rsquo;re vouching for this person. Only invite people you genuinely believe would add to the community.
    </p>
  `;
  return wrap(body);
}

export function welcomeInviteNudgeText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},

You've been a HomeQuarters member for a month. We hope it's been everything we promised.

The people you bring in shape what this community becomes. If someone comes to mind — a friend, a colleague, someone you'd want to run into at a venue — consider inviting them.

HOW TO INVITE SOMEONE
1. Open the app and go to Account
2. Tap "Nominate a Member"
3. Your personal invitation code will be generated — share it with them directly

Your nomination is a personal endorsement. Only invite people you genuinely believe belong here.

Open the app: ${BASE_URL}

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 21. Venue Redemption Notification (instant, plain text)
// Sent to venue contact_email when notify_on_redemption is true
// and a verified redemption is recorded via verifyRedemption.
// ─────────────────────────────────────────────
export function venueRedemptionNotificationText(opts: {
  venueName: string;
  dealTitle: string;
  memberTier: string;
  redeemedAt: string;
}): string {
  const tierLabel = opts.memberTier === "platinum_card" ? "Platinum Card" : "Gold Card";
  return `A HomeQuarters member just redeemed a benefit at ${opts.venueName}.

Deal: ${opts.dealTitle}
Member tier: ${tierLabel}
Time: ${opts.redeemedAt}

This is an automated notification from HomeQuarters.
To manage your notification preferences, contact hello@thehomequarters.com`;
}

// ─────────────────────────────────────────────
// 22. Venue Monthly Partner Digest
// Sent automatically on the 1st of each month to venue contact_email.
// Shows redemption stats for the previous calendar month.
// ─────────────────────────────────────────────
export function venueMonthlyDigestHtml(opts: {
  venueName: string;
  month: string;
  totalRedemptions: number;
  deals: { title: string; count: number }[];
  tierBreakdown: { gold: number; platinum: number };
  prevMonthTotal: number | null;
}): string {
  const changeText = (() => {
    if (opts.prevMonthTotal === null) return "First month on record.";
    if (opts.prevMonthTotal === 0) return opts.totalRedemptions > 0 ? "Up from 0 last month." : "No change from last month.";
    const pct = Math.round(((opts.totalRedemptions - opts.prevMonthTotal) / opts.prevMonthTotal) * 100);
    if (pct > 0) return `+${pct}% vs last month.`;
    if (pct < 0) return `${pct}% vs last month.`;
    return "Same as last month.";
  })();

  const dealsRows = opts.deals.length > 0
    ? opts.deals.map((d) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #F0E8DC;color:#1C1C1E;font-size:13px;">${d.title}</td>
        <td style="padding:10px 0;border-bottom:1px solid #F0E8DC;color:#C9A84C;font-size:13px;font-weight:700;text-align:right;">${d.count}</td>
      </tr>`).join("")
    : `<tr><td colspan="2" style="padding:10px 0;color:#9A8E82;font-size:13px;">No deal redemptions this month.</td></tr>`;

  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">YOUR MONTHLY PARTNER REPORT</p>
    <h1 style="margin:0 0 8px;color:#1C1C1E;font-size:26px;font-weight:800;line-height:32px;letter-spacing:-0.3px;">${opts.venueName}</h1>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;">${opts.month}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5F0;border-radius:12px;padding:24px;margin-bottom:28px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;color:#9A8E82;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">HQ MEMBERS THIS MONTH</p>
          <p style="margin:0 0 8px;color:#1C1C1E;font-size:48px;font-weight:800;line-height:1;letter-spacing:-2px;">${opts.totalRedemptions}</p>
          <p style="margin:0;color:#9A8E82;font-size:12px;">${changeText}</p>
        </td>
      </tr>
    </table>

    ${goldDivider()}

    <p style="margin:0 0 12px;color:#1C1C1E;font-size:13px;font-weight:700;">Deal breakdown</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${dealsRows}
    </table>

    <p style="margin:0 0 12px;color:#1C1C1E;font-size:13px;font-weight:700;">Member tier split</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${infoRow("GOLD CARD", String(opts.tierBreakdown.gold))}
      ${infoRow("PLATINUM CARD", String(opts.tierBreakdown.platinum))}
    </table>

    ${goldDivider()}

    <p style="margin:0 0 16px;color:#9A8E82;font-size:13px;line-height:21px;">
      HQ members discover your venue and browse your benefits directly in the HomeQuarters app. The members who visited you this month are part of a curated, invite-only community.
    </p>
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Questions, or want to update your venue listing or deals? Simply reply to this email.
    </p>
  `;
  return wrap(body);
}

export function venueMonthlyDigestText(opts: {
  venueName: string;
  month: string;
  totalRedemptions: number;
  deals: { title: string; count: number }[];
  tierBreakdown: { gold: number; platinum: number };
  prevMonthTotal: number | null;
}): string {
  const changeText = (() => {
    if (opts.prevMonthTotal === null) return "First month on record.";
    if (opts.prevMonthTotal === 0) return opts.totalRedemptions > 0 ? "Up from 0 last month." : "No change from last month.";
    const pct = Math.round(((opts.totalRedemptions - opts.prevMonthTotal) / opts.prevMonthTotal) * 100);
    if (pct > 0) return `+${pct}% vs last month.`;
    if (pct < 0) return `${pct}% vs last month.`;
    return "Same as last month.";
  })();

  const dealLines = opts.deals.length > 0
    ? opts.deals.map((d) => `  ${d.title}: ${d.count}`).join("\n")
    : "  No deal redemptions this month.";

  return `YOUR MONTHLY PARTNER REPORT — ${opts.venueName}
${opts.month}

HQ MEMBERS THIS MONTH: ${opts.totalRedemptions}
${changeText}

DEAL BREAKDOWN
${dealLines}

MEMBER TIER SPLIT
  Gold Card: ${opts.tierBreakdown.gold}
  Platinum Card: ${opts.tierBreakdown.platinum}

HQ members discover your venue and browse your benefits directly in the HomeQuarters app.

Questions or want to update your listing? Reply to this email.

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 23. Member Redemption Thank-You
// Sent to the member after they redeem a deal (verified by venue staff).
// Warm appreciation + social/review nudge to support the partner venue.
// ─────────────────────────────────────────────
export function memberRedemptionThankYouHtml(opts: {
  firstName: string;
  venueName: string;
  dealTitle: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">THANK YOU</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Hope you enjoyed<br/>${opts.venueName}.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, we hope your visit was everything it should have been.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Every one of our partner venues is genuinely proud to host HomeQuarters members. They set aside exclusive benefits for you because they believe in what this community stands for &mdash; and because they want to earn your loyalty.
    </p>
    ${goldDivider()}
    <p style="margin:0 0 12px;color:#1C1C1E;font-size:14px;font-weight:700;line-height:22px;">A small favour, if you&rsquo;re happy to.</p>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      In exchange for the exclusive member benefits they provide, we&rsquo;d be incredibly grateful if you could:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #F0E8DC;">
          <p style="margin:0;color:#1C1C1E;font-size:13px;line-height:20px;">
            <strong>Leave a positive review.</strong>
            <span style="color:#9A8E82;"> A few kind words on Google or TripAdvisor go a long way for a small business. It only takes a minute and it means the world to them.</span>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;">
          <p style="margin:0;color:#1C1C1E;font-size:13px;line-height:20px;">
            <strong>Share on social.</strong>
            <span style="color:#9A8E82;"> A post, a story, a tag &mdash; it helps bring real people through their door. This is how we keep the cashflow moving in our community and support the brands, businesses, and institutions we genuinely love.</span>
          </p>
        </td>
      </tr>
    </table>
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Thank you for being part of this. See you at the next one.
    </p>
  `;
  return wrap(body);
}

export function memberRedemptionThankYouText(opts: {
  firstName: string;
  venueName: string;
  dealTitle: string;
}): string {
  return `Hi ${opts.firstName},

We hope your visit to ${opts.venueName} was everything it should have been.

Every one of our partner venues is genuinely proud to host HomeQuarters members. They set aside exclusive benefits because they believe in what this community stands for — and because they want to earn your loyalty.

A SMALL FAVOUR, IF YOU'RE HAPPY TO

In exchange for the exclusive member benefits they provide, we'd be incredibly grateful if you could:

Leave a positive review — a few kind words on Google or TripAdvisor means the world to a small business. It only takes a minute.

Share on social — a post, a story, a tag. It helps bring real people through their door. This is how we keep cashflow moving in our community and support the brands, businesses, and institutions we genuinely love.

Thank you for being part of this. See you at the next one.

HomeQuarters`;
}

// ─────────────────────────────────────────────
// 24. Founding Member designation
// Plain text only. From Valentine. Covers founding + committee perks.
// ─────────────────────────────────────────────
export function foundingMemberText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},

I wanted to reach out personally.

We've designated you as a Founding Member of HomeQuarters. With that, you're also part of the committee.

You've been here from the beginning, and that means something to us. Founding Members are the people who helped shape what this community is, through their presence, their connections, and the culture they've brought with them.

Here's what this means for you:

Your vouch alone is enough to accept someone into HomeQuarters. No second vouch needed. Use it for people you genuinely believe in.

You'll be invited to Committee Member dinners and events. Smaller, more intimate gatherings for the people at the centre of this community.

You'll have priority access to HQ events and anything new we launch, and you'll hear about it first.

The Founding Member designation will appear permanently on your profile.

And occasionally, when difficult membership decisions arise, we may reach out for your perspective. Your judgement matters to us.

In return, all we ask is that you stay present, uphold the culture, and handle anything discussed in confidence with discretion.

Thank you for being here from the start.

Valentine Eluwasi
Founder, HomeQuarters
hello@thehomequarters.com`;
}

// ─────────────────────────────────────────────
// 25. Committee Member designation
// Plain text only. From Valentine.
// ─────────────────────────────────────────────
export function committeeMemberText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},

I wanted to let you know personally. You've been appointed as a Committee Member of HomeQuarters.

This is a role we don't give lightly. It means we trust your judgement and believe you represent what this community stands for.

Here's what this means for you:

Your vouch alone is enough to get someone accepted into HomeQuarters. You don't need a second. Use it for people you genuinely believe in.

You'll be invited to Committee Member dinners and events. Smaller, more intimate gatherings for the people at the centre of this community.

From time to time, if a serious membership question comes up, we may reach out for your thoughts. Not for everything. Just where your perspective would be genuinely useful.

What we ask of you:

Handle anything discussed in your committee capacity with complete discretion. The trust of this community depends on it.

Stay engaged. That's really all.

Welcome to the committee.

Valentine Eluwasi
Founder, HomeQuarters
hello@thehomequarters.com`;
}
