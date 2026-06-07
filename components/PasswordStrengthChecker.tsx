"use client";

import { useMemo, useState } from "react";
import { evaluatePasswordStrength } from "@/lib/passwordStrength";

export default function PasswordStrengthChecker() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="text-xl font-semibold">Password Strength Checker</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Estimate password strength using length, character variety, repeated
        characters, and common patterns.
      </p>

      <div className="mt-6">
        <label
          htmlFor="strengthPassword"
          className="text-sm font-medium text-slate-200"
        >
          Password
        </label>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="strengthPassword"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Strength</p>
          <p className="text-sm font-semibold text-cyan-300">
            {strength.label}
          </p>
        </div>

        <div className="mt-3 h-2 rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-cyan-400"
            style={{ width: `${strength.percentage}%` }}
          />
        </div>

        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-slate-400">
          {strength.feedback.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-xs leading-5 text-slate-500">
          Security note: This is a basic strength estimator. Later we can use a
          library like zxcvbn for more realistic password analysis.
        </p>
      </div>
    </div>
  );
}