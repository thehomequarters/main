import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
// /verify — public page, no admin login required.
// Staff scan a member's QR code with their phone camera which
// opens this URL. They enter their 6-digit venue PIN to confirm
// the redemption server-side.
// ─────────────────────────────────────────────────────────────

interface QRPayload {
  type: string;
  member_id: string;
  member_code: string;
  member_name: string;
  member_tier: string;
  venue_id: string;
  venue_name: string;
  deal_id: string;
  deal_title: string;
  ts: string;
}

type Stage = "invalid" | "expired" | "pin_entry" | "submitting" | "success" | "error";

const TIER_LABELS: Record<string, string> = {
  gold_card: "Gold",
  platinum_card: "Platinum",
};

const FUNCTION_URL = import.meta.env.VITE_VERIFY_FUNCTION_URL as string | undefined;

export default function Verify() {
  const [searchParams] = useSearchParams();
  const [stage, setStage] = useState<Stage>("pin_entry");
  const [payload, setPayload] = useState<QRPayload | null>(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{
    member_name: string;
    member_tier: string;
    deal_title: string;
    venue_name: string;
  } | null>(null);

  useEffect(() => {
    const t = searchParams.get("t");
    if (!t) {
      setStage("invalid");
      return;
    }
    try {
      const decoded = JSON.parse(decodeURIComponent(t)) as QRPayload;
      if (
        decoded.type !== "hq_redeem" ||
        !decoded.member_id ||
        !decoded.venue_id ||
        !decoded.deal_id ||
        !decoded.ts
      ) {
        setStage("invalid");
        return;
      }
      const ageMs = Date.now() - new Date(decoded.ts).getTime();
      if (ageMs > 10 * 60 * 1000) {
        setStage("expired");
        return;
      }
      setPayload(decoded);
      setStage("pin_entry");
    } catch {
      setStage("invalid");
    }
  }, [searchParams]);

  const handleDigit = (d: string) => {
    if (pin.length < 6) setPin((p) => p + d);
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));

  const handleSubmit = async () => {
    if (pin.length !== 6 || !payload || stage === "submitting") return;

    if (!FUNCTION_URL) {
      setErrorMsg("Verify function URL is not configured. Add VITE_VERIFY_FUNCTION_URL to the admin .env file.");
      setStage("error");
      return;
    }

    setStage("submitting");
    try {
      const token = searchParams.get("t")!;
      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error ?? "Verification failed.");
      }
      setResult(data);
      setStage("success");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Verification failed.");
      setStage("error");
    }
  };

  // ── Shared chrome ──────────────────────────────────────────
  const Logo = () => (
    <div className="text-center mb-8">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-stone-500 mb-1">HomeQuarters</p>
      <p className="text-[10px] uppercase tracking-widest text-stone-600">Venue Verification</p>
    </div>
  );

  // ── Invalid / Expired ──────────────────────────────────────
  if (stage === "invalid") {
    return (
      <Screen>
        <Logo />
        <StatusIcon type="error" />
        <h1 className="text-white text-xl font-bold text-center mt-6 mb-2">Invalid QR Code</h1>
        <p className="text-stone-500 text-sm text-center">
          This QR code is not valid. Make sure the member shows you their deal QR from the HomeQuarters app.
        </p>
      </Screen>
    );
  }

  if (stage === "expired") {
    return (
      <Screen>
        <Logo />
        <StatusIcon type="expired" />
        <h1 className="text-white text-xl font-bold text-center mt-6 mb-2">QR Code Expired</h1>
        <p className="text-stone-500 text-sm text-center">
          This QR code is more than 10 minutes old. Ask the member to open the deal again and generate a fresh code.
        </p>
      </Screen>
    );
  }

  // ── Success ────────────────────────────────────────────────
  if (stage === "success" && result) {
    const tier = TIER_LABELS[result.member_tier] ?? result.member_tier;
    return (
      <Screen>
        <Logo />
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-6">Confirmed</p>

          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-3">
            <p className="text-white text-2xl font-bold">{result.member_name}</p>
            <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              result.member_tier === "platinum_card"
                ? "bg-zinc-700 text-zinc-200"
                : "bg-amber-500/20 text-amber-400"
            }`}>
              {tier} Member
            </span>
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Deal redeemed</p>
              <p className="text-white text-sm font-semibold">{result.deal_title}</p>
              <p className="text-zinc-600 text-xs mt-1">{result.venue_name}</p>
            </div>
          </div>

          <button
            onClick={() => { setStage("pin_entry"); setPin(""); setResult(null); }}
            className="mt-8 text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
          >
            Verify another member
          </button>
        </div>
      </Screen>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <Screen>
        <Logo />
        <StatusIcon type="error" />
        <h1 className="text-white text-xl font-bold text-center mt-6 mb-2">Verification Failed</h1>
        <p className="text-stone-500 text-sm text-center mb-8">{errorMsg}</p>
        <button
          onClick={() => { setStage("pin_entry"); setPin(""); setErrorMsg(""); }}
          className="w-full py-4 bg-zinc-800 border border-zinc-700 text-white font-semibold rounded-2xl hover:bg-zinc-700 transition-colors"
        >
          Try Again
        </button>
      </Screen>
    );
  }

  // ── PIN entry (main state) ─────────────────────────────────
  const tierLabel = payload ? (TIER_LABELS[payload.member_tier] ?? payload.member_tier) : "";

  return (
    <Screen>
      <Logo />

      {/* Member + deal card */}
      {payload && (
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white font-bold text-lg leading-tight">{payload.member_name}</p>
              <p className="text-zinc-500 text-xs font-mono mt-0.5">{payload.member_code}</p>
            </div>
            {tierLabel && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${
                payload.member_tier === "platinum_card"
                  ? "bg-zinc-700 text-zinc-300"
                  : "bg-amber-500/20 text-amber-400"
              }`}>
                {tierLabel}
              </span>
            )}
          </div>
          <div className="border-t border-zinc-800 pt-3">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Redeeming</p>
            <p className="text-white text-sm font-semibold">{payload.deal_title}</p>
            <p className="text-zinc-600 text-xs mt-0.5">{payload.venue_name}</p>
          </div>
        </div>
      )}

      {/* PIN display */}
      <p className="text-zinc-500 text-xs uppercase tracking-widest text-center mb-4">Enter venue PIN</p>
      <div className="flex gap-3 justify-center mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
              i < pin.length
                ? "border-amber-500/60 bg-amber-500/10"
                : "border-zinc-700 bg-zinc-900"
            }`}
          >
            {i < pin.length && (
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            )}
          </div>
        ))}
      </div>

      {/* Numeric keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto mb-6">
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="h-16 rounded-2xl bg-zinc-800 border border-zinc-700 text-white text-2xl font-semibold active:bg-zinc-700 hover:bg-zinc-700 transition-colors select-none"
          >
            {d}
          </button>
        ))}
        {/* Bottom row: empty, 0, backspace */}
        <div />
        <button
          onClick={() => handleDigit("0")}
          className="h-16 rounded-2xl bg-zinc-800 border border-zinc-700 text-white text-2xl font-semibold active:bg-zinc-700 hover:bg-zinc-700 transition-colors select-none"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="h-16 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center active:bg-zinc-700 hover:bg-zinc-700 transition-colors select-none"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
          </svg>
        </button>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleSubmit}
        disabled={pin.length !== 6 || stage === "submitting"}
        className="w-full max-w-xs mx-auto block py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ backgroundColor: pin.length === 6 ? "#C9A84C" : "#3f3f46", color: pin.length === 6 ? "#000" : "#71717a" }}
      >
        {stage === "submitting" ? "Verifying…" : "Confirm Redemption"}
      </button>
    </Screen>
  );
}

// ── Small helpers ──────────────────────────────────────────────

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex items-start justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}

function StatusIcon({ type }: { type: "error" | "expired" }) {
  const isExpired = type === "expired";
  return (
    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${
      isExpired ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30"
    }`}>
      {isExpired ? (
        <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
  );
}
