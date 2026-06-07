"use client";

import { useEffect, useState } from "react";
import { useVault } from "@/contexts/VaultContext";

type RecentAuditLog = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type DashboardSummary = {
  vaultItemCount: number;
  auditLogCount: number;
  recentAuditLogs: RecentAuditLog[];
};

function formatAction(action: string) {
  const labels: Record<string, string> = {
    VAULT_UNLOCKED: "Vault Unlocked",
    VAULT_LOCKED: "Vault Locked",
    VAULT_ITEM_CREATED: "Vault Item Created",
    VAULT_ITEM_UPDATED: "Vault Item Updated",
    VAULT_ITEM_DELETED: "Vault Item Deleted",
    BREACH_CHECK_PERFORMED: "Breach Check Performed",
  };

  return labels[action] ?? action;
}

export default function DashboardOverview() {
  const { isVaultUnlocked, autoLockTimeoutMinutes } = useVault();

  const [summary, setSummary] = useState<DashboardSummary>({
    vaultItemCount: 0,
    auditLogCount: 0,
    recentAuditLogs: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboardSummary() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/dashboard/summary", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load dashboard summary.");
      }

      setSummary(data.summary as DashboardSummary);
    } catch (error) {
      console.error("Failed to load dashboard summary:", error);
      setError("Failed to load dashboard summary.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardSummary();
  }, []);

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Total Vault Items</p>

          <h3 className="mt-3 text-3xl font-bold">
            {isLoading ? "..." : summary.vaultItemCount}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Stored as encrypted blobs in PostgreSQL.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Vault Status</p>

          <h3
            className={`mt-3 text-3xl font-bold ${
              isVaultUnlocked ? "text-emerald-300" : "text-yellow-300"
            }`}
          >
            {isVaultUnlocked ? "Unlocked" : "Locked"}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Auto-lock: {autoLockTimeoutMinutes} minute
            {autoLockTimeoutMinutes > 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Security Events</p>

          <h3 className="mt-3 text-3xl font-bold">
            {isLoading ? "..." : summary.auditLogCount}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Audit logs without sensitive values.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-cyan-300">
            Authentication
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Clerk handles signup, login, logout, sessions, and protected routes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-cyan-300">
            Vault Encryption
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            The master password derives an AES-GCM key in the browser using
            PBKDF2.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-cyan-300">
            Encrypted Storage
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            The database stores ciphertext, IVs, salts, metadata, and audit
            logs only.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-semibold">Recent Activity</h3>

            <p className="mt-2 text-sm text-slate-400">
              Latest security-related events from your audit log.
            </p>
          </div>

          <button
            onClick={loadDashboardSummary}
            disabled={isLoading}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-slate-400">
            Loading recent activity...
          </p>
        )}

        {!isLoading && summary.recentAuditLogs.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-6 text-center">
            <p className="text-sm text-slate-400">No activity yet.</p>
          </div>
        )}

        {!isLoading && summary.recentAuditLogs.length > 0 && (
          <div className="mt-6 space-y-3">
            {summary.recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {formatAction(log.action)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>

                {log.metadata && (
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer">Metadata</summary>

                    <pre className="mt-2 max-w-xs overflow-x-auto rounded-lg bg-slate-900 p-3">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}