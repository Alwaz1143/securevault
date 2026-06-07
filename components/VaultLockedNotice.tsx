"use client";

import { useVault } from "@/contexts/VaultContext";

export default function VaultLockedNotice() {
  const { isVaultUnlocked } = useVault();

  if (isVaultUnlocked) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-100/80">
        Vault is unlocked. In the next step, decrypted vault items will be shown
        only while this state is active.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100/80">
      Vault is locked. Vault items should not be decrypted or displayed until
      the master password unlock flow is completed.
    </div>
  );
}