"use client";

import { useEffect, useMemo, useState } from "react";
import {
  generateTotpCode,
  getTotpRemainingSeconds,
  normalizeTotpSecret,
} from "@/lib/totp";

type TotpCodeProps = {
  secret: string;
};

export default function TotpCode({ secret }: TotpCodeProps) {
  const [currentSecond, setCurrentSecond] = useState(() =>
    Math.floor(Date.now() / 1000)
  );
  const [code, setCode] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [error, setError] = useState("");

  const normalizedSecret = useMemo(() => normalizeTotpSecret(secret), [secret]);
  const remainingSeconds = getTotpRemainingSeconds(30);
  const progressPercentage = (remainingSeconds / 30) * 100;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentSecond(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadTotpCode() {
      try {
        setError("");

        if (!normalizedSecret) {
          setCode("");
          return;
        }

        const generatedCode = await generateTotpCode({
          secret: normalizedSecret,
        });

        if (!isCancelled) {
          setCode(generatedCode);
        }
      } catch (error) {
        console.error("Failed to generate TOTP code:", error);

        if (!isCancelled) {
          setCode("");
          setError("Invalid TOTP secret.");
        }
      }
    }

    loadTotpCode();

    return () => {
      isCancelled = true;
    };
  }, [normalizedSecret, currentSecond]);

  async function copyCode() {
    try {
      if (!code) {
        return;
      }

      await navigator.clipboard.writeText(code);
      setCopyMessage("2FA code copied.");

      window.setTimeout(() => {
        setCopyMessage("");
      }, 2000);
    } catch {
      setError("Unable to copy 2FA code.");
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Authenticator Code
          </p>

          {error ? (
            <p className="mt-2 text-sm text-red-300">{error}</p>
          ) : (
            <p className="mt-2 font-mono text-3xl font-bold tracking-[0.35em] text-slate-100">
              {code || "------"}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={copyCode}
          disabled={!code}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Copy Code
        </button>
      </div>

      {!error && (
        <>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Refreshes in</span>
            <span>{remainingSeconds}s</span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </>
      )}

      {copyMessage && (
        <p className="mt-3 text-sm text-emerald-300">{copyMessage}</p>
      )}
    </div>
  );
}