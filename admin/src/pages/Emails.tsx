import React, { useState } from "react";
import * as T from "../emailTemplates";

// ─────────────────────────────────────────────
// Sample data used for previews
// ─────────────────────────────────────────────
const SAMPLE = {
  firstName: "Amara",
  applicationCode: "HQ-2847",
  memberCode: "HQ-2847",
  voucherName: "James Okafor",
  voucherCount: 1,
  requiredVouches: 2,
  friendFirstName: "Yemi",
  friendLastName: "Adeyemi",
  inviteeName: "Chidi Okeke",
  email: "amara.osei@gmail.com",
  resetLink: "https://thehomequarters.com/reset?token=preview-example-token",
};

// ─────────────────────────────────────────────
// Email catalogue
// ─────────────────────────────────────────────
interface EmailEntry {
  id: string;
  label: string;
  trigger: string;
  category: "application" | "membership" | "social" | "welcome" | "account";
  html: () => string;
  text: () => string;
}

const EMAILS: EmailEntry[] = [
  {
    id: "application-received-invited",
    label: "Application Received",
    trigger: "Member applies via invite code",
    category: "application",
    html: () => T.applicationReceivedHtml({ ...SAMPLE, applicationType: "invited" }),
    text: () => T.applicationReceivedText(SAMPLE),
  },
  {
    id: "application-received-open",
    label: "Application Received (Open)",
    trigger: "Member applies via website form",
    category: "application",
    html: () => T.applicationReceivedHtml({ ...SAMPLE, applicationType: "open" }),
    text: () => T.applicationReceivedText(SAMPLE),
  },
  {
    id: "web-application-received",
    label: "Web Application Received",
    trigger: "Website open application submitted",
    category: "application",
    html: () => T.webApplicationReceivedHtml(SAMPLE),
    text: () => T.webApplicationReceivedText(SAMPLE),
  },
  {
    id: "vouch-received",
    label: "Vouch Received",
    trigger: "Someone vouches for an applicant",
    category: "application",
    html: () => T.vouchReceivedHtml(SAMPLE),
    text: () => T.vouchReceivedText(SAMPLE),
  },
  {
    id: "application-complete",
    label: "Application Complete",
    trigger: "Applicant reaches required vouch count",
    category: "application",
    html: () => T.applicationCompleteHtml(SAMPLE),
    text: () => T.applicationCompleteText(SAMPLE),
  },
  {
    id: "membership-approved",
    label: "Membership Approved",
    trigger: "Admin approves an application",
    category: "membership",
    html: () => T.membershipApprovedHtml(SAMPLE),
    text: () => T.membershipApprovedText(SAMPLE),
  },
  {
    id: "application-rejected",
    label: "Application Rejected",
    trigger: "Admin rejects an application",
    category: "membership",
    html: () => T.applicationRejectedHtml(SAMPLE),
    text: () => T.applicationRejectedText(SAMPLE),
  },
  {
    id: "membership-suspended",
    label: "Membership Suspended",
    trigger: "Admin suspends a member",
    category: "membership",
    html: () => T.membershipSuspendedHtml(SAMPLE),
    text: () => T.membershipSuspendedText(SAMPLE),
  },
  {
    id: "friend-accepted",
    label: "Your Friend Joined HQ",
    trigger: "A vouched-for person is approved (sent to voucher)",
    category: "social",
    html: () => T.friendAcceptedHtml(SAMPLE),
    text: () => T.friendAcceptedText(SAMPLE),
  },
  {
    id: "invitee-applied",
    label: "Your Invitee Applied",
    trigger: "Someone you invited submits application (sent to inviter)",
    category: "social",
    html: () => T.inviteeAppliedHtml(SAMPLE),
    text: () => T.inviteeAppliedText(SAMPLE),
  },
  {
    id: "welcome-day-1",
    label: "Welcome — Day 1",
    trigger: "Sent on approval · personal note from Valentine",
    category: "welcome",
    html: () => `<pre style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#1C1C1E;white-space:pre-wrap;padding:40px;max-width:560px;margin:0 auto;background:#F2EBE0;">${T.founderWelcomeText(SAMPLE)}</pre>`,
    text: () => T.founderWelcomeText(SAMPLE),
  },
  {
    id: "welcome-day-4",
    label: "Welcome — Day 4",
    trigger: "Scheduled 4 days after approval · features tour",
    category: "welcome",
    html: () => T.welcomeFeaturesTourHtml(SAMPLE),
    text: () => T.welcomeFeaturesTourText(SAMPLE),
  },
  {
    id: "welcome-day-10",
    label: "Welcome — Day 10",
    trigger: "Scheduled 10 days after approval · community nudge",
    category: "welcome",
    html: () => T.welcomeDiscoverNudgeHtml(SAMPLE),
    text: () => T.welcomeDiscoverNudgeText(SAMPLE),
  },
  {
    id: "membership-accepted",
    label: "You're In — 30-Day Trial",
    trigger: "Admin moves applicant to 'accepted' · immediate email",
    category: "membership",
    html: () => T.membershipAcceptedHtml(SAMPLE),
    text: () => T.membershipAcceptedText(SAMPLE),
  },
  {
    id: "grace-reminder-day-10",
    label: "Grace Reminder — Day 10",
    trigger: "Scheduled 10 days after acceptance · 20 days remaining",
    category: "membership",
    html: () => T.graceReminderHtml({ firstName: SAMPLE.firstName, daysRemaining: 20, reminderNumber: 1 }),
    text: () => T.graceReminderText({ firstName: SAMPLE.firstName, daysRemaining: 20, reminderNumber: 1 }),
  },
  {
    id: "grace-reminder-day-20",
    label: "Grace Reminder — Day 20",
    trigger: "Scheduled 20 days after acceptance · 10 days remaining",
    category: "membership",
    html: () => T.graceReminderHtml({ firstName: SAMPLE.firstName, daysRemaining: 10, reminderNumber: 2 }),
    text: () => T.graceReminderText({ firstName: SAMPLE.firstName, daysRemaining: 10, reminderNumber: 2 }),
  },
  {
    id: "grace-reminder-day-30",
    label: "Grace Reminder — Day 30",
    trigger: "Scheduled 30 days after acceptance · last day of free trial",
    category: "membership",
    html: () => T.graceReminderHtml({ firstName: SAMPLE.firstName, daysRemaining: 0, reminderNumber: 3 }),
    text: () => T.graceReminderText({ firstName: SAMPLE.firstName, daysRemaining: 0, reminderNumber: 3 }),
  },
  {
    id: "password-reset",
    label: "Password Reset",
    trigger: "Member requests a password reset",
    category: "account",
    html: () => T.passwordResetHtml(SAMPLE),
    text: () => T.passwordResetText(SAMPLE),
  },
];

