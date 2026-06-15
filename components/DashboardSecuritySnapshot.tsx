"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useVault } from "@/contexts/VaultContext";
import { decryptVaultData, type VaultPlaintextItem } from "@/lib/crypto";
import {
  analyzeVaultSecurity,
  type VaultSecurityInputItem,
} from "@/lib/securityAnalysis";

type EncryptedVaultItem = {
  id: string;
  encryptedData: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
};

function getScoreColor(score: number) {
  if (score >= 90) {
    return "text-emerald-300";
  }

  if (score >= 75) {
    return "text-cyan-300";
  }

  if (score >= 50) {
    return "text-yellow-300";
  }

  return "text-red-300";
}

function getDuplicateKey(item: VaultSecurityInputItem) {
  return [
    item.title.trim().toLowerCase(),
    item.username.trim().toLowerCase(),
    item.url?.trim().toLowerCase() ?? "",
  ].join("|");
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-100">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

export default function DashboardSecuritySnapshot() {
  const { isVaultUnlocked, vaultKey } = useVault();

  const [items, setItems] = useState<VaultSecurityInputItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [decryptWarning, setDecryptWarning] = useState("");

  const report = useMemo(() => analyzeVaultSecurity(items), [items]);

  const duplicateGroupCount = useMemo(() => {
    const groups = new Map<string, number>();

    for (const item of items) {
      const key = getDuplicateKey(item);
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }

    return Array.from(groups.values()).filter((count) => count > 1).length;
  }, [items]);

  async function loadSnapshot() {
    try {
      setIsLoading(true);
      setError("");
      setDecryptWarning("");

      if (!vaultKey) {
        setError("Vault key is missing. Lock and unlock the vault again.");
        return;
      }

      const response = await fetch("/api/vault", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to load vault items.");
      }

      const encryptedVaultItems = data.items as EncryptedVaultItem[];
      const decryptedVaultItems: VaultSecurityInputItem[] = [];
      let failedDecryptCount = 0;

      for (const item of encryptedVaultItems) {
        try {
          const decrypted = await decryptVaultData<VaultPlaintextItem>(
            item.encryptedData,
            item.iv,
            vaultKey
          );

          decryptedVaultItems.push({
            id: item.id,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            ...decrypted,
          });
        } catch (error) {
          console.error(`Failed to decrypt dashboard item ${item.id}:`, error);
          failedDecryptCount++;
        }
      }

      setItems(decryptedVaultItems);

      if (failedDecryptCount > 0) {
        setDecryptWarning(
          `${failedDecryptCount} item(s) could not be decrypted and were excluded from dashboard health.`
        );
      }
    } catch (error) {
      console.error("Failed to load dashboard security snapshot:", error);
      setError("Failed to load dashboard security snapshot.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isVaultUnlocked || !vaultKey) {
      setItems([]);
      setError("");
      setDecryptWarning("");
      return;
    }

    loadSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVaultUnlocked, vaultKey]);

  if (!isVaultUnlocked) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-cyan-300">Vault health</p>

        <h3 className="mt-2 text-2xl font-bold">Security Snapshot Locked</h3>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Unlock your vault to view local password health, 2FA coverage,
          duplicate detection, and security score. SecureVault does not decrypt
          dashboard insights while locked.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm text-cyan-300">Local vault health</p>

            <h3 className="mt-2 text-2xl font-bold">Security Snapshot</h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              A quick local overview of your encrypted vault health. This uses
              decrypted data only inside your browser.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSnapshot}
            disabled={isLoading}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh Snapshot"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {decryptWarning && (
          <p className="mt-4 text-sm text-yellow-300">{decryptWarning}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:col-span-2">
          <p className="text-sm text-slate-400">Security Score</p>

          <div className="mt-3 flex items-end gap-3">
            <p
              className={`text-5xl font-bold ${getScoreColor(
                report.securityScore
              )}`}
            >
              {report.securityScore}
            </p>

            <p className="pb-2 text-sm text-slate-500">/ 100</p>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-200">
            {report.scoreLabel}
          </p>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${report.securityScore}%` }}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/security-center"
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open Security Center
            </Link>

            <Link
              href="/vault"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Manage Vault
            </Link>
          </div>
        </div>

        <StatCard
          label="Vault Items"
          value={report.totalItems}
          helper="Total decrypted items included in this snapshot."
        />

        <StatCard
          label="Duplicate Groups"
          value={duplicateGroupCount}
          helper="Possible duplicate records with same title, username, and URL."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Critical Risks"
          value={report.criticalCount}
          helper="Reused or other high-priority issues."
        />

        <StatCard
          label="Weak Passwords"
          value={report.weakPasswordCount}
          helper="Passwords with weak or medium structure."
        />

        <StatCard
          label="Reused Passwords"
          value={report.reusedPasswordCount}
          helper="Items sharing the same password."
        />

        <StatCard
          label="Missing 2FA"
          value={report.missing2faCount}
          helper="Important accounts without TOTP setup keys."
        />

        <StatCard
          label="Missing URLs"
          value={report.missingUrlCount}
          helper="Items without a login page URL saved."
        />
      </div>
    </section>
  );
}