import { Resend } from "resend";

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

const FROM = "HomeQuarters <noreply@thehomequarters.com>";
const SUPPORT_EMAIL = "hello@thehomequarters.com";
const APP_URL = "https://thehomequarters.com";

function baseTemplate(content: string): string {
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
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr>
              <td style="border-top:1px solid #E0D5C5;"></td>
              <td style="width:32px;padding:0 12px;text-align:center;color:#C9A84C;font-size:14px;">✦</td>
              <td style="border-top:1px solid #E0D5C5;"></td>
            </tr>
          </table>
          <p style="margin:0;color:#9A8E82;font-size:13px;line-height:21px;">
            Reach us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#1C1C1E;font-weight:600;">${SUPPORT_EMAIL}</a>. We handle all queries confidentially and fairly.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F2EBE0;padding:28px 40px;border:1px solid #E0D5C5;border-top:none;border-radius:0 0 16px 16px;">
          <p style="margin:0;color:#9A8E82;font-size:11px;line-height:18px;text-align:center;">
            HomeQuarters · Private Members' Community<br/>
            This email was sent to you because you have an account with HomeQuarters.<br/>
            © ${new Date().getFullYear()} HomeQuarters. All rights reserved.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendApprovalEmail(
  to: string,
  firstName: string
): Promise<void> {
  const html = baseTemplate(`
    <p style="margin:0 0 6px;color:#C9A84C;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">MEMBERSHIP APPROVED</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Welcome to<br/>HomeQuarters.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${firstName}, your HomeQuarters membership has been approved. You now have full access to member benefits, exclusive venues, and our private community.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Open the app to explore everything available to you as a member.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr><td style="background:#1C1C1E;border-radius:100px;">
        <a href="${APP_URL}" style="display:inline-block;padding:16px 36px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">Open HomeQuarters</a>
      </td></tr>
    </table>
  `);

  const text = `Hi ${firstName},\n\nYour HomeQuarters membership has been approved. Welcome to the community.\n\nOpen the app to explore your member benefits.\n\nFor questions, contact ${SUPPORT_EMAIL}.\n\nHomeQuarters`;

  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Welcome to HomeQuarters — you're in.",
    html,
    text,
  });
}

export async function sendRejectionEmail(
  to: string,
  firstName: string
): Promise<void> {
  const html = baseTemplate(`
    <p style="margin:0 0 6px;color:#9A8E82;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">APPLICATION UPDATE</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Your application<br/>was not approved.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${firstName}, thank you for applying to HomeQuarters. After careful review, we're unable to offer you membership at this time.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      Membership at HomeQuarters is curated to maintain a specific community experience. This decision is not a reflection of your personal or professional standing.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr><td style="background:#1C1C1E;border-radius:100px;">
        <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;padding:16px 36px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">Contact Support</a>
      </td></tr>
    </table>
  `);

  const text = `Hi ${firstName},\n\nThank you for applying to HomeQuarters. After careful review, we're unable to offer you membership at this time.\n\nFor questions, contact ${SUPPORT_EMAIL}.\n\nHomeQuarters`;

  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Your HomeQuarters application",
    html,
    text,
  });
}

export async function sendSuspensionEmail(
  to: string,
  firstName: string
): Promise<void> {
  const html = baseTemplate(`
    <p style="margin:0 0 6px;color:#E53935;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">ACCOUNT NOTICE</p>
    <h1 style="margin:0 0 20px;color:#1C1C1E;font-size:28px;font-weight:800;line-height:34px;letter-spacing:-0.3px;">Your membership<br/>has been suspended.</h1>
    <p style="margin:0 0 16px;color:#9A8E82;font-size:14px;line-height:22px;">
      Hi ${firstName}, your HomeQuarters membership has been temporarily suspended. Access to member benefits, venues, and the community has been paused.
    </p>
    <p style="margin:0 0 28px;color:#9A8E82;font-size:14px;line-height:22px;">
      If you believe this is an error, or if you would like to understand the reason for suspension, please contact the team.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr><td style="background:#1C1C1E;border-radius:100px;">
        <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;padding:16px 36px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">Contact Support</a>
      </td></tr>
    </table>
  `);

  const text = `Hi ${firstName},\n\nYour HomeQuarters membership has been suspended. Access to member benefits has been paused.\n\nFor questions, contact ${SUPPORT_EMAIL}.\n\nHomeQuarters`;

  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Your HomeQuarters membership has been suspended",
    html,
    text,
  });
}
