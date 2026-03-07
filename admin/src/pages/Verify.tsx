import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface TokenData {
  member_id: string;
  member_code: string;
  member_name: string;
  venue_id: string;
  venue_name: string;
  deal_id: string;
  deal_title: string;
  ts: string;
}

type Status = "loading" | "invalid" | "pin_entry" | "verifying" | "success" | "error";

const KEYPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

export default function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t") ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("No QR data found. Please scan a valid member QR code.");
      setStatus("invalid");
      return;
    }
    try {
      const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(base64);
      const data = JSON.parse(json) as TokenData;
      const ageMs = Date.now() - new Date(data.ts).getTime();
      if (ageMs > 10 * 60 * 1000) {
        setErrorMsg("This QR code has expired. Ask the member to regenerate.");
        setStatus("invalid");
        return;
      }
      setTokenData(data);
      setStatus("pin_entry");
    } catch {
      setErrorMsg("Invalid QR code. Please scan a valid member QR code.");
      setStatus("invalid");
    }
  }, [token]);

  const handleKey = (key: string) => {
    if (status === "verifying") return;
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "") return;
    if (pin.length >= 4) return;
    const newPin = pin + key;
    setPin(newPin);
    if (newPin.length === 4) submitPin(newPin);
  };

  const submitPin = async (enteredPin: string) => {
    setStatus("verifying");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin: enteredPin }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus("success");
      } else {
        setErrorMsg(json.error ?? "Verification failed.");
        setPin("");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setPin("");
      setStatus("error");
    }
  };

  const retry = () => {
    setErrorMsg("");
    setPin("");
    setStatus("pin_entry");
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <Screen>
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </Screen>
    );
  }

  // ── Invalid token ────────────────────────────────────────────────────────
  if (status === "invalid") {
    return (
      <Screen>
        <div className="text-center px-8">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-white font-semibold text-lg mb-2">Invalid QR Code</p>
          <p className="text-gray-400 text-sm leading-relaxed">{errorMsg}</p>
        </div>
      </Screen>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (status === "success" && tokenData) {
    return (
      <Screen>
        <div className="text-center px-8">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-400 font-bold text-2xl mb-2">Verified!</p>
          <p className="text-white text-lg font-semibold mb-1">{tokenData.member_name}</p>
          <p className="text-gray-400 text-sm mb-4 tracking-widest">{tokenData.member_code}</p>
          <div className="bg-dark border border-dark-border rounded-2xl px-6 py-4 text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Redeemed</p>
            <p className="text-gold font-semibold">{tokenData.deal_title}</p>
            <p className="text-gray-500 text-sm mt-1">at {tokenData.venue_name}</p>
          </div>
        </div>
      </Screen>
    );
  }

  // ── PIN entry + error ────────────────────────────────────────────────────
  if ((status === "pin_entry" || status === "verifying" || status === "error") && tokenData) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="px-6 pt-12 pb-4 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gold-light border border-gold/25 flex items-center justify-center">
              <span className="text-gold font-extrabold text-xs">HQ</span>
            </div>
            <span className="text-white font-bold">HomeQuarters</span>
          </div>
        </div>

        {/* Member card */}
        <div className="mx-5 mb-6">
          <div className="bg-dark border border-dark-border rounded-2xl px-5 py-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-bold text-lg leading-tight">{tokenData.member_name}</p>
                <p className="text-gray-500 text-xs tracking-widest mt-0.5">{tokenData.member_code}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-gold/10 text-gold border border-gold/20">
                Member
              </span>
            </div>
            <div className="border-t border-dark-border pt-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Redeeming</p>
              <p className="text-white font-semibold text-sm">{tokenData.deal_title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{tokenData.venue_name}</p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {status === "error" && errorMsg && (
          <div className="mx-5 mb-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-center">
              <p className="text-red-400 text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* PIN dots */}
        <div className="flex flex-col items-center mb-6 px-6">
          <p className="text-gray-400 text-sm mb-5">Enter venue PIN</p>
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  i < pin.length
                    ? "bg-gold scale-110"
                    : "bg-dark border border-dark-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Keypad */}
        <div className={`flex-1 px-8 pb-10 ${status === "verifying" ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="grid grid-rows-4 gap-3 max-w-xs mx-auto">
            {KEYPAD.map((row, ri) => (
              <div key={ri} className="grid grid-cols-3 gap-3">
                {row.map((key, ki) => (
                  <button
                    key={ki}
                    onClick={() => handleKey(key)}
                    disabled={key === ""}
                    className={`
                      h-16 rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-95
                      ${key === ""
                        ? "opacity-0 cursor-default"
                        : key === "⌫"
                          ? "bg-dark border border-dark-border text-gray-400 hover:text-white hover:bg-white/5"
                          : "bg-dark border border-dark-border text-white hover:bg-white/8 hover:border-gold/30"
                      }
                    `}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {status === "verifying" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return null;
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-light border border-gold/25 flex items-center justify-center">
            <span className="text-gold font-extrabold text-xs">HQ</span>
          </div>
          <span className="text-white font-bold">HomeQuarters</span>
        </div>
      </div>
      {children}
    </div>
  );
}
