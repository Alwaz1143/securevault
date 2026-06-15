"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useVault } from "@/contexts/VaultContext";
import { decryptVaultData, type VaultPlaintextItem } from "@/lib/crypto";
import { checkPasswordBreach } from "@/lib/hibp";
import {
  analyzeVaultSecurity,
  type BreachStatusMap,
  type SecurityRisk,
  type SecurityRiskSeverity,
  type VaultSecurityInputItem,
  type VaultSecurityReport,
} from "@/lib/securityAnalysis";

type EncryptedVaultItem = {
  id: string;
  encryptedData: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
};

const severityStyles: Record<SecurityRiskSeverity, string> = {
  critical: "border-red-500/40 bg-red-500/10 text-red-300",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  medium: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  low: "border-slate-600 bg-slate-800 text-slate-300",
};

function formatSeverity(severity: SecurityRiskSeverity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

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

function getRiskTypeLabel(type: SecurityRisk["type"]) {
  const labels: Record<SecurityRisk["type"], string> = {
    breached_password: "Breached Password",
    weak_password: "Weak Password",
    reused_password: "Reused Password",
    old_password: "Old Password",
    missing_2fa: "Missing 2FA",
    missing_url: "Missing URL",
    missing_category: "Missing Category",
  };

  return labels[type];
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

function RiskCard({ risk }: { risk: SecurityRisk }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityStyles[risk.severity]}`}
            >
              {formatSeverity(risk.severity)}
            </span>

            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
              {getRiskTypeLabel(risk.type)}
            </span>
          </div>

          <h4 className="mt-4 text-lg font-semibold text-slate-100">
            {risk.title}
          </h4>

          <p className="mt-1 text-sm text-slate-500">{risk.username}</p>
        </div>

        <p className="text-xs text-slate-600">
          Reference date: {new Date(risk.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{risk.message}</p>

      {typeof risk.breachCount === "number" && (
        <p className="mt-2 text-sm text-red-300">
          Seen in breach datasets: {risk.breachCount.toLocaleString()} time(s)
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {risk.url && (
          <a
            href={risk.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            Open Site
          </a>
        )}

        <Link
          href={`/vault?edit=${risk.itemId}`}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-yellow-400 hover:text-yellow-300"
        >
          Edit Vault Item
        </Link>
      </div>
      <p className="mt-3 text-sm leading-6 text-cyan-300">
        Recommended action: {risk.recommendation}
      </p>

      {risk.relatedItemTitles && risk.relatedItemTitles.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Related vault items
          </p>

          <p className="mt-2 text-sm text-slate-300">
            {risk.relatedItemTitles.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SecurityCenterPanel() {
  const { isVaultUnlocked, vaultKey } = useVault();

  const [items, setItems] = useState<VaultSecurityInputItem[]>([]);
  const [breachStatusByItemId, setBreachStatusByItemId] =
    useState<BreachStatusMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isBreachScanning, setIsBreachScanning] = useState(false);
  const [error, setError] = useState("");
  const [decryptWarning, setDecryptWarning] = useState("");
  const [breachScanMessage, setBreachScanMessage] = useState("");

  const report: VaultSecurityReport = useMemo(() => {
    return analyzeVaultSecurity(items, breachStatusByItemId);
  }, [items, breachStatusByItemId]);

  const checkedBreachCount = Object.values(breachStatusByItemId).filter(
    (status) => status.isChecked
  ).length;

  const failedBreachCheckCount = Object.values(breachStatusByItemId).filter(
    (status) => status.error
  ).length;

  async function createBreachAuditLog(metadata: Record<string, number>) {
    try {
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "BREACH_CHECK_PERFORMED",
          metadata,
        }),
      });
    } catch (error) {
      console.error("Failed to create breach scan audit log:", error);
    }
  }

  async function loadSecurityReport() {
    try {
      setIsLoading(true);
      setError("");
      setDecryptWarning("");
      setBreachScanMessage("");
      setBreachStatusByItemId({});

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
          console.error(`Failed to decrypt vault item ${item.id}:`, error);
          failedDecryptCount++;
        }
      }

      setItems(decryptedVaultItems);

      if (failedDecryptCount > 0) {
        setDecryptWarning(
          `${failedDecryptCount} vault item(s) could not be decrypted and were excluded from the security report.`
        );
      }
    } catch (error) {
      console.error("Failed to load security center report:", error);
      setError("Failed to load security report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function runFullVaultBreachScan() {
    try {
      setIsBreachScanning(true);
      setError("");
      setBreachScanMessage("");

      if (items.length === 0) {
        setBreachScanMessage("Add vault items before running a breach scan.");
        return;
      }

      const passwordResultCache = new Map<
        string,
        { isPwned: boolean; breachCount: number }
      >();

      const nextBreachStatus: BreachStatusMap = {};
      let breachedItems = 0;
      let failedItems = 0;

      for (const item of items) {
        const password = item.password.trim();

        if (!password) {
          continue;
        }

        try {
          let breachResult = passwordResultCache.get(password);

          if (!breachResult) {
            const result = await checkPasswordBreach(password);

            breachResult = {
              isPwned: result.isPwned,
              breachCount: result.breachCount,
            };

            passwordResultCache.set(password, breachResult);
          }

          if (breachResult.isPwned) {
            breachedItems++;
          }

          nextBreachStatus[item.id] = {
            isChecked: true,
            isPwned: breachResult.isPwned,
            breachCount: breachResult.breachCount,
          };
        } catch (error) {
          console.error(`Failed to run breach check for ${item.id}:`, error);
          failedItems++;

          nextBreachStatus[item.id] = {
            isChecked: true,
            isPwned: false,
            breachCount: 0,
            error: "Breach check failed for this item.",
          };
        }
      }

      setBreachStatusByItemId(nextBreachStatus);

      await createBreachAuditLog({
        checkedItems: Object.keys(nextBreachStatus).length,
        breachedItems,
        failedItems,
      });

      setBreachScanMessage(
        breachedItems > 0
          ? `${breachedItems} item(s) use passwords found in known breach datasets.`
          : "Breach scan completed. No breached passwords were found."
      );
    } catch (error) {
      console.error("Failed to run full vault breach scan:", error);
      setError("Failed to run full vault breach scan. Please try again.");
    } finally {
      setIsBreachScanning(false);
    }
  }

  useEffect(() => {
    if (!isVaultUnlocked || !vaultKey) {
      setItems([]);
      setBreachStatusByItemId({});
      setError("");
      setDecryptWarning("");
      setBreachScanMessage("");
      return;
    }

    loadSecurityReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVaultUnlocked, vaultKey]);

  if (!isVaultUnlocked) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-xl font-semibold">Security Center Locked</h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Unlock your vault to analyze password health. SecureVault does not
          fetch or decrypt vault items while the vault is locked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm text-cyan-300">Local vault analysis</p>

            <h3 className="mt-2 text-2xl font-bold">Security Center</h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              This report decrypts vault items locally in your browser and
              checks for weak, reused, old, missing URL, and breached
              credentials. Plaintext passwords are never sent to your server.
            </p>
          </div>

          <button
            onClick={loadSecurityReport}
            disabled={isLoading || isBreachScanning}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Analyzing..." : "Refresh Report"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {decryptWarning && (
          <p className="mt-4 text-sm text-yellow-300">{decryptWarning}</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h3 className="text-xl font-semibold">Full Vault Breach Scan</h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Checks every decrypted vault password against the HaveIBeenPwned
              range API. SecureVault sends only the first 5 characters of each
              SHA-1 hash prefix, never the plaintext password.
            </p>
          </div>

          <button
            onClick={runFullVaultBreachScan}
            disabled={isBreachScanning || isLoading || items.length === 0}
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBreachScanning ? "Scanning..." : "Run Breach Scan"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Checked Items"
            value={checkedBreachCount}
            helper="Vault items checked during the current scan."
          />

          <StatCard
            label="Breached Passwords"
            value={report.breachedPasswordCount}
            helper="Passwords found in known breach datasets."
          />

          <StatCard
            label="Failed Checks"
            value={failedBreachCheckCount}
            helper="Items that could not be checked due to network/API errors."
          />
        </div>

        {breachScanMessage && (
          <p
            className={`mt-4 text-sm ${report.breachedPasswordCount > 0
              ? "text-red-300"
              : "text-emerald-300"
              }`}
          >
            {breachScanMessage}
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Score is calculated locally using breach status, password strength,
            reuse, age, 2FA availability, URL completeness, and organization signals.
          </p>
        </div>

        <StatCard
          label="Vault Items"
          value={report.totalItems}
          helper="Total decrypted items included in this report."
        />

        <StatCard
          label="Strong Passwords"
          value={report.strongPasswordCount}
          helper="Items with strong or very strong password structure."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Critical Risks"
          value={report.criticalCount}
          helper="Breached or reused passwords. Fix these first."
        />

        <StatCard
          label="Weak Passwords"
          value={report.weakPasswordCount}
          helper="Passwords with weak or medium strength."
        />

        <StatCard
          label="Reused Passwords"
          value={report.reusedPasswordCount}
          helper="Vault items sharing the same password."
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
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-semibold">Fix Priority</h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Start with breached, reused, weak, and missing-2FA issues before
              improving low-risk organization problems.
            </p>
          </div>

          <div className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
            {report.risks.length} total issue
            {report.risks.length === 1 ? "" : "s"}
          </div>
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-slate-400">
            Loading and analyzing vault items...
          </p>
        )}

        {!isLoading && report.totalItems === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
            <p className="text-slate-300">No vault items found.</p>

            <p className="mt-2 text-sm text-slate-500">
              Add vault items first, then return here to generate a security
              report.
            </p>
          </div>
        )}

        {!isLoading && report.totalItems > 0 && report.risks.length === 0 && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <p className="font-semibold text-emerald-300">
              No major issues found.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Your current vault items look healthy based on local checks. Run a
              breach scan when you want to verify exposure against known breach
              datasets.
            </p>
          </div>
        )}

        {!isLoading && report.risks.length > 0 && (
          <div className="mt-6 grid gap-4">
            {report.topPriorityRisks.map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        )}
      </section>

      {!isLoading && report.risks.length > report.topPriorityRisks.length && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">All Detected Issues</h3>

          <p className="mt-2 text-sm text-slate-400">
            Full list of remaining lower-priority issues.
          </p>

          <div className="mt-6 grid gap-4">
            {report.risks.slice(report.topPriorityRisks.length).map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}