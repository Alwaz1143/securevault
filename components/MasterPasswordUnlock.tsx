"use client";

import { useState } from "react";
import { useVault } from "@/contexts/VaultContext";

export default function MasterPasswordUnlock() {
  const { isVaultUnlocked, unlockedAt, unlockVault, lockVault } = useVault();
  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState("");

  function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const success = unlockVault(masterPassword);

    if (!success) {
      setError("Master password must be at least 8 characters for now.");
      return;
    }

    /*
      Important:
      Clear the input after unlocking so the password is not kept in the form.
    */
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
              Your vault is unlocked in this browser session.
            </p>

            {unlockedAt && (
              <p className="mt-2 text-xs text-emerald-100/60">
                Unlocked at: {new Date(unlockedAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          <button
            onClick={lockVault}
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
        Enter your master password to unlock vault features. This password is
        different from your Clerk login password and will not be sent to the
        backend.
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
          className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Unlock Vault
        </button>
      </form>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-xs leading-5 text-slate-400">
          Security note: In this step, the master password only controls the UI
          lock state. In the next encryption step, it will be used to derive an
          AES-GCM encryption key using PBKDF2.
        </p>
      </div>
    </div>
  );
}