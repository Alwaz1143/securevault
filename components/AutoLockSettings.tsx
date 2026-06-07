"use client";

import { useVault } from "@/contexts/VaultContext";

const timeoutOptions = [1, 5, 10, 15, 30];

export default function AutoLockSettings() {
  const {
    isVaultUnlocked,
    autoLockTimeoutMinutes,
    setAutoLockTimeoutMinutes,
    lockVault,
  } = useVault();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="text-xl font-semibold">Auto-Lock Timeout</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Automatically lock the vault after inactivity. Locking clears the
        in-memory encryption key and requires the master password again.
      </p>

      <div className="mt-6">
        <label
          htmlFor="autoLockTimeout"
          className="text-sm font-medium text-slate-200"
        >
          Timeout
        </label>

        <select
          id="autoLockTimeout"
          value={autoLockTimeoutMinutes}
          onChange={(event) =>
            setAutoLockTimeoutMinutes(Number(event.target.value))
          }
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-200 outline-none transition focus:border-cyan-400"
        >
          {timeoutOptions.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} minute{minutes > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-xs leading-5 text-slate-500">
          Current status:{" "}
          <span
            className={
              isVaultUnlocked ? "text-emerald-300" : "text-yellow-300"
            }
          >
            {isVaultUnlocked ? "Unlocked" : "Locked"}
          </span>
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          The timeout preference is stored locally in the browser. The master
          password and vault key are still not stored.
        </p>
      </div>

      {isVaultUnlocked && (
        <button
          onClick={() => lockVault("manual_lock_from_settings")}
          className="mt-5 rounded-xl border border-red-500/40 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-500 hover:text-white"
        >
          Lock Vault Now
        </button>
      )}
    </div>
  );
}