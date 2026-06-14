"use client";

import { useRef, useState } from "react";
import { useVault } from "@/contexts/VaultContext";

type EncryptedVaultBackupItem = {
  encryptedData: string;
  iv: string;
  createdAt?: string;
  updatedAt?: string;
};

type SecureVaultEncryptedBackup = {
  format: "securevault.encrypted.backup";
  version: 1;
  exportedAt: string;
  itemCount: number;
  warning: string;
  items: EncryptedVaultBackupItem[];
};

type ApiVaultItem = {
  id: string;
  encryptedData: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
};

function isValidBackup(data: unknown): data is SecureVaultEncryptedBackup {
  if (!data || typeof data !== "object") {
    return false;
  }

  const backup = data as SecureVaultEncryptedBackup;

  if (backup.format !== "securevault.encrypted.backup") {
    return false;
  }

  if (backup.version !== 1) {
    return false;
  }

  if (!Array.isArray(backup.items)) {
    return false;
  }

  return backup.items.every((item) => {
    return (
      item &&
      typeof item === "object" &&
      typeof item.encryptedData === "string" &&
      typeof item.iv === "string" &&
      item.encryptedData.length > 0 &&
      item.iv.length > 0
    );
  });
}

function getBackupFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `securevault-encrypted-backup-${date}.json`;
}

export default function EncryptedBackupPanel() {
  const { isVaultUnlocked } = useVault();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function exportEncryptedBackup() {
    try {
      setIsExporting(true);
      setMessage("");
      setError("");

      if (!isVaultUnlocked) {
        setError("Unlock your vault before exporting an encrypted backup.");
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

      const vaultItems = data.items as ApiVaultItem[];

      const backup: SecureVaultEncryptedBackup = {
        format: "securevault.encrypted.backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        itemCount: vaultItems.length,
        warning:
          "This file contains encrypted SecureVault records only. It does not contain plaintext passwords. It is intended to be imported into the same SecureVault account/master-password setup.",
        items: vaultItems.map((item) => ({
          encryptedData: item.encryptedData,
          iv: item.iv,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });

      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = getBackupFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(downloadUrl);

      setMessage(
        `Encrypted backup exported successfully with ${vaultItems.length} item${
          vaultItems.length === 1 ? "" : "s"
        }.`
      );
    } catch (error) {
      console.error("Failed to export encrypted backup:", error);
      setError("Failed to export encrypted backup. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  function openImportPicker() {
    setMessage("");
    setError("");
    fileInputRef.current?.click();
  }

  async function importEncryptedBackup(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    try {
      setIsImporting(true);
      setMessage("");
      setError("");

      if (!isVaultUnlocked) {
        setError("Unlock your vault before importing an encrypted backup.");
        return;
      }

      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      const fileText = await file.text();
      const parsedBackup = JSON.parse(fileText) as unknown;

      if (!isValidBackup(parsedBackup)) {
        setError(
          "Invalid backup file. Please select a SecureVault encrypted backup JSON file."
        );
        return;
      }

      if (parsedBackup.items.length === 0) {
        setError("This backup file does not contain any vault items.");
        return;
      }

      const confirmed = window.confirm(
        `Import ${parsedBackup.items.length} encrypted vault item${
          parsedBackup.items.length === 1 ? "" : "s"
        }? This will add new items to your vault and may create duplicates.`
      );

      if (!confirmed) {
        return;
      }

      let importedCount = 0;
      let failedCount = 0;

      for (const item of parsedBackup.items) {
        try {
          const response = await fetch("/api/vault", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              encryptedData: item.encryptedData,
              iv: item.iv,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.ok) {
            throw new Error(data.message || "Failed to import item.");
          }

          importedCount++;
        } catch (error) {
          console.error("Failed to import encrypted backup item:", error);
          failedCount++;
        }
      }

      setMessage(
        `Import completed. Imported ${importedCount} item${
          importedCount === 1 ? "" : "s"
        }${failedCount > 0 ? `, failed ${failedCount}` : ""}.`
      );
    } catch (error) {
      console.error("Failed to import encrypted backup:", error);
      setError("Failed to import encrypted backup. Please check the file.");
    } finally {
      setIsImporting(false);

      if (event.target) {
        event.target.value = "";
      }
    }
  }

  if (!isVaultUnlocked) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-xl font-semibold">Encrypted Backup Locked</h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Unlock your vault before exporting or importing backups. Backup files
          contain encrypted vault records only, but SecureVault still requires an
          unlocked vault before backup operations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-cyan-300">Encrypted backup</p>

        <h3 className="mt-2 text-2xl font-bold">Backup & Restore</h3>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Export your vault as an encrypted JSON backup or import a previous
          encrypted backup. SecureVault does not export plaintext passwords in
          this workflow.
        </p>

        {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h4 className="text-lg font-semibold">Export Encrypted Backup</h4>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Downloads a JSON file containing encrypted vault records. The file
            contains ciphertext and IVs only, not decrypted passwords.
          </p>

          <button
            type="button"
            onClick={exportEncryptedBackup}
            disabled={isExporting || isImporting}
            className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? "Exporting..." : "Export Backup"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h4 className="text-lg font-semibold">Import Encrypted Backup</h4>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Imports encrypted vault records from a SecureVault backup file. This
            adds new items and may create duplicates.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={importEncryptedBackup}
            className="hidden"
          />

          <button
            type="button"
            onClick={openImportPicker}
            disabled={isExporting || isImporting}
            className="mt-5 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImporting ? "Importing..." : "Import Backup"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
        <h4 className="font-semibold text-yellow-300">Important Limitation</h4>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          This V1 backup is encrypted and intended for the same SecureVault
          account/master-password setup. If the backup was created with a
          different encryption key, imported items may not decrypt correctly.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Do not edit the JSON file manually. Store it somewhere safe, because
          losing access to your master password can make encrypted backups
          unrecoverable.
        </p>
      </section>
    </div>
  );
}