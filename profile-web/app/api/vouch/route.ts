import { type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const DARK = "#1C1C1E";
const GOLD = "#C9A84C";
const CREAM = "#FAF8F5";

function page(title: string, heading: string, body: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${title} — HomeQuarters</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${DARK};
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      padding: 32px 20px;
    }
    .card {
      background: rgba(250,248,245,0.04);
      border: 1px solid rgba(201,168,76,0.15);
      border-radius: 14px;
      padding: 40px 36px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    .symbol {
      color: ${GOLD};
      font-size: 20px;
      margin-bottom: 18px;
      letter-spacing: 4px;
    }
    .label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      color: ${GOLD};
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: ${CREAM};
      line-height: 1.2;
      letter-spacing: -0.2px;
      margin-bottom: 12px;
    }
    p {
      font-size: 13px;
      color: rgba(250,248,245,0.45);
      line-height: 1.65;
    }
    .divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 22px 0;
    }
    .divider-line { flex: 1; height: 1px; background: rgba(201,168,76,0.15); }
    .divider-dot { color: ${GOLD}; font-size: 9px; opacity: 0.5; }
    a.home {
      display: inline-block;
      margin-top: 20px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: rgba(201,168,76,0.55);
      text-decoration: none;
    }
    a.home:hover { color: ${GOLD}; }
  </style>
</head>
<body>
  <div class="card">
    <div class="symbol">✦</div>
    <div class="label">${title}</div>
    <h1>${heading}</h1>
    <div class="divider">
      <div class="divider-line"></div>
      <span class="divider-dot">✦</span>
      <div class="divider-line"></div>
    </div>
    <p>${body}</p>
    <a class="home" href="https://thehomequarters.com">thehomequarters.com</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return page(
      "Invalid Link",
      "This link is invalid.",
      "No vouch token was provided. Please check the email link and try again."
    );
  }

  // Find application with this token
  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    snap = await adminDb
      .collection("open_applications")
      .where("vouch_token", "==", token)
      .limit(1)
      .get();
  } catch {
    return page(
      "Error",
      "Something went wrong.",
      "We couldn&rsquo;t process your vouch right now. Please try again in a moment."
    );
  }

  if (snap.empty) {
    return page(
      "Invalid Link",
      "This link is invalid.",
      "We couldn&rsquo;t find an application matching this link. It may have already been used or the link is incorrect."
    );
  }

  const doc = snap.docs[0];
  const data = doc.data();

  if (data.vouched === true) {
    return page(
      "Already Confirmed",
      "You&rsquo;ve already vouched.",
      "Your vouch for this application has already been confirmed. Thank you for your support."
    );
  }

  // Mark as vouched
  try {
    await doc.ref.update({
      vouched: true,
      vouched_at: new Date().toISOString(),
    });
  } catch {
    return page(
      "Error",
      "Something went wrong.",
      "We couldn&rsquo;t record your vouch right now. Please try again in a moment."
    );
  }

  const applicantFirstName = (data.first_name as string | undefined) ?? "them";

  return page(
    "Vouch Confirmed",
    `You&rsquo;ve vouched for ${applicantFirstName}.`,
    `Thank you. Your vouch has been recorded and ${applicantFirstName}&rsquo;s application is now with our membership committee.`
  );
}
