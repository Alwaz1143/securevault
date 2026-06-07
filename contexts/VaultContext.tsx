"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type VaultContextValue = {
  isVaultUnlocked: boolean;
  unlockedAt: string | null;
  unlockVault: (masterPassword: string) => boolean;
  lockVault: () => void;
};

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [unlockedAt, setUnlockedAt] = useState<string | null>(null);

  function unlockVault(masterPassword: string) {
    if (masterPassword.length < 8) {
      return false;
    }

    /*
      Important:
      For now, we only use the master password to unlock the UI state.

      We are NOT storing:
      - master password
      - encryption key
      - plaintext vault data

      In the next steps, this function will derive a CryptoKey using PBKDF2.
    */
    setIsVaultUnlocked(true);
    setUnlockedAt(new Date().toISOString());

    return true;
  }

  function lockVault() {
    /*
      Later, this will also clear the in-memory encryption key.
    */
    setIsVaultUnlocked(false);
    setUnlockedAt(null);
  }

  const value = useMemo(
    () => ({
      isVaultUnlocked,
      unlockedAt,
      unlockVault,
      lockVault,
    }),
    [isVaultUnlocked, unlockedAt]
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);

  if (!context) {
    throw new Error("useVault must be used inside VaultProvider");
  }

  return context;
}