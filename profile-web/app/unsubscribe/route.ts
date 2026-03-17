import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const BASE_URL = "https://thehomequarters.com";

// ── Page HTML ─────────────────────────────────────────────────────────────────

function renderPage(opts: {
  email: string;
  state: "confirm" | "done" | "error";
}): Response {
  const { email, state } = opts;

  const content =
    state === "done"
      ? `
        <p class="label">YOU'RE UNSUBSCRIBED</p>
        <h1>All done.</h1>
        <p class="body">
          <strong>${email}</strong> has been removed from all HomeQuarters
          marketing emails. You may still receive essential account emails
          (password resets, membership decisions).
        </p>
        <a class="btn" href="${BASE_URL}">Back to HomeQuarters</a>`
      : state === "error"
      ? `
        <p class="label">SOMETHING WENT WRONG</p>
        <h1>Try again.</h1>
        <p class="body">
          We couldn't process your request. Please try again or reply to any
          HomeQuarters email to unsubscribe manually.
        </p>
        <a class="btn" href="${BASE_URL}">Back to HomeQuarters</a>`
      : `
        <p class="label">EMAIL PREFERENCES</p>
        <h1>Unsubscribe</h1>
        <p class="body">
          Confirm you'd like to remove <strong>${email}</strong> from
          HomeQuarters marketing and newsletter emails.
        </p>
        <form method="POST" action="/unsubscribe">
          <input type="hidden" name="email" value="${email}" />
          <button type="submit" class="btn">Confirm unsubscribe</button>
        </form>
        <p class="note">
          You'll still receive essential account emails (membership decisions,
          password resets).
        </p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribe · HomeQuarters</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #F2EBE0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }
    .card {
      background: #fff;
      border: 1px solid #E0D5C5;
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .wordmark {
      color: #1C1C1E;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 8px;
      text-transform: uppercase;
      margin-bottom: 40px;
      display: block;
    }
    .label {
      color: #C9A84C;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    h1 {
      color: #1C1C1E;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.3px;
      margin-bottom: 16px;
      line-height: 1.15;
    }
    .body {
      color: #9A8E82;
      font-size: 15px;
      line-height: 24px;
      margin-bottom: 32px;
    }
    .body strong { color: #1C1C1E; font-weight: 600; }
    .btn {
      display: inline-block;
      background: #1C1C1E;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      border: none;
      cursor: pointer;
      border-radius: 100px;
      padding: 15px 36px;
      letter-spacing: 0.3px;
      font-family: inherit;
      transition: opacity 0.15s;
    }
    .btn:hover { opacity: 0.85; }
    form { margin-bottom: 16px; }
    .note {
      color: #9A8E82;
      font-size: 12px;
      line-height: 18px;
      margin-top: 16px;
    }
    .footer {
      margin-top: 32px;
      color: #9A8E82;
      font-size: 11px;
      text-align: center;
    }
    .footer a { color: #9A8E82; }
  </style>
</head>
<body>
  <div class="card">
    <span class="wordmark">HQ</span>
    ${content}
  </div>
  <p class="footer">
    &copy; 2026 HomeQuarters &nbsp;&middot;&nbsp;
    <a href="${BASE_URL}/privacy">Privacy Policy</a>
  </p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ── Core unsubscribe logic ────────────────────────────────────────────────────

async function processUnsubscribe(email: string): Promise<void> {
  const sanitized = email.trim().toLowerCase();
  // Mark unsubscribed in newsletter_subscribers (where it exists)
  await adminDb
    .collection("newsletter_subscribers")
    .doc(sanitized)
    .set({ unsubscribed: true, unsubscribed_at: new Date().toISOString() }, { merge: true });
  // Also flag on the member profile if one exists (keyed by email field)
  const profilesSnap = await adminDb
    .collection("profiles")
    .where("email", "==", sanitized)
    .limit(1)
    .get();
  if (!profilesSnap.empty) {
    await profilesSnap.docs[0].ref.set(
      { marketing_unsubscribed: true, marketing_unsubscribed_at: new Date().toISOString() },
      { merge: true }
    );
  }
}

// ── GET — render confirmation page ───────────────────────────────────────────

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return renderPage({ email: "your address", state: "confirm" });
  }
  return renderPage({ email, state: "confirm" });
}

// ── POST — one-click unsubscribe (RFC 8058) ───────────────────────────────────
// Called by email clients (Gmail, Apple Mail) that support List-Unsubscribe-Post.
// Body may be form-encoded or JSON depending on the client.

export async function POST(req: NextRequest) {
  let email = "";

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    // RFC 8058 one-click: body is "List-Unsubscribe=One-Click"
    // We also accept form submissions from our own confirmation page.
    email = params.get("email") ?? req.nextUrl.searchParams.get("email") ?? "";
    // If this is a raw RFC 8058 request without an email param, read from URL
    if (!email) email = req.nextUrl.searchParams.get("email") ?? "";
  } else {
    const body = await req.json().catch(() => ({})) as { email?: string };
    email = body.email ?? req.nextUrl.searchParams.get("email") ?? "";
  }

  email = email.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    // For RFC 8058 one-click, still return 200 so email clients don't retry
    return NextResponse.json({ ok: false, error: "No email provided" }, { status: 200 });
  }

  try {
    await processUnsubscribe(email);
  } catch (err) {
    console.error("Unsubscribe error:", err);
    // Detect whether this is a browser form POST or API call
    const accept = req.headers.get("accept") ?? "";
    if (accept.includes("text/html")) {
      return renderPage({ email, state: "error" });
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Browser form submission — render confirmation page
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return renderPage({ email, state: "done" });
  }

  // API / one-click client — return 200 with no body (RFC 8058 requirement)
  return new Response(null, { status: 200 });
}
