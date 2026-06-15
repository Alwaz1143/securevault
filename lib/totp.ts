const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function normalizeTotpSecret(secret: string) {
  return secret
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/=/g, "")
    .toUpperCase();
}

function base32ToBytes(secret: string) {
  const normalizedSecret = normalizeTotpSecret(secret);

  if (!normalizedSecret) {
    throw new Error("TOTP secret is empty.");
  }

  let bits = "";

  for (const character of normalizedSecret) {
    const value = BASE32_ALPHABET.indexOf(character);

    if (value === -1) {
      throw new Error("TOTP secret contains invalid Base32 characters.");
    }

    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

function counterToBytes(counter: number) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;

  view.setUint32(0, high, false);
  view.setUint32(4, low, false);

  return buffer;
}

export function getTotpRemainingSeconds(period = 30) {
  const currentUnixSeconds = Math.floor(Date.now() / 1000);
  const remaining = period - (currentUnixSeconds % period);

  return remaining === 0 ? period : remaining;
}

export async function generateTotpCode({
  secret,
  period = 30,
  digits = 6,
}: {
  secret: string;
  period?: number;
  digits?: number;
}) {
  const keyBytes = base32ToBytes(secret);
  const currentUnixSeconds = Math.floor(Date.now() / 1000);
  const counter = Math.floor(currentUnixSeconds / period);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    {
      name: "HMAC",
      hash: "SHA-1",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    counterToBytes(counter)
  );

  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 10 ** digits;

  return otp.toString().padStart(digits, "0");
}

export function validateTotpSecret(secret: string) {
  const trimmedSecret = secret.trim();

  if (!trimmedSecret) {
    return {
      ok: true,
      message: "",
    };
  }

  try {
    const decodedBytes = base32ToBytes(trimmedSecret);

    if (decodedBytes.length < 10) {
      return {
        ok: false,
        message:
          "TOTP secret looks too short. Paste the full setup key from the account.",
      };
    }

    return {
      ok: true,
      message: "",
    };
  } catch {
    return {
      ok: false,
      message:
        "Invalid TOTP secret. Use the Base32 setup key shown by the account, not the 6-digit code.",
    };
  }
}