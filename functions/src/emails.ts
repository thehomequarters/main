// ─────────────────────────────────────────────
// HQ Branded Email Templates
// All styles are inline — required for email client compatibility.
// Palette: cream #F2EBE0 · dark #1C1C1E · gold #C9A84C · stone #9A8E82
// ─────────────────────────────────────────────

const BASE_URL = process.env.APP_BASE_URL ?? "https://homequarters.co.uk";

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
      You can strengthen your application by getting current members to vouch for you. Share your application code — <strong style="color:#1C1C1E;font-family:monospace;">${opts.applicationCode}</strong> — with people who know you and are already in the community.
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
      Your member code is your identity within the community. Keep it private — it&rsquo;s used to verify your membership at partner venues.
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
      After careful review, the membership committee has decided not to move forward with your application at this time. This decision is not a reflection of your character or achievements — our membership is shaped by the community&rsquo;s current composition and needs.
    </p>
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      We wish you well. If you believe this decision was made in error, or if your circumstances change, you are welcome to reach out to us at <a href="mailto:hello@homequarters.co.uk" style="color:#1C1C1E;font-weight:600;">hello@homequarters.co.uk</a>.
    </p>
  `;
  return wrap(body);
}

export function applicationRejectedText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},\n\nThank you for applying to HomeQuarters. After careful consideration, we are not able to move forward at this time.\n\nIf you have any questions, contact us at hello@homequarters.co.uk.\n\nHomeQuarters`;
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
    ${ctaButton("Contact Support", "mailto:hello@homequarters.co.uk", "#1C1C1E")}
    ${goldDivider()}
    <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
      Reach us at <a href="mailto:hello@homequarters.co.uk" style="color:#1C1C1E;font-weight:600;">hello@homequarters.co.uk</a>. We handle all queries confidentially and fairly.
    </p>
  `;
  return wrap(body);
}

export function membershipSuspendedText(opts: { firstName: string }): string {
  return `Hi ${opts.firstName},\n\nYour HomeQuarters membership has been suspended. Access to member benefits has been paused.\n\nFor questions, contact hello@homequarters.co.uk.\n\nHomeQuarters`;
}

// ─────────────────────────────────────────────
// 5. Password Reset
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
      If you did not request a password reset, you can safely ignore this email. Your password will not change. If you&rsquo;re concerned about your account security, contact us at <a href="mailto:hello@homequarters.co.uk" style="color:#1C1C1E;font-weight:600;">hello@homequarters.co.uk</a>.
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