const CATEGORY_LABELS: Record<EmailEntry["category"], string> = {
  application: "Application",
  membership: "Membership",
  social: "Social",
  welcome: "Welcome Journey",
  account: "Account",
};

const CATEGORY_COLOR: Record<EmailEntry["category"], string> = {
  application: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  membership: "text-gold bg-gold/10 border-gold/20",
  social: "text-green-400 bg-green-400/10 border-green-400/20",
  welcome: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  account: "text-gray-400 bg-white/5 border-white/10",
};

export default function Emails() {
  const [selected, setSelected] = useState<EmailEntry>(EMAILS[0]);
  const [viewMode, setViewMode] = useState<"html" | "text">("html");
  const [filterCategory, setFilterCategory] = useState<EmailEntry["category"] | "all">("all");

  const filtered = filterCategory === "all"
    ? EMAILS
    : EMAILS.filter((e) => e.category === filterCategory);

  const htmlContent = selected.html();
  const textContent = selected.text();

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">

      {/* ── Left panel: list ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">

        <div>
          <h1 className="text-2xl font-bold text-white">Emails</h1>
          <p className="text-gray-500 text-sm mt-1">{EMAILS.length} templates</p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {(["all", "application", "membership", "social", "welcome", "account"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                filterCategory === cat
                  ? cat === "all"
                    ? "bg-white/10 border-white/20 text-white"
                    : CATEGORY_COLOR[cat as EmailEntry["category"]]
                  : "bg-white/5 border-white/5 text-gray-500 hover:text-gray-300"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat as EmailEntry["category"]]}
            </button>
          ))}
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filtered.map((email) => (
            <button
              key={email.id}
              onClick={() => setSelected(email)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                selected.id === email.id
                  ? "bg-gold/10 border-gold/25 text-white"
                  : "bg-dark border-dark-border text-gray-400 hover:text-white hover:border-white/10"
              }`}
            >
              <p className={`text-sm font-semibold leading-tight mb-1 ${selected.id === email.id ? "text-white" : ""}`}>
                {email.label}
              </p>
              <p className="text-xs text-gray-600 leading-snug line-clamp-2">{email.trigger}</p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_COLOR[email.category]}`}>
                {CATEGORY_LABELS[email.category]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right panel: preview ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Preview toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{selected.label}</h2>
            <p className="text-gray-500 text-xs mt-0.5">{selected.trigger}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-dark border border-dark-border rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode("html")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === "html"
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setViewMode("text")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === "text"
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Plain text
              </button>
            </div>
          </div>
        </div>

        {/* Sample data pill */}
        <div className="flex items-center gap-2 px-3 py-2 bg-dark border border-dark-border rounded-xl">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Preview data</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400">
            {SAMPLE.firstName} · {SAMPLE.applicationCode} · {SAMPLE.email}
          </span>
        </div>

        {/* Preview frame */}
        <div className="flex-1 bg-dark border border-dark-border rounded-2xl overflow-hidden">
          {viewMode === "html" ? (
            <iframe
              key={selected.id + "-html"}
              srcDoc={htmlContent}
              title={`Preview: ${selected.label}`}
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="w-full h-full overflow-auto p-8">
              <pre className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                {textContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
