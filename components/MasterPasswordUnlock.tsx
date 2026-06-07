"use client";

import { useState } from "react";
import { useVault } from "@/contexts/VaultContext";

export default function MasterPasswordUnlock() {
  const {
    isVaultUnlocked,
    isUnlocking,
    unlockedAt,
    unlockVault,
    lockVault,
  } = useVault();

  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState("");

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const result = await unlockVault(masterPassword);

    if (!result.ok) {
      setError(result.message || "Unable to unlock vault.");
      return;
    }

    setMasterPassword("");
  }

  if (isVaultUnlocked) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-semibold text-emerald-300">
              Vault Unlocked
            </h3>
            <p className="mt-2 text-sm text-emerald-100/80">
              Your vault key was derived in the browser using your master
              password.
            </p>

            {unlockedAt && (
              <p className="mt-2 text-xs text-emerald-100/60">
                Unlocked at: {new Date(unlockedAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          <button
            onClick={() => lockVault("manual_lock_from_unlock_panel")}
            className="rounded-xl border border-emerald-400/40 px-5 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-400 hover:text-slate-950"
          >
            Lock Vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
      <h3 className="text-xl font-semibold text-yellow-300">
        Unlock Your Vault
      </h3>

      <p className="mt-2 text-sm leading-6 text-yellow-100/80">
        Enter your master password to derive your encryption key in the browser.
        This password is different from your Clerk login password and is not
        sent to the backend.
      </p>

      <form onSubmit={handleUnlock} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="masterPassword"
            className="text-sm font-medium text-slate-200"
          >
            Master Password
          </label>

          <input
            id="masterPassword"
            type="password"
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            placeholder="Enter master password"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
          />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={isUnlocking}
          className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUnlocking ? "Deriving Key..." : "Unlock Vault"}
        </button>
      </form>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-xs leading-5 text-slate-400">
          Security note: PBKDF2 derives an AES-GCM key from your master
          password. The salt is stored because it is not secret. The master
          password and encryption key are not stored in the database.
        </p>
      </div>
    </div>
  );
}