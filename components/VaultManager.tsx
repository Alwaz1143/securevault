"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVault } from "@/contexts/VaultContext";
import {
    decryptVaultData,
    encryptVaultData,
    type VaultPlaintextItem,
} from "@/lib/crypto";

import {
    DEFAULT_PASSWORD_OPTIONS,
    generatePassword,
    type PasswordGeneratorOptions,
} from "@/lib/passwordGenerator";
import { evaluatePasswordStrength } from "@/lib/passwordStrength";

import TotpCode from "@/components/TotpCode";
import { normalizeTotpSecret, validateTotpSecret } from "@/lib/totp";

type EncryptedVaultItem = {
    id: string;
    encryptedData: string;
    iv: string;
    createdAt: string;
    updatedAt: string;
};

type DecryptedVaultListItem = EncryptedVaultItem & VaultPlaintextItem;

type VaultFormState = {
    title: string;
    username: string;
    password: string;
    url: string;
    totpSecret: string;
    notes: string;
    category: string;
};

type VaultSortOption =
    | "updated_desc"
    | "updated_asc"
    | "title_asc"
    | "title_desc";

type VaultRiskFilter = "all" | "weak_passwords" | "missing_urls";

const emptyForm: VaultFormState = {
    title: "",
    username: "",
    password: "",
    url: "",
    totpSecret: "",
    notes: "",
    category: "",
};

function normalizeUrl(url: string) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
        return "";
    }

    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
        return trimmedUrl;
    }

    return `https://${trimmedUrl}`;
}

function getEditItemIdFromUrl() {
    if (typeof window === "undefined") {
        return null;
    }

    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("edit");
}

function updateEditQueryParam(itemId: string) {
    if (typeof window === "undefined") {
        return;
    }

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("edit", itemId);
    window.history.replaceState(null, "", currentUrl.toString());
}

function clearEditQueryParam() {
    if (typeof window === "undefined") {
        return;
    }

    const currentUrl = new URL(window.location.href);

    if (!currentUrl.searchParams.has("edit")) {
        return;
    }

    currentUrl.searchParams.delete("edit");
    window.history.replaceState(null, "", currentUrl.toString());
}

