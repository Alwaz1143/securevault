const DEFAULT_CLEAR_AFTER_MS = 30_000;

export async function copyTextToClipboard(value: string) {
  if (!navigator.clipboard) {
    throw new Error("Clipboard API is not available.");
  }

  await navigator.clipboard.writeText(value);
}

export async function copySensitiveTextToClipboard(
  value: string,
  clearAfterMs = DEFAULT_CLEAR_AFTER_MS
) {
  if (!navigator.clipboard) {
    throw new Error("Clipboard API is not available.");
  }

  await navigator.clipboard.writeText(value);

  window.setTimeout(async () => {
    try {
      const currentClipboardValue = await navigator.clipboard.readText();

      if (currentClipboardValue === value) {
        await navigator.clipboard.writeText("");
      }
    } catch {
      /*
        Some browsers deny clipboard read access when the page is not focused
        or when explicit read permission is not granted.

        Copy still worked. Auto-clear is a best-effort security feature.
        We intentionally ignore this failure to avoid noisy console errors.
      */
    }
  }, clearAfterMs);
}