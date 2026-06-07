"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  type PasswordGeneratorOptions,
} from "@/lib/passwordGenerator";
import { evaluatePasswordStrength } from "@/lib/passwordStrength";

export default function PasswordGeneratorPanel() {
  const [options, setOptions] = useState<PasswordGeneratorOptions>(
    DEFAULT_PASSWORD_OPTIONS
  );
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const strength = useMemo(
    () => evaluatePasswordStrength(generatedPassword),
    [generatedPassword]
  );

  function updateOption<K extends keyof PasswordGeneratorOptions>(
    key: K,
    value: PasswordGeneratorOptions[K]
  ) {
    setOptions((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleGeneratePassword() {
    try {
      setError("");
      setCopyMessage("");

      const password = generatePassword(options);
      setGeneratedPassword(password);
    } catch (error) {
      setGeneratedPassword("");
      setError(
        error instanceof Error ? error.message : "Failed to generate password."
      );
    }
  }

  async function copyPassword() {
    try {
      if (!generatedPassword) {
        return;
      }

      await navigator.clipboard.writeText(generatedPassword);
      setCopyMessage("Generated password copied.");
    } catch {
      setError("Unable to copy password.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="text-xl font-semibold">Password Generator</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Generate strong random passwords using the browser&apos;s secure random
        number generator.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="passwordLength"
              className="text-sm font-medium text-slate-200"
            >
              Length
            </label>
            <span className="text-sm text-cyan-300">{options.length}</span>
          </div>

          <input
            id="passwordLength"
            type="range"
            min={8}
            max={40}
            value={options.length}
            onChange={(event) =>
              updateOption("length", Number(event.target.value))
            }
            className="mt-3 w-full"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={options.includeUppercase}
              onChange={(event) =>
                updateOption("includeUppercase", event.target.checked)
              }
            />
            Uppercase
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={options.includeLowercase}
              onChange={(event) =>
                updateOption("includeLowercase", event.target.checked)
              }
            />
            Lowercase
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={options.includeNumbers}
              onChange={(event) =>
                updateOption("includeNumbers", event.target.checked)
              }
            />
            Numbers
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={options.includeSymbols}
              onChange={(event) =>
                updateOption("includeSymbols", event.target.checked)
              }
            />
            Symbols
          </label>
        </div>

        <button
          onClick={handleGeneratePassword}
          className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Generate Password
        </button>

        {error && <p className="text-sm text-red-300">{error}</p>}

        {generatedPassword && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-semibold text-slate-300">
              Generated Password
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <code className="flex-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-cyan-300">
                {generatedPassword}
              </code>

              <button
                onClick={copyPassword}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Copy
              </button>
            </div>

            {copyMessage && (
              <p className="mt-3 text-sm text-emerald-300">{copyMessage}</p>
            )}

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Strength</p>
                <p className="text-sm font-semibold text-cyan-300">
                  {strength.label}
                </p>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-cyan-400"
                  style={{ width: `${strength.percentage}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}