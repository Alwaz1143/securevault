"use client";

export type EncryptedPayload = {
  encryptedData: string;
  iv: string;
};

export type VaultPlaintextItem = {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
};

const PBKDF2_ITERATIONS = 210_000;

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export function generateSaltBase64() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToBase64(salt);
}

export function generateIvBase64() {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return arrayBufferToBase64(iv);
}

export async function deriveVaultKey(
  masterPassword: string,
  saltBase64: string
) {
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = base64ToUint8Array(saltBase64);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptVaultData<T>(
  data: T,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const ivBase64 = generateIvBase64();
  const iv = base64ToUint8Array(ivBase64);

  const plaintext = JSON.stringify(data);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(plaintext)
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: ivBase64,
  };
}

export async function decryptVaultData<T>(
  encryptedData: string,
  iv: string,
  key: CryptoKey
): Promise<T> {
  const decoder = new TextDecoder();

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToUint8Array(iv),
    },
    key,
    base64ToUint8Array(encryptedData)
  );

  const decryptedText = decoder.decode(decryptedBuffer);

  return JSON.parse(decryptedText) as T;
}