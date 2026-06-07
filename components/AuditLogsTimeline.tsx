"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
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

function getActionDescription(log: AuditLog) {
  switch (log.action) {
    case "VAULT_ITEM_CREATED":
      return "A new encrypted vault item was created.";
    case "VAULT_ITEM_UPDATED":
      return "An encrypted vault item was updated.";
    case "VAULT_ITEM_DELETED":
      return "An encrypted vault item was deleted.";
    case "BREACH_CHECK_PERFORMED":
      return "A password breach check was performed safely.";
    case "VAULT_UNLOCKED":
      return "The vault was unlocked in the browser.";
    case "VAULT_LOCKED":
      return "The vault was locked and the in-memory key was cleared.";
    default:
      return "Security event recorded.";
  }
}

function MetadataView({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs font-semibold text-slate-400">Metadata</p>

      <dl className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key}>
            <dt className="font-medium text-slate-400">{key}</dt>
            <dd className="mt-1 break-all">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AuditLogsTimeline() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAuditLogs() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/audit-logs", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load audit logs.");
      }

      setLogs(data.logs as AuditLog[]);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      setError("Failed to load audit logs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-semibold">Activity Timeline</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Review recent security events. Sensitive values like passwords,
            notes, decrypted data, and master passwords are never logged.
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          disabled={isLoading}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <p className="mt-5 text-sm text-red-300">{error}</p>}

      {isLoading && (
        <p className="mt-8 text-sm text-slate-400">Loading audit logs...</p>
      )}

      {!isLoading && logs.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <p className="text-slate-300">No audit logs yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            Create, edit, delete a vault item, or run a breach check to generate
            logs.
          </p>
        </div>
      )}

      {!isLoading && logs.length > 0 && (
        <div className="mt-8 space-y-4">
          {logs.map((log) => (
            <article
              key={log.id}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h4 className="font-semibold text-slate-100">
                    {formatAction(log.action)}
                  </h4>

                  <p className="mt-2 text-sm text-slate-400">
                    {getActionDescription(log)}
                  </p>
                </div>

                <time className="text-xs text-slate-500">
                  {new Date(log.createdAt).toLocaleString()}
                </time>
              </div>

              <MetadataView metadata={log.metadata} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}