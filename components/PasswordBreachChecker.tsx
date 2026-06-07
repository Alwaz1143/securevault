"use client";

import { useState } from "react";
import { checkPasswordBreach, type BreachCheckResult } from "@/lib/hibp";

export default function PasswordBreachChecker() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<BreachCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  async function handleBreachCheck() {
    try {
      setError("");
      setResult(null);

      if (!password) {
        setError("Enter a password to check.");
        return;
      }

      setIsChecking(true);

      const breachResult = await checkPasswordBreach(password);

      setResult(breachResult);
    } catch (error) {
      console.error("Breach check failed:", error);
      setError("Failed to check breach status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
      <h3 className="text-xl font-semibold">HaveIBeenPwned Breach Check</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Check whether a password has appeared in known data breaches using
        k-anonymity. The full password is never sent to HaveIBeenPwned.
      </p>

      <div className="mt-6">
        <label
          htmlFor="breachPassword"
          className="text-sm font-medium text-slate-200"
        >
          Password to Check
        </label>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="breachPassword"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setResult(null);
              setError("");
            }}
            placeholder="Enter password to check"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            {showPassword ? "Hide" : "Show"}
          </button>

          <button
            type="button"
            onClick={handleBreachCheck}
            disabled={isChecking || !password}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChecking ? "Checking..." : "Check"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {result && (
        <div
          className={`mt-6 rounded-2xl border p-5 ${
            result.isPwned
              ? "border-red-500/30 bg-red-500/10"
              : "border-emerald-500/30 bg-emerald-500/10"
          }`}
        >
          {result.isPwned ? (
            <>
              <h4 className="text-lg font-semibold text-red-300">
                Password Found in Breaches
              </h4>

              <p className="mt-2 text-sm leading-6 text-red-100/80">
                This password appears{" "}
                <span className="font-bold">{result.breachCount}</span> time(s)
                in known breach datasets. Do not use this password.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-lg font-semibold text-emerald-300">
                No Match Found
              </h4>

              <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                This password was not found in the HIBP Pwned Passwords dataset.
                This does not prove it is perfect, but it is a good sign.
              </p>
            </>
          )}

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs leading-5 text-slate-500">
              Only this SHA-1 hash prefix was sent:{" "}
              <span className="font-mono text-slate-300">
                {result.hashPrefix}
              </span>
              . The full password and full hash were not sent.
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-xs leading-5 text-slate-500">
          Security note: SHA-1 is used here only because HIBP indexes breached
          passwords by SHA-1 hash range. This is not password storage. We are not
          hashing passwords for authentication.
        </p>
      </div>
    </div>
  );
}