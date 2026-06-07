export type BreachCheckResult = {
  isPwned: boolean;
  breachCount: number;
  hashPrefix: string;
};

function arrayBufferToHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function sha1Hash(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest("SHA-1", data);

  return arrayBufferToHex(hashBuffer);
}

export async function checkPasswordBreach(
  password: string
): Promise<BreachCheckResult> {
  if (!password) {
    throw new Error("Password is required.");
  }

  const fullHash = await sha1Hash(password);

  const hashPrefix = fullHash.slice(0, 5);
  const hashSuffix = fullHash.slice(5);

  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${hashPrefix}`,
    {
      method: "GET",
      headers: {
        "Add-Padding": "true",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to check password breach status.");
  }

  const responseText = await response.text();

  const lines = responseText.split("\r\n");

  for (const line of lines) {
    const [returnedSuffix, countText] = line.split(":");

    if (!returnedSuffix || !countText) {
      continue;
    }

    if (returnedSuffix.toUpperCase() === hashSuffix) {
      const breachCount = Number(countText);

      return {
        isPwned: breachCount > 0,
        breachCount,
        hashPrefix,
      };
    }
  }

  return {
    isPwned: false,
    breachCount: 0,
    hashPrefix,
  };
}