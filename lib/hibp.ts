import crypto from "crypto";

/**
 * Checks a password against the HaveIBeenPwned Passwords API
 * using the k-Anonymity model (only the first 5 chars of the SHA1 hash are sent).
 * Returns the number of times the password appeared in breaches (0 = not found).
 */
export async function checkPasswordBreach(password: string): Promise<number> {
  const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
  });

  if (!res.ok) {
    throw new Error(`HIBP API error: ${res.status}`);
  }

  const text = await res.text();
  const lines = text.split("\n");

  for (const line of lines) {
    const [hash, count] = line.trim().split(":");
    if (hash === suffix) {
      return parseInt(count, 10);
    }
  }

  return 0;
}
