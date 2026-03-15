"use client";

import { useState } from "react";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  member_code: string;
  membership_tier: string;
  title: string | null;
  bio: string | null;
  city: string | null;
  industry: string | null;
  instagram_handle: string | null;
  linkedin_handle: string | null;
  hide_city?: boolean;
  hide_industry?: boolean;
  hide_social_links?: boolean;
}

const TIER_LABELS: Record<string, string> = {
  founding: "Founding Member",
  founding_member: "Founding Member",
  committee: "Committee Member",
  committee_member: "Committee Member",
  platinum: "Platinum Card",
  platinum_card: "Platinum Card",
  gold: "Gold Card",
  gold_card: "Gold Card",
};

export default function BusinessCard({ profile }: { profile: Profile }) {
  const [showQr, setShowQr] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    about: "",
  });
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const tierLabel =
    TIER_LABELS[profile.membership_tier?.toLowerCase()] ??
    profile.membership_tier ??
    "";
  const showCity = !profile.hide_city && profile.city;
  const showIndustry = !profile.hide_industry && profile.industry;
  const showSocial = !profile.hide_social_links;

  // QR encodes the member's card URL
  const profileUrl = `https://${profile.member_code.toLowerCase()}.thehomequarters.com`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=1C1C1E&bgcolor=F5F2EC&qzone=1&data=${encodeURIComponent(profileUrl)}`;

  function handleCardClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("[data-no-flip]")) return;
    setShowQr(true);
  }

  function openModal() {
    setModalOpen(true);
    setSubmitStatus("idle");
    setErrorMsg("");
  }

  function closeModal() {
    setModalOpen(false);
    setSubmitStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/webApplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vouched_by_member_code: profile.member_code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setSubmitStatus("success");
    } catch (err: unknown) {
      setSubmitStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        .hq-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #111012;
          padding: 24px;
        }

        /* ── Wrapper ── */
        .hq-wrapper {
          width: min(680px, calc(100vw - 40px));
          aspect-ratio: 85 / 55;
          animation: hq-float 3s ease-in-out infinite;
        }
        @keyframes hq-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(7px); }
        }

        /* ── Card — dark luxury ── */
        .hq-card {
          width: 100%;
          height: 100%;
          position: relative;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          border-radius: 3px;
          overflow: hidden;
          background-color: #1A1A1C;
          background-image: repeating-linear-gradient(
            135deg,
            rgba(0,0,0,0.22) 0,
            transparent 1px,
            rgba(0,0,0,0.22) 2px
          );
          background-size: 3px 3px;
          box-shadow:
            0 12px 40px rgba(0,0,0,0.72),
            0 2px 8px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(201,168,76,0.06);
        }
        .hq-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, rgba(201,168,76,0.04) 0%, transparent 55%);
          pointer-events: none;
        }

        /* ── HQ monogram watermark — gold tint ── */
        .hq-monogram {
          position: absolute;
          right: -2%;
          bottom: -8%;
          font-family: var(--font-display), 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(100px, 22cqw, 180px);
          font-weight: 700;
          color: rgba(201,168,76,0.07);
          line-height: 1;
          letter-spacing: -4px;
          pointer-events: none;
          user-select: none;
          z-index: 0;
        }

        /* ── Inner layout ── */
        .hq-inner {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
          padding: 6.5%;
        }

        /* Gold corner brackets */
        .hq-corner {
          position: absolute;
          width: 10px;
          height: 10px;
          border-color: #C9A84C;
          border-style: solid;
          z-index: 2;
          opacity: 0.65;
        }
        .hq-c-tl { top: 13px; left: 13px; border-width: 1.5px 0 0 1.5px; }
        .hq-c-tr { top: 13px; right: 13px; border-width: 1.5px 1.5px 0 0; }
        .hq-c-bl { bottom: 13px; left: 13px; border-width: 0 0 1.5px 1.5px; }
        .hq-c-br { bottom: 13px; right: 13px; border-width: 0 1.5px 1.5px 0; }

        /* Top */
        .hq-top { flex: 0 0 auto; }
        /* Wordmark above name */
        .hq-wordmark {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 7.5px;
          font-weight: 700;
          letter-spacing: 4px;
          color: rgba(201,168,76,0.45);
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .hq-member-name {
          font-family: var(--font-display), 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 600;
          color: #FAF8F5;
          letter-spacing: -0.2px;
          line-height: 1.1;
        }
        .hq-tier {
          display: inline-block;
          margin-top: 4px;
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 2.5px;
          color: #C9A84C;
          text-transform: uppercase;
        }
        .hq-member-title {
          font-family: var(--font-display), 'Cormorant Garamond', Georgia, serif;
          font-size: 12px;
          font-style: italic;
          color: rgba(250,248,245,0.42);
          margin-top: 2px;
        }

        /* Mid */
        .hq-mid {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 5px;
          padding: 6px 0;
        }
        .hq-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .hq-pill {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 8.5px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: rgba(201,168,76,0.75);
          background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.14);
          border-radius: 2px;
          padding: 2px 6px;
          text-transform: uppercase;
        }
        .hq-social {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .hq-social a {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 9px;
          color: rgba(250,248,245,0.3);
          text-decoration: none;
          letter-spacing: 0.2px;
        }
        .hq-social a:hover { color: rgba(250,248,245,0.7); }

        /* Bottom */
        .hq-bottom {
          flex: 0 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .hq-footer-links {
          display: flex;
          gap: 7px;
          align-items: center;
        }
        .hq-footer-links a {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 8px;
          letter-spacing: 0.8px;
          color: rgba(250,248,245,0.15);
          text-decoration: none;
        }
        .hq-footer-links a:hover { color: rgba(250,248,245,0.45); }
        .hq-footer-dot {
          font-size: 7px;
          color: rgba(250,248,245,0.1);
          user-select: none;
        }
        .hq-apply-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 2.5px;
          color: #C9A84C;
          text-transform: uppercase;
          opacity: 0.6;
          transition: opacity 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .hq-apply-btn:hover { opacity: 1; }

        /* ── QR overlay ── */
        .hq-qr-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 7, 9, 0.88);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 300;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 20px;
        }
        .hq-qr-card {
          background: #F5F2EC;
          border-radius: 16px;
          padding: 28px 28px 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          max-width: 300px;
          width: 100%;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
        }
        .hq-qr-eyebrow {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #C9A84C;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .hq-qr-img {
          width: 180px;
          height: 180px;
          border-radius: 8px;
          display: block;
        }
        .hq-qr-name {
          font-family: var(--font-display), 'Cormorant Garamond', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: #1C1C1E;
          margin-top: 16px;
          text-align: center;
          line-height: 1.2;
        }
        .hq-qr-code {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 9px;
          letter-spacing: 2.5px;
          color: rgba(28,28,30,0.4);
          margin-top: 4px;
          text-align: center;
        }
        .hq-qr-hint {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 10px;
          color: rgba(28,28,30,0.3);
          margin-top: 18px;
          text-align: center;
        }

        /* ── Apply Modal ── */
        .hq-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 7, 9, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 200;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .hq-modal {
          background: #1C1C1E;
          border-radius: 14px;
          padding: 30px 28px 26px;
          width: 100%;
          max-width: 360px;
          position: relative;
          box-shadow: 0 28px 72px rgba(0,0,0,0.75);
          border: 1px solid rgba(201,168,76,0.08);
        }
        .hq-modal-close {
          position: absolute;
          top: 15px; right: 18px;
          background: none;
          border: none;
          color: rgba(250,248,245,0.25);
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          padding: 2px 4px;
          transition: color 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .hq-modal-close:hover { color: rgba(250,248,245,0.65); }

        .hq-modal-label {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #C9A84C;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .hq-modal-title {
          font-family: var(--font-display), 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 600;
          color: #FAF8F5;
          line-height: 1.2;
          letter-spacing: -0.2px;
          margin-bottom: 18px;
        }
        .hq-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 14px 0;
        }
        .hq-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(201,168,76,0.18);
        }
        .hq-divider-dot {
          color: #C9A84C;
          font-size: 9px;
          opacity: 0.5;
        }

        .hq-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }
        .hq-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 8px;
        }
        .hq-field-label {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 8.5px;
          font-weight: 600;
          letter-spacing: 1.8px;
          color: rgba(250,248,245,0.35);
          text-transform: uppercase;
        }
        .hq-input {
          background: rgba(250,248,245,0.04);
          border: 1px solid rgba(250,248,245,0.09);
          border-radius: 7px;
          padding: 10px 12px;
          color: #FAF8F5;
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .hq-input:focus { border-color: rgba(201,168,76,0.45); }
        .hq-input::placeholder { color: rgba(250,248,245,0.18); }
        textarea.hq-input { resize: none; min-height: 68px; }

        .hq-submit-btn {
          width: 100%;
          padding: 13px;
          background: #C9A84C;
          color: #1C1C1E;
          border: none;
          border-radius: 7px;
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-top: 4px;
        }
        .hq-submit-btn:hover { opacity: 0.88; }
        .hq-submit-btn:disabled { opacity: 0.42; cursor: not-allowed; }

        .hq-error {
          font-size: 12px;
          color: #E07878;
          margin-top: 10px;
          text-align: center;
          font-family: var(--font-body), system-ui, sans-serif;
        }

        .hq-success {
          text-align: center;
          padding: 8px 0 4px;
        }
        .hq-success-symbol {
          color: #C9A84C;
          font-size: 22px;
          margin-bottom: 14px;
        }
        .hq-success-label {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #C9A84C;
          text-transform: uppercase;
          margin-bottom: 7px;
        }
        .hq-success-title {
          font-family: var(--font-display), 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 600;
          color: #FAF8F5;
          line-height: 1.15;
          margin-bottom: 10px;
        }
        .hq-success-body {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 13px;
          color: rgba(250,248,245,0.45);
          line-height: 1.6;
          margin-bottom: 22px;
        }
      `}</style>

      {/* ── Page ── */}
      <div className="hq-page">
        <div className="hq-wrapper">
          <div className="hq-card" onClick={handleCardClick}>
            {/* Corner brackets */}
            <div className="hq-corner hq-c-tl" />
            <div className="hq-corner hq-c-tr" />
            <div className="hq-corner hq-c-bl" />
            <div className="hq-corner hq-c-br" />

            {/* Subtle HQ monogram watermark */}
            <div className="hq-monogram" aria-hidden="true">HQ</div>

            {/* Card content */}
            <div className="hq-inner">
              {/* Top — wordmark + name + tier + title */}
              <div className="hq-top">
                <div className="hq-wordmark">The Homequarters</div>
                <div className="hq-member-name">
                  {profile.first_name} {profile.last_name}
                </div>
                {tierLabel && <div className="hq-tier">{tierLabel}</div>}
                {profile.title && (
                  <div className="hq-member-title">{profile.title}</div>
                )}
              </div>

              {/* Mid — city/industry + social */}
              <div className="hq-mid">
                {(showCity || showIndustry) && (
                  <div className="hq-pills">
                    {showCity && (
                      <span className="hq-pill">{profile.city}</span>
                    )}
                    {showIndustry && (
                      <span className="hq-pill">{profile.industry}</span>
                    )}
                  </div>
                )}
                {showSocial &&
                  (profile.instagram_handle || profile.linkedin_handle) && (
                    <div className="hq-social">
                      {profile.instagram_handle && (
                        <a
                          href={`https://instagram.com/${profile.instagram_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          @{profile.instagram_handle}
                        </a>
                      )}
                      {profile.linkedin_handle && (
                        <a
                          href={`https://linkedin.com/in/${profile.linkedin_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          in/{profile.linkedin_handle}
                        </a>
                      )}
                    </div>
                  )}
              </div>

              {/* Bottom — footer links + apply */}
              <div className="hq-bottom">
                <div className="hq-footer-links">
                  <a href="https://thehomequarters.com">thehomequarters.com</a>
                  <span className="hq-footer-dot">·</span>
                  <a href="https://thehomequarters.com/terms">Terms</a>
                </div>
                <button
                  data-no-flip
                  className="hq-apply-btn"
                  onClick={openModal}
                >
                  Apply for membership →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QR Code overlay ── */}
      {showQr && (
        <div
          className="hq-qr-overlay"
          onClick={() => setShowQr(false)}
        >
          <div className="hq-qr-card" onClick={(e) => e.stopPropagation()}>
            <div className="hq-qr-eyebrow">✦ Member Card</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="Member QR code"
              className="hq-qr-img"
            />
            <div className="hq-qr-name">
              {profile.first_name} {profile.last_name}
            </div>
            <div className="hq-qr-code">{profile.member_code}</div>
            <div className="hq-qr-hint">tap outside to close</div>
          </div>
        </div>
      )}

      {/* ── Apply Modal ── */}
      {modalOpen && (
        <div
          className="hq-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="hq-modal">
            <button className="hq-modal-close" onClick={closeModal}>
              ×
            </button>

            {submitStatus === "success" ? (
              <div className="hq-success">
                <div className="hq-success-symbol">✦</div>
                <div className="hq-success-label">Application Received</div>
                <div className="hq-success-title">
                  You&rsquo;re on file.
                </div>
                <div className="hq-success-body">
                  {profile.first_name} has been notified and will be in touch
                  to confirm their vouch.
                </div>
                <button className="hq-submit-btn" onClick={closeModal}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="hq-modal-label">Application</div>
                <div className="hq-modal-title">
                  Join via {profile.first_name}&rsquo;s
                  <br />
                  membership.
                </div>

                <div className="hq-divider">
                  <div className="hq-divider-line" />
                  <span className="hq-divider-dot">✦</span>
                  <div className="hq-divider-line" />
                </div>

                <div className="hq-field-row">
                  <div className="hq-field">
                    <label className="hq-field-label">First name</label>
                    <input
                      className="hq-input"
                      type="text"
                      required
                      placeholder="Jane"
                      value={form.first_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, first_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="hq-field">
                    <label className="hq-field-label">Last name</label>
                    <input
                      className="hq-input"
                      type="text"
                      required
                      placeholder="Smith"
                      value={form.last_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, last_name: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="hq-field">
                  <label className="hq-field-label">Email</label>
                  <input
                    className="hq-input"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>

                <div className="hq-field">
                  <label className="hq-field-label">About you</label>
                  <textarea
                    className="hq-input"
                    placeholder="Tell us a little about yourself…"
                    value={form.about}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, about: e.target.value }))
                    }
                  />
                </div>

                <div className="hq-divider">
                  <div className="hq-divider-line" />
                  <span className="hq-divider-dot">✦</span>
                  <div className="hq-divider-line" />
                </div>

                <button
                  className="hq-submit-btn"
                  type="submit"
                  disabled={submitStatus === "submitting"}
                >
                  {submitStatus === "submitting"
                    ? "Submitting…"
                    : "Submit Application"}
                </button>

                {submitStatus === "error" && (
                  <div className="hq-error">{errorMsg}</div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
