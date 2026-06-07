"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { deriveVaultKey, generateSaltBase64 } from "@/lib/crypto";

type UnlockResult = {
  ok: boolean;
  message?: string;
};

type VaultContextValue = {
  isVaultUnlocked: boolean;
  isUnlocking: boolean;
  unlockedAt: string | null;
  vaultKey: CryptoKey | null;
  unlockVault: (masterPassword: string) => Promise<UnlockResult>;
  lockVault: () => void;
};

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

async function getOrCreateKdfSalt() {
  const getResponse = await fetch("/api/user/security", {
    method: "GET",
    cache: "no-store",
  });

  const getData = await getResponse.json();

  if (!getResponse.ok || !getData.ok) {
    throw new Error(getData.message || "Failed to fetch KDF salt");
  }

  if (getData.kdfSalt) {
    return getData.kdfSalt as string;
  }

  const newSalt = generateSaltBase64();

  const postResponse = await fetch("/api/user/security", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kdfSalt: newSalt,
    }),
  });

  const postData = await postResponse.json();

  if (!postResponse.ok || !postData.ok) {
    throw new Error(postData.message || "Failed to save KDF salt");
  }

  return postData.kdfSalt as string;
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedAt, setUnlockedAt] = useState<string | null>(null);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);

  async function unlockVault(masterPassword: string): Promise<UnlockResult> {
    try {
      setIsUnlocking(true);

      if (masterPassword.length < 8) {
        return {
          ok: false,
          message: "Master password must be at least 8 characters.",
        };
      }

      const kdfSalt = await getOrCreateKdfSalt();
      const derivedKey = await deriveVaultKey(masterPassword, kdfSalt);

      setVaultKey(derivedKey);
      setIsVaultUnlocked(true);
      setUnlockedAt(new Date().toISOString());

      return {
        ok: true,
      };
    } catch (error) {
      console.error("Failed to unlock vault:", error);

      return {
        ok: false,
        message: "Failed to unlock vault. Please try again.",
      };
    } finally {
      setIsUnlocking(false);
    }
  }

  function lockVault() {
    /*
      This removes the CryptoKey from React state.
      It does not guarantee perfect memory wiping, but practically the app
      no longer has access to the key after locking.
    */
    setVaultKey(null);
    setIsVaultUnlocked(false);
    setUnlockedAt(null);
  }

  const value = useMemo(
    () => ({
      isVaultUnlocked,
      isUnlocking,
      unlockedAt,
      vaultKey,
      unlockVault,
      lockVault,
    }),
    [isVaultUnlocked, isUnlocking, unlockedAt, vaultKey]
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