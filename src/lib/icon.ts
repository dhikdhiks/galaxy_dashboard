import { ICON_CHOICES } from "@/components/icons";
import { ValidationError } from "./types";

/** Uploaded icons are inlined as data URLs, so cap them tightly. */
export const MAX_ICON_BYTES = 1024 * 1024; // 1 MB

const ALLOWED_ICON_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

/**
 * Normalizes the icon field coming from a form. A `File` is validated
 * and inlined as a base64 data URL; a string must either be a
 * whitelisted identifier or an existing data URL (so edits preserve the
 * current image). Empty values fall back to the default icon (null).
 */
export async function normalizeIconInput(
  value: string | File | null | undefined,
): Promise<string | null> {
  if (value instanceof File) {
    // An untouched file input can arrive as a zero-byte File.
    if (value.size === 0) return null;
    if (!ALLOWED_ICON_TYPES.has(value.type)) {
      throw new ValidationError(
        "Icon must be a PNG, JPEG, WebP, GIF, or SVG image (max 1 MB).",
      );
    }
    if (value.size > MAX_ICON_BYTES) {
      throw new ValidationError("Icon must be 1 MB or smaller.");
    }
    const bytes = Buffer.from(await value.arrayBuffer());
    return `data:${value.type};base64,${bytes.toString("base64")}`;
  }

  const raw = (value ?? "").trim();
  if (!raw) return null;
  // Keep an existing uploaded image across edits.
  if (raw.startsWith("data:image/")) return raw;
  const identifier = raw.toLowerCase();
  if (!ICON_CHOICES.includes(identifier)) {
    throw new ValidationError(`Unknown icon: ${raw}`);
  }
  return identifier;
}
