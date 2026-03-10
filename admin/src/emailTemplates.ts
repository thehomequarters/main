// ─────────────────────────────────────────────
// HQ Branded Email Templates - Admin Preview Copy
// Mirrors functions/src/emails.ts (pure string functions, no dependencies).
// Keep in sync manually when templates change.
// ─────────────────────────────────────────────

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
          <p style="margin:0;color:#9A8E82;font-size:11px;line-height:18px;text-align:center;">
            HomeQuarters · Private Members&rsquo; Community<br/>
            This email was sent to you because you have an account with HomeQuarters.<br/>
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
export function applicationRejectedHtml(opts: { firstName: string }): string {
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
export function membershipSuspendedHtml(opts: { firstName: string }): string {
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
// 9. Web Application Received
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
// 10. Welcome Journey - Day 1: Founder note (plain text only)
// ─────────────────────────────────────────────
export function founderWelcomeText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},

I wanted to drop you a quick note personally.

Welcome to HomeQuarters.

We built this community around a simple idea - that people who share a connection to a homeland, wherever they are in the world, deserve a place that feels like their own. Somewhere with a real sense of belonging, not just another app or membership card.

I'm genuinely glad you're here.

Take your time settling in. Explore the app, connect with a few members, and don't hesitate to reach out if you have any questions or feedback. I read everything.

With warmth,

Valentine Eluwasi
Founder, HomeQuarters
hello@thehomequarters.com`;
}

// ─────────────────────────────────────────────
// 11. Welcome Journey - Day 4: Features tour
// ─────────────────────────────────────────────
export function welcomeFeaturesTourHtml(opts: { firstName: string }): string {
  const body = `
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">YOUR MEMBERSHIP</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Everything that<br/>comes with HQ.</h1>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${opts.firstName}, now that you&rsquo;re settled in, here&rsquo;s a quick look at what your membership unlocks.
    </p>

    ${goldDivider()}

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
// 13. Membership Accepted (onMemberAccepted - immediate)
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
    ${ctaButton("Choose your plan", `${BASE_URL}/membership`, "#C9A84C")}
    ${goldDivider()}
    <p style="margin:0 0 16px;color:#1C1C1E;font-size:13px;font-weight:700;letter-spacing:-0.1px;">Why your membership matters</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #F0E8DC;"><p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🌍 &nbsp;Supports our growing member community</p></td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #F0E8DC;"><p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🔧 &nbsp;Keeps the app running and well maintained</p></td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #F0E8DC;"><p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">✨ &nbsp;Funds new features and product improvements</p></td></tr>
      <tr><td style="padding:8px 0;"><p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🏡 &nbsp;Brings more partner venues on board for you</p></td></tr>
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
      Questions about plans or billing? Reply to this email - we&rsquo;re happy to help.
    </p>
  `;
  return wrap(body);
}

export function membershipAcceptedText(opts: {
  firstName: string;
  memberCode: string;
}): string {
  return `Hi ${opts.firstName},\n\nWelcome to HomeQuarters. Your application has been approved.\n\nYou have 30 free days to explore the app before your membership begins. When you're ready, choose a plan - your support is what keeps this community going.\n\nChoose your plan: ${BASE_URL}/membership\n\nPlans start from £5/month.\n\nYour member code: ${opts.memberCode}\n\nAny questions? Reply to this email.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 14. Grace Period Payment Reminders (onMemberAccepted - days 10, 20, 30)
// ─────────────────────────────────────────────
const GRACE_VALUE_BLOCK = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #F0E8DC;"><p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🌍 &nbsp;Supports our growing member community</p></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #F0E8DC;"><p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🔧 &nbsp;Keeps the app running and well maintained</p></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #F0E8DC;"><p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">✨ &nbsp;Funds new features and product improvements</p></td></tr>
    <tr><td style="padding:8px 0;"><p style="margin:0;color:#9A8E82;font-size:13px;line-height:20px;">🏡 &nbsp;Brings more partner venues on board for you</p></td></tr>
  </table>
`;

export function graceReminderHtml(opts: {
  firstName: string;
  daysRemaining: number;
  reminderNumber: 1 | 2 | 3;
}): string {
  const { firstName, daysRemaining, reminderNumber } = opts;

  const tagline = reminderNumber === 1 ? "A gentle nudge" : reminderNumber === 2 ? "Still time" : "Last chance";
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
  return `Hi ${firstName},\n\n${intro}\n\nYour membership supports:\n- Our growing member community\n- Keeping the app running and maintained\n- New features and product improvements\n- Bringing more partner venues on board\n\nChoose your plan: ${BASE_URL}/membership\n\n${closing}\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 15. Password Reset
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