export default function VaultManager() {
    const { isVaultUnlocked, vaultKey } = useVault();

    const [encryptedItems, setEncryptedItems] = useState<EncryptedVaultItem[]>(
        []
    );
    const [decryptedItems, setDecryptedItems] = useState<
        Record<string, VaultPlaintextItem>
    >({});

    const formRef = useRef<HTMLFormElement | null>(null);

    const [form, setForm] = useState<VaultFormState>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [generatorOptions, setGeneratorOptions] =
        useState<PasswordGeneratorOptions>(DEFAULT_PASSWORD_OPTIONS);
    const [isFormPasswordVisible, setIsFormPasswordVisible] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [riskFilter, setRiskFilter] = useState<VaultRiskFilter>("all");
    const [sortOption, setSortOption] =
        useState<VaultSortOption>("updated_desc");

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [formMessage, setFormMessage] = useState("");
    const [listMessage, setListMessage] = useState("");
    const [totpSecretError, setTotpSecretError] = useState("");
    const [decryptWarning, setDecryptWarning] = useState("");
    const [visiblePasswords, setVisiblePasswords] = useState<
        Record<string, boolean>
    >({});

    const decryptedList = useMemo(() => {
        return encryptedItems
            .map((item): DecryptedVaultListItem | null => {
                const decrypted = decryptedItems[item.id];

                if (!decrypted) {
                    return null;
                }

                return {
                    id: item.id,
                    encryptedData: item.encryptedData,
                    iv: item.iv,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    ...decrypted,
                };
            })
            .filter(
                (item): item is DecryptedVaultListItem => item !== null
            );
    }, [encryptedItems, decryptedItems]);

    const categoryOptions = useMemo(() => {
        const categories = decryptedList
            .map((item) => item.category?.trim())
            .filter((category): category is string => Boolean(category));

        return Array.from(new Set(categories)).sort((firstCategory, secondCategory) =>
            firstCategory.localeCompare(secondCategory)
        );
    }, [decryptedList]);

    const filteredDecryptedList = useMemo(() => {
        const normalizedSearchQuery = searchQuery.trim().toLowerCase();

        const filteredItems = decryptedList.filter((item) => {
            const matchesSearch =
                !normalizedSearchQuery ||
                [
                    item.title,
                    item.username,
                    item.url ?? "",
                    item.category ?? "",
                    item.notes ?? "",
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearchQuery);

            const matchesCategory =
                categoryFilter === "all" || item.category === categoryFilter;

            const passwordStrength = evaluatePasswordStrength(item.password);

            const matchesRisk =
                riskFilter === "all" ||
                (riskFilter === "weak_passwords" && passwordStrength.score <= 2) ||
                (riskFilter === "missing_urls" && !item.url?.trim());

            return matchesSearch && matchesCategory && matchesRisk;
        });

        return [...filteredItems].sort((firstItem, secondItem) => {
            if (sortOption === "title_asc") {
                return firstItem.title.localeCompare(secondItem.title);
            }

            if (sortOption === "title_desc") {
                return secondItem.title.localeCompare(firstItem.title);
            }

            if (sortOption === "updated_asc") {
                return (
                    new Date(firstItem.updatedAt).getTime() -
                    new Date(secondItem.updatedAt).getTime()
                );
            }

            return (
                new Date(secondItem.updatedAt).getTime() -
                new Date(firstItem.updatedAt).getTime()
            );
        });
    }, [decryptedList, searchQuery, categoryFilter, riskFilter, sortOption]);

    const formPasswordStrength = useMemo(() => {
        return evaluatePasswordStrength(form.password);
    }, [form.password]);

    useEffect(() => {
        if (!isVaultUnlocked || !vaultKey) {
            setEncryptedItems([]);
            setDecryptedItems({});
            setEditingId(null);
            setForm(emptyForm);
            setTotpSecretError("");
            setError("");
            setFormMessage("");
            setListMessage("");
            setDecryptWarning("");
            return;
        }

        loadAndDecryptVaultItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVaultUnlocked, vaultKey]);

    useEffect(() => {
        if (!isVaultUnlocked) {
            return;
        }

        const editItemId = getEditItemIdFromUrl();

        if (!editItemId || editingId === editItemId) {
            return;
        }

        if (decryptedItems[editItemId]) {
            startEditing(editItemId);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVaultUnlocked, decryptedItems, editingId]);

    async function loadAndDecryptVaultItems() {
        try {
            setIsLoading(true);
            setError("");
            setFormMessage("");
            setListMessage("");
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

            const decryptedMap: Record<string, VaultPlaintextItem> = {};
            let failedDecryptCount = 0;

            for (const item of encryptedVaultItems) {
                try {
                    const decrypted = await decryptVaultData<VaultPlaintextItem>(
                        item.encryptedData,
                        item.iv,
                        vaultKey
                    );

                    decryptedMap[item.id] = decrypted;
                } catch (error) {
                    console.error(`Failed to decrypt vault item ${item.id}:`, error);
                    failedDecryptCount++;
                }
            }

            setEncryptedItems(encryptedVaultItems);
            setDecryptedItems(decryptedMap);

            if (failedDecryptCount > 0) {
                setDecryptWarning(
                    `${failedDecryptCount} vault item(s) could not be decrypted. This usually means they were saved with a different master password or contain old invalid test data.`
                );
            }
        } catch (error) {
            console.error("Failed to load/decrypt vault items:", error);

            setError(
                "Failed to load vault items. Please check your connection and try again."
            );
        } finally {
            setIsLoading(false);
        }
    }

    function updateFormField(field: keyof VaultFormState, value: string) {
        setForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));

        if (field === "totpSecret") {
            setTotpSecretError("");
        }
    }

    function updateGeneratorOption<K extends keyof PasswordGeneratorOptions>(
        key: K,
        value: PasswordGeneratorOptions[K]
    ) {
        setGeneratorOptions((currentOptions) => ({
            ...currentOptions,
            [key]: value,
        }));
    }

    function generatePasswordForForm() {
        try {
            setError("");
            setFormMessage("");
            setListMessage("");

            const password = generatePassword(generatorOptions);

            updateFormField("password", password);
            setIsFormPasswordVisible(true);
            setFormMessage(
                "Strong password generated. Copy it, update the account website, then save this vault item."
            );
        } catch (error) {
            setError(
                error instanceof Error ? error.message : "Failed to generate password."
            );
        }
    }

    async function copyFormPassword() {
        try {
            if (!form.password) {
                setError("No password available to copy.");
                return;
            }

            await navigator.clipboard.writeText(form.password);
            setFormMessage("Password copied to clipboard.");
        } catch {
            setError("Unable to copy password.");
        }
    }

    function validateForm() {
        if (!form.title.trim()) {
            return "Website/App name is required.";
        }

        if (!form.username.trim()) {
            return "Username or email is required.";
        }

        if (!form.password.trim()) {
            return "Password is required.";
        }

        return "";
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setError("");
            setFormMessage("");
            setListMessage("");
            setTotpSecretError("");

            if (!isVaultUnlocked || !vaultKey) {
                setError("Unlock the vault before saving items.");
                return;
            }

            const validationError = validateForm();

            if (validationError) {
                setError(validationError);
                return;
            }

            const totpValidation = validateTotpSecret(form.totpSecret);

            if (!totpValidation.ok) {
                setTotpSecretError(totpValidation.message);
                return;
            }

            setIsSaving(true);

            const plaintextItem: VaultPlaintextItem = {
                title: form.title.trim(),
                username: form.username.trim(),
                password: form.password,
                url: normalizeUrl(form.url),
                totpSecret: form.totpSecret.trim()
                    ? normalizeTotpSecret(form.totpSecret)
                    : "",
                notes: form.notes.trim(),
                category: form.category.trim(),
            };

            const encrypted = await encryptVaultData(plaintextItem, vaultKey);

            const endpoint = editingId ? `/api/vault/${editingId}` : "/api/vault";
            const method = editingId ? "PATCH" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    encryptedData: encrypted.encryptedData,
                    iv: encrypted.iv,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.message || "Failed to save vault item.");
            }

            setEditingId(null);
            setForm(emptyForm);
            setTotpSecretError("");
            setIsFormPasswordVisible(false);
            clearEditQueryParam();

            await loadAndDecryptVaultItems();

            setFormMessage(
                editingId
                    ? "Vault item updated securely."
                    : "Vault item encrypted and saved securely."
            );
        } catch (error) {
            console.error("Failed to save vault item:", error);
            setError("Failed to save vault item. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }
    function startEditing(itemId: string) {
        const item = decryptedItems[itemId];

        if (!item) {
            setError("Unable to edit this item because it is not decrypted.");
            return;
        }

        setEditingId(itemId);

        setForm({
            title: item.title,
            username: item.username,
            password: item.password,
            url: item.url ?? "",
            totpSecret: item.totpSecret ?? "",
            notes: item.notes ?? "",
            category: item.category ?? "",
        });
        setIsFormPasswordVisible(false);
        setFormMessage(
            `Editing ${item.title}. Update the form above, then save changes.`
        );
        setListMessage("");
        setError("");
        updateEditQueryParam(itemId);

        window.setTimeout(() => {
            formRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 0);
    }

    function cancelEditing() {
        setEditingId(null);
        setForm(emptyForm);
        setIsFormPasswordVisible(false);
        clearEditQueryParam();
        setError("");
        setFormMessage("");
        setListMessage("");
        setTotpSecretError("");
    }

    async function handleDelete(itemId: string) {
        try {
            const confirmed = window.confirm(
                "Delete this vault item? This action cannot be undone."
            );

            if (!confirmed) {
                return;
            }

            setError("");
            setFormMessage("");
            setListMessage("");

            const response = await fetch(`/api/vault/${itemId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.message || "Failed to delete vault item.");
            }

            setEncryptedItems((currentItems) =>
                currentItems.filter((item) => item.id !== itemId)
            );

            setDecryptedItems((currentItems) => {
                const updatedItems = { ...currentItems };
                delete updatedItems[itemId];
                return updatedItems;
            });

            setListMessage("Vault item deleted.");
        } catch (error) {
            console.error("Failed to delete vault item:", error);
            setError("Failed to delete vault item. Please try again.");
        }
    }

    async function copyToClipboard(value: string, label: string) {
        try {
            await navigator.clipboard.writeText(value);
            setListMessage(`${label} copied to clipboard.`);
        } catch {
            setError("Unable to copy to clipboard.");
        }
    }

    function togglePasswordVisibility(itemId: string) {
        setVisiblePasswords((current) => ({
            ...current,
            [itemId]: !current[itemId],
        }));
    }
    function clearVaultFilters() {
        setSearchQuery("");
        setCategoryFilter("all");
        setRiskFilter("all");
        setSortOption("updated_desc");
    }

    if (!isVaultUnlocked) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-xl font-semibold">Encrypted Vault Items</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                    Unlock your vault first. Vault items are not fetched or decrypted while
                    the vault is locked.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                        <h3 className="text-xl font-semibold">
                            {editingId ? "Edit Vault Item" : "Add Vault Item"}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            This form encrypts the item in your browser before sending it to
                            the backend. The API receives only ciphertext and IV.
                        </p>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            onClick={cancelEditing}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-red-400 hover:text-red-300"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="title"
                            className="text-sm font-medium text-slate-200"
                        >
                            Website / App Name
                        </label>
                        <input
                            id="title"
                            value={form.title}
                            onChange={(event) => updateFormField("title", event.target.value)}
                            placeholder="Gmail"
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="username"
                            className="text-sm font-medium text-slate-200"
                        >
                            Username / Email
                        </label>
                        <input
                            id="username"
                            value={form.username}
                            onChange={(event) =>
                                updateFormField("username", event.target.value)
                            }
                            placeholder="alwaz@example.com"
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <label className="text-sm font-medium text-slate-300">Password</label>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={generatePasswordForForm}
                                    className="rounded-lg border border-cyan-500/40 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300 hover:text-cyan-200"
                                >
                                    Generate Strong Password
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsFormPasswordVisible((currentValue) => !currentValue)
                                    }
                                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                                >
                                    {isFormPasswordVisible ? "Hide" : "Show"}
                                </button>

                                <button
                                    type="button"
                                    onClick={copyFormPassword}
                                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <input
                            type={isFormPasswordVisible ? "text" : "password"}
                            value={form.password}
                            onChange={(event) => updateFormField("password", event.target.value)}
                            placeholder="Account password"
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        />

                        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-slate-400">Password Strength</p>

                                <p className="text-sm font-semibold text-cyan-300">
                                    {formPasswordStrength.label}
                                </p>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-cyan-400 transition-all"
                                    style={{ width: `${formPasswordStrength.percentage}%` }}
                                />
                            </div>

                            {formPasswordStrength.feedback.length > 0 && (
                                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-500">
                                    {formPasswordStrength.feedback.map((feedbackItem) => (
                                        <li key={feedbackItem}>{feedbackItem}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <details className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                            <summary className="cursor-pointer text-sm font-semibold text-slate-300">
                                Generator Settings
                            </summary>

                            <div className="mt-5 space-y-5">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="vaultPasswordLength"
                                            className="text-sm font-medium text-slate-300"
                                        >
                                            Length
                                        </label>

                                        <span className="text-sm text-cyan-300">
                                            {generatorOptions.length}
                                        </span>
                                    </div>

                                    <input
                                        id="vaultPasswordLength"
                                        type="range"
                                        min={8}
                                        max={40}
                                        value={generatorOptions.length}
                                        onChange={(event) =>
                                            updateGeneratorOption("length", Number(event.target.value))
                                        }
                                        className="mt-3 w-full"
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={generatorOptions.includeUppercase}
                                            onChange={(event) =>
                                                updateGeneratorOption("includeUppercase", event.target.checked)
                                            }
                                        />
                                        Uppercase
                                    </label>

                                    <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={generatorOptions.includeLowercase}
                                            onChange={(event) =>
                                                updateGeneratorOption("includeLowercase", event.target.checked)
                                            }
                                        />
                                        Lowercase
                                    </label>

                                    <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={generatorOptions.includeNumbers}
                                            onChange={(event) =>
                                                updateGeneratorOption("includeNumbers", event.target.checked)
                                            }
                                        />
                                        Numbers
                                    </label>

                                    <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={generatorOptions.includeSymbols}
                                            onChange={(event) =>
                                                updateGeneratorOption("includeSymbols", event.target.checked)
                                            }
                                        />
                                        Symbols
                                    </label>
                                </div>
                            </div>
                        </details>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300">
                            Website URL
                        </label>
                        <input
                            value={form.url}
                            onChange={(event) => updateFormField("url", event.target.value)}
                            placeholder="https://accounts.google.com"
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-300">
                            TOTP Secret / 2FA Setup Key
                        </label>

                        <input
                            value={form.totpSecret}
                            onChange={(event) => updateFormField("totpSecret", event.target.value)}
                            placeholder="JBSWY3DPEHPK3PXP"
                            className={`mt-2 w-full rounded-xl border bg-slate-950 px-4 py-3 font-mono text-slate-100 outline-none transition placeholder:text-slate-600 ${totpSecretError
                                ? "border-red-400 focus:border-red-400"
                                : "border-slate-700 focus:border-cyan-400"
                                }`}
                        />

                        {totpSecretError && (
                            <p className="mt-2 text-xs leading-5 text-red-300">{totpSecretError}</p>
                        )}

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                            Optional. Paste the setup key shown when enabling two-factor authentication on
                            an account. This is different from the 6-digit code. Spaces and hyphens are
                            allowed.
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="category"
                            className="text-sm font-medium text-slate-200"
                        >
                            Category
                        </label>
                        <input
                            id="category"
                            value={form.category}
                            onChange={(event) =>
                                updateFormField("category", event.target.value)
                            }
                            placeholder="Email, Social, Banking"
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label
                            htmlFor="notes"
                            className="text-sm font-medium text-slate-200"
                        >
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            value={form.notes}
                            onChange={(event) => updateFormField("notes", event.target.value)}
                            placeholder="Optional notes"
                            rows={4}
                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        />
                    </div>
                </div>

                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
                {formMessage && (
                    <p className="mt-4 text-sm text-emerald-300">{formMessage}</p>
                )}
                {decryptWarning && (
                    <p className="mt-4 text-sm text-yellow-300">{decryptWarning}</p>
                )}

                <button
                    type="submit"
                    disabled={isSaving}
                    className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving
                        ? "Encrypting..."
                        : editingId
                            ? "Encrypt & Update"
                            : "Encrypt & Save"}
                </button>
            </form>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="text-xl font-semibold">Your Vault Items</h3>
                        <p className="mt-2 text-sm text-slate-400">
                            Items below are decrypted locally only while the vault is
                            unlocked.
                        </p>
                    </div>

                    <button
                        onClick={loadAndDecryptVaultItems}
                        disabled={isLoading}
                        className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div className="grid gap-4 lg:grid-cols-4">
                        <div className="lg:col-span-2">
                            <label className="text-sm font-medium text-slate-300">
                                Search Vault
                            </label>

                            <input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search by title, username, URL, category, or notes"
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">Category</label>

                            <select
                                value={categoryFilter}
                                onChange={(event) => setCategoryFilter(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                            >
                                <option value="all">All Categories</option>

                                {categoryOptions.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-300">Sort</label>

                            <select
                                value={sortOption}
                                onChange={(event) =>
                                    setSortOption(event.target.value as VaultSortOption)
                                }
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
                            >
                                <option value="updated_desc">Recently Updated</option>
                                <option value="updated_asc">Oldest Updated</option>
                                <option value="title_asc">Title A-Z</option>
                                <option value="title_desc">Title Z-A</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setRiskFilter("all")}
                                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${riskFilter === "all"
                                    ? "border-cyan-400 bg-cyan-400 text-slate-950"
                                    : "border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                                    }`}
                            >
                                All Items
                            </button>

                            <button
                                type="button"
                                onClick={() => setRiskFilter("weak_passwords")}
                                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${riskFilter === "weak_passwords"
                                    ? "border-yellow-400 bg-yellow-400 text-slate-950"
                                    : "border-slate-700 text-slate-300 hover:border-yellow-400 hover:text-yellow-300"
                                    }`}
                            >
                                Weak Passwords
                            </button>

                            <button
                                type="button"
                                onClick={() => setRiskFilter("missing_urls")}
                                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${riskFilter === "missing_urls"
                                    ? "border-orange-400 bg-orange-400 text-slate-950"
                                    : "border-slate-700 text-slate-300 hover:border-orange-400 hover:text-orange-300"
                                    }`}
                            >
                                Missing URLs
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={clearVaultFilters}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-red-400 hover:text-red-300"
                        >
                            Clear Filters
                        </button>
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                        Showing {filteredDecryptedList.length} of {decryptedList.length} vault item
                        {decryptedList.length === 1 ? "" : "s"}.
                    </p>
                </div>
                {listMessage && (
                    <p className="mt-4 text-sm text-emerald-300">{listMessage}</p>
                )}
                {isLoading && (
                    <p className="mt-6 text-sm text-slate-400">
                        Loading and decrypting vault items...
                    </p>
                )}

                {!isLoading && decryptedList.length === 0 && (
                    <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                        <p className="text-slate-300">No vault items yet.</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Add your first item above. Only encrypted data will be stored.
                        </p>
                    </div>
                )}

                {!isLoading &&
                    decryptedList.length > 0 &&
                    filteredDecryptedList.length === 0 && (
                        <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                            <p className="text-slate-300">No items match your filters.</p>

                            <p className="mt-2 text-sm text-slate-500">
                                Try changing your search, category, risk filter, or sort settings.
                            </p>

                            <button
                                type="button"
                                onClick={clearVaultFilters}
                                className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}

                <div className="mt-6 grid gap-4">
                    {filteredDecryptedList.map((item) => {
                        if (!item) {
                            return null;
                        }

                        const isPasswordVisible = visiblePasswords[item.id];

                        return (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                            >
                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h4 className="text-lg font-semibold text-slate-100">
                                                {item.title}
                                            </h4>

                                            {item.category && (
                                                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                                                    {item.category}
                                                </span>
                                            )}
                                            {item.totpSecret && (
                                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                                                    2FA
                                                </span>
                                            )}
                                            {evaluatePasswordStrength(item.password).score <= 2 && (
                                                <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                                                    Weak Password
                                                </span>
                                            )}

                                            {!item.url?.trim() && (
                                                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs text-orange-300">
                                                    Missing URL
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-2 text-sm text-slate-400">
                                            Username: {item.username}
                                        </p>

                                        <p className="mt-2 text-sm text-slate-400">
                                            Password:{" "}
                                            <span className="font-mono text-slate-200">
                                                {isPasswordVisible
                                                    ? item.password
                                                    : "•".repeat(Math.min(item.password.length, 16))}
                                            </span>
                                        </p>

                                        {item.url && (
                                            <p className="mt-2 text-sm text-slate-400">
                                                URL:{" "}
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-cyan-300 underline-offset-4 hover:underline"
                                                >
                                                    {item.url}
                                                </a>
                                            </p>
                                        )}
                                        {item.totpSecret && <TotpCode secret={item.totpSecret} />}
                                        {item.notes && (
                                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                                Notes: {item.notes}
                                            </p>
                                        )}

                                        <p className="mt-4 text-xs text-slate-600">
                                            Updated: {new Date(item.updatedAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {item.url && (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-emerald-400 hover:text-emerald-300"
                                            >
                                                Open Site
                                            </a>
                                        )}
                                        <button
                                            onClick={() => togglePasswordVisibility(item.id)}
                                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                                        >
                                            {isPasswordVisible ? "Hide" : "Show"}
                                        </button>

                                        <button
                                            onClick={() =>
                                                copyToClipboard(item.username, "Username")
                                            }
                                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                                        >
                                            Copy User
                                        </button>

                                        <button
                                            onClick={() =>
                                                copyToClipboard(item.password, "Password")
                                            }
                                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                                        >
                                            Copy Pass
                                        </button>

                                        <button
                                            onClick={() => startEditing(item.id)}
                                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-yellow-400 hover:text-yellow-300"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-red-400 hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <details className="mt-5">
                                    <summary className="cursor-pointer text-xs text-slate-500">
                                        Show stored encrypted record
                                    </summary>

                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400">IV</p>
                                            <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-500">
                                                {item.iv}
                                            </pre>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-slate-400">
                                                Ciphertext
                                            </p>
                                            <pre className="mt-1 max-h-32 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-500">
                                                {item.encryptedData}
                                            </pre>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}