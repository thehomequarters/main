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
  const [flipped, setFlipped] = useState(false);
  const [tapped, setTapped] = useState(false);
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

  function handleCardClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("[data-no-flip]")) return;
    setTapped(true);
    setFlipped((f) => !f);
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
      {/* ── Styles ────────────────────────────────────────────────────── */}
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
          perspective: 900px;
        }
        .hq-wrapper:not(.tapped) {
          animation: hq-float 3s ease-in-out infinite;
        }
        @keyframes hq-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(7px); }
        }

        /* ── Card ── */
        .hq-card {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.65s cubic-bezier(.49, .23, .58, .49);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .hq-card.flipped { transform: rotateY(180deg); }

        /* ── Face shared ── */
        .hq-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 3px;
          overflow: hidden;
          box-shadow:
            0 12px 40px rgba(0,0,0,0.65),
            0 2px 8px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(201,168,76,0.06);
        }

        /* ── Front ── */
        .hq-front {
          background-color: #1A1A1C;
          background-image: repeating-linear-gradient(
            135deg,
            rgba(0,0,0,0.22) 0,
            transparent 1px,
            rgba(0,0,0,0.22) 2px
          );
          background-size: 3px 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 7%;
          position: relative;
        }

        /* Corners */
        .hq-corner {
          position: absolute;
          width: 10px;
          height: 10px;
          border-color: #C9A84C;
          border-style: solid;
        }
        .hq-c-tl { top: 13px; left: 13px; border-width: 1.5px 0 0 1.5px; }
        .hq-c-tr { top: 13px; right: 13px; border-width: 1.5px 1.5px 0 0; }
        .hq-c-bl { bottom: 13px; left: 13px; border-width: 0 0 1.5px 1.5px; }
        .hq-c-br { bottom: 13px; right: 13px; border-width: 0 1.5px 1.5px 0; }

        /* Wordmark */
        .hq-wordmark {
          font-family: var(--font-display), 'Cormorant Garamond', Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 8px;
          color: #C9A84C;
          text-transform: uppercase;
          text-align: center;
          user-select: none;
          line-height: 1;
        }

        /* Front footer links */
        .hq-front-footer {
          position: absolute;
          bottom: 12px;
          left: 0; right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
        }
        .hq-front-footer a {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 8px;
          letter-spacing: 0.8px;
          color: #363230;
          text-decoration: none;
          text-transform: lowercase;
        }
        .hq-front-footer a:hover { color: #5C5248; }
        .hq-front-footer-dot {
          font-size: 7px;
          color: #363230;
          user-select: none;
        }

        /* ── Back ── */
        .hq-back {
          background-color: #C9A84C;
          background-image: repeating-linear-gradient(
            135deg,
            rgba(0,0,0,0.1) 0,
            transparent 1px,
            rgba(0,0,0,0.1) 2px
          );
          background-size: 3px 3px;
          transform: rotateY(180deg);
          position: absolute;
        }
        .hq-back::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, rgba(0,0,0,0.09) 0%, transparent 55%);
          pointer-events: none;
        }

        .hq-back-inner {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
          padding: 6.5%;
        }

        /* Back top */
        .hq-back-top { flex: 0 0 auto; }
        .hq-member-name {
          font-family: var(--font-display), 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #1C1C1E;
          letter-spacing: -0.2px;
          line-height: 1.1;
        }
        .hq-tier {
          display: inline-block;
          margin-top: 3px;
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 2.5px;
          color: rgba(28,28,30,0.45);
          text-transform: uppercase;
        }
        .hq-member-title {
          font-family: var(--font-display), 'Cormorant Garamond', Georgia, serif;
          font-size: 12px;
          font-style: italic;
          color: rgba(28,28,30,0.6);
          margin-top: 1px;
        }

        /* Back mid */
        .hq-back-mid {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          overflow: hidden;
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
          color: #1C1C1E;
          background: rgba(28,28,30,0.11);
          border-radius: 2px;
          padding: 2px 6px;
          text-transform: uppercase;
        }
        .hq-bio {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 10px;
          line-height: 1.6;
          color: rgba(28,28,30,0.65);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hq-social {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .hq-social a {
          font-family: var(--font-body), system-ui, sans-serif;
          font-size: 9px;
          color: rgba(28,28,30,0.5);
          text-decoration: none;
          letter-spacing: 0.2px;
        }
        .hq-social a:hover { color: rgba(28,28,30,0.85); text-decoration: underline; }

        /* Back bottom */
        .hq-back-bottom {
          flex: 0 0 auto;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
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
          color: #1C1C1E;
          text-transform: uppercase;
          opacity: 0.6;
          transition: opacity 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .hq-apply-btn:hover { opacity: 1; }

        /* ── Modal ── */
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

        /* Success */
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

      {/* ── Page ───────────────────────────────────────────────────────── */}
      <div className="hq-page">
        <div className={`hq-wrapper${tapped ? " tapped" : ""}`}>
          <div
            className={`hq-card${flipped ? " flipped" : ""}`}
            onClick={handleCardClick}
          >
            {/* ── Front ─────────────────────────────────────────────── */}
            <div className="hq-face hq-front">
              <div className="hq-corner hq-c-tl" />
              <div className="hq-corner hq-c-tr" />
              <div className="hq-corner hq-c-bl" />
              <div className="hq-corner hq-c-br" />
              <span className="hq-wordmark">The Homequarters</span>
              <div className="hq-front-footer">
                <a href="https://thehomequarters.com">thehomequarters.com</a>
                <span className="hq-front-footer-dot">·</span>
                <a href="https://thehomequarters.com/terms">Terms</a>
              </div>
            </div>

            {/* ── Back ──────────────────────────────────────────────── */}
            <div className="hq-face hq-back">
              <div className="hq-back-inner">
                <div className="hq-back-top">
                  <div className="hq-member-name">
                    {profile.first_name} {profile.last_name}
                  </div>
                  {tierLabel && <div className="hq-tier">{tierLabel}</div>}
                  {profile.title && (
                    <div className="hq-member-title">{profile.title}</div>
                  )}
                </div>

                <div className="hq-back-mid">
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
                  {profile.bio && (
                    <p className="hq-bio">{profile.bio}</p>
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

                <div className="hq-back-bottom">
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
      </div>

      {/* ── Apply Modal ───────────────────────────────────────────────── */}
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
