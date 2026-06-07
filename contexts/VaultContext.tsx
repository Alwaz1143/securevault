"use client";

import {
    createContext,
    useContext,
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
    unlockVault: (masterPassword: string) => Promise<UnlockResult>;
    lockVault: () => void;
};

const VaultContext = createContext<VaultContextValue | undefined>(undefined);


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

            await createClientAuditLog("VAULT_UNLOCKED");

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
        setVaultKey(null);
        setIsVaultUnlocked(false);
        setUnlockedAt(null);

        void createClientAuditLog("VAULT_LOCKED");
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