
"use client";

import { useState } from "react";
import { useVault } from "@/contexts/VaultContext";
import {
  decryptVaultData,
  encryptVaultData,
  type VaultPlaintextItem,
} from "@/lib/crypto";

export default function CryptoTestPanel() {
  const { isVaultUnlocked, vaultKey } = useVault();

  const [encryptedData, setEncryptedData] = useState("");
  const [iv, setIv] = useState("");
  const [decryptedPreview, setDecryptedPreview] = useState("");
  const [error, setError] = useState("");

  async function handleCryptoTest() {
    try {
      setError("");
      setEncryptedData("");
      setIv("");
      setDecryptedPreview("");

      if (!isVaultUnlocked || !vaultKey) {
        setError("Unlock the vault first.");
        return;
      }

      const sampleVaultItem: VaultPlaintextItem = {
        title: "Demo Website",
        username: "demo@example.com",
        password: "fake-demo-password-123!",
        notes: "This is fake test data only.",
        category: "demo",
      };

      const encrypted = await encryptVaultData(sampleVaultItem, vaultKey);

      const decrypted = await decryptVaultData<VaultPlaintextItem>(
        encrypted.encryptedData,
        encrypted.iv,
        vaultKey
      );

      setEncryptedData(encrypted.encryptedData);
      setIv(encrypted.iv);
      setDecryptedPreview(JSON.stringify(decrypted, null, 2));
    } catch (error) {
      console.error("Crypto test failed:", error);
      setError("Crypto test failed. Check console for details.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="text-xl font-semibold">Crypto Test</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        This test encrypts fake vault data in the browser using AES-GCM, then
        decrypts it locally using the in-memory CryptoKey.
      </p>

      <button
        onClick={handleCryptoTest}
        disabled={!isVaultUnlocked}
        className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Run Crypto Test
      </button>

      {!isVaultUnlocked && (
        <p className="mt-3 text-sm text-yellow-300">
          Unlock the vault first to run this test.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {encryptedData && (
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-300">IV</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-400">
              {iv}
            </pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-300">Ciphertext</p>
            <pre className="mt-2 max-h-40 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-400">
              {encryptedData}
            </pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-300">
              Decrypted Preview
            </p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300">
              {decryptedPreview}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}