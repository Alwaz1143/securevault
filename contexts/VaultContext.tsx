"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  decryptVaultData,
  deriveVaultKey,
  encryptVaultData,
  generateSaltBase64,
} from "@/lib/crypto";

const MASTER_KEY_VERIFIER_TEXT = "SECUREVAULT_MASTER_KEY_VERIFIER_V1";
const DEFAULT_AUTO_LOCK_MINUTES = 5;
const AUTO_LOCK_STORAGE_KEY = "securevault_auto_lock_minutes";

type UnlockResult = {
  ok: boolean;
  message?: string;
};

type SecuritySettings = {
  kdfSalt: string | null;
  masterKeyVerifier: string | null;
  masterKeyVerifierIv: string | null;
};

type VaultContextValue = {
  isVaultUnlocked: boolean;
  isUnlocking: boolean;
  unlockedAt: string | null;
  vaultKey: CryptoKey | null;
  autoLockTimeoutMinutes: number;
  setAutoLockTimeoutMinutes: (minutes: number) => void;
  unlockVault: (masterPassword: string) => Promise<UnlockResult>;
  lockVault: (reason?: string) => void;
};

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

async function fetchSecuritySettings(): Promise<SecuritySettings> {
  const response = await fetch("/api/user/security", {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Failed to fetch security settings");
  }

  return {
    kdfSalt: data.kdfSalt ?? null,
    masterKeyVerifier: data.masterKeyVerifier ?? null,
    masterKeyVerifierIv: data.masterKeyVerifierIv ?? null,
  };
}

async function createKdfSalt() {
  const newSalt = generateSaltBase64();

  const response = await fetch("/api/user/security", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kdfSalt: newSalt,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Failed to save KDF salt");
  }

  return data.kdfSalt as string;
}

async function saveMasterKeyVerifier(
  masterKeyVerifier: string,
  masterKeyVerifierIv: string
) {
  const response = await fetch("/api/user/security/verifier", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      masterKeyVerifier,
      masterKeyVerifierIv,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Failed to save master key verifier");
  }
}

async function createClientAuditLog(
  action: "VAULT_UNLOCKED" | "VAULT_LOCKED",
  metadata?: Record<string, string | number | boolean | null>
) {
  try {
    await fetch("/api/audit-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        metadata,
      }),
    });
  } catch (error) {
    console.error("Failed to create client audit log:", error);
  }
}

function getInitialAutoLockMinutes() {
  if (typeof window === "undefined") {
    return DEFAULT_AUTO_LOCK_MINUTES;
  }

  const savedValue = window.localStorage.getItem(AUTO_LOCK_STORAGE_KEY);
  const parsedValue = Number(savedValue);

  if ([1, 5, 10, 15, 30].includes(parsedValue)) {
    return parsedValue;
  }

  return DEFAULT_AUTO_LOCK_MINUTES;
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedAt, setUnlockedAt] = useState<string | null>(null);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [autoLockTimeoutMinutes, setAutoLockTimeoutMinutesState] = useState(
    DEFAULT_AUTO_LOCK_MINUTES
  );

  useEffect(() => {
    setAutoLockTimeoutMinutesState(getInitialAutoLockMinutes());
  }, []);

  function setAutoLockTimeoutMinutes(minutes: number) {
    setAutoLockTimeoutMinutesState(minutes);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_LOCK_STORAGE_KEY, String(minutes));
    }
  }

  async function unlockVault(masterPassword: string): Promise<UnlockResult> {
    try {
      setIsUnlocking(true);

      if (masterPassword.length < 8) {
        return {
          ok: false,
          message: "Master password must be at least 8 characters.",
        };
      }

      const securitySettings = await fetchSecuritySettings();

      const kdfSalt = securitySettings.kdfSalt ?? (await createKdfSalt());

      const derivedKey = await deriveVaultKey(masterPassword, kdfSalt);

      if (
        securitySettings.masterKeyVerifier &&
        securitySettings.masterKeyVerifierIv
      ) {
        try {
          const verifierText = await decryptVaultData<string>(
            securitySettings.masterKeyVerifier,
            securitySettings.masterKeyVerifierIv,
            derivedKey
          );

          if (verifierText !== MASTER_KEY_VERIFIER_TEXT) {
            return {
              ok: false,
              message: "Incorrect master password.",
            };
          }
        } catch {
          return {
            ok: false,
            message: "Incorrect master password.",
          };
        }
      } else {
        const encryptedVerifier = await encryptVaultData(
          MASTER_KEY_VERIFIER_TEXT,
          derivedKey
        );

        await saveMasterKeyVerifier(
          encryptedVerifier.encryptedData,
          encryptedVerifier.iv
        );
      }

      setVaultKey(derivedKey);
      setIsVaultUnlocked(true);
      setUnlockedAt(new Date().toISOString());

      await createClientAuditLog("VAULT_UNLOCKED", {
        reason: "manual_unlock",
      });

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

  const lockVault = useCallback((reason = "manual_lock") => {
    setVaultKey(null);
    setIsVaultUnlocked(false);
    setUnlockedAt(null);

    void createClientAuditLog("VAULT_LOCKED", {
      reason,
    });
  }, []);

  useEffect(() => {
    if (!isVaultUnlocked) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    function resetAutoLockTimer() {
      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        lockVault("auto_lock_inactivity");
      }, autoLockTimeoutMinutes * 60 * 1000);
    }

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    resetAutoLockTimer();

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetAutoLockTimer);
    });

    return () => {
      window.clearTimeout(timeoutId);

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetAutoLockTimer);
      });
    };
  }, [isVaultUnlocked, autoLockTimeoutMinutes, lockVault]);

  const value = useMemo(
    () => ({
      isVaultUnlocked,
      isUnlocking,
      unlockedAt,
      vaultKey,
      autoLockTimeoutMinutes,
      setAutoLockTimeoutMinutes,
      unlockVault,
      lockVault,
    }),
    [
      isVaultUnlocked,
      isUnlocking,
      unlockedAt,
      vaultKey,
      autoLockTimeoutMinutes,
      lockVault,
    ]
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