import crypto from "crypto";

/*
  One-time backup codes for 2FA recovery. Codes are high-entropy random values,
  so a fast SHA-256 hash is sufficient (unlike low-entropy passwords, which need
  argon2). We store only the hashes; the plaintext is shown to the user once.
*/
const CODE_COUNT = 10;

export interface StoredBackupCode {
  hash: string;
  used: boolean;
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/** Returns the plaintext codes (to show once) and the hashed records (to store). */
export function generateBackupCodes(): {
  plain: string[];
  stored: StoredBackupCode[];
} {
  const plain: string[] = [];
  for (let i = 0; i < CODE_COUNT; i++) {
    // 8 hex chars, grouped like ABCD-1234 for readability.
    const raw = crypto.randomBytes(4).toString("hex");
    plain.push(`${raw.slice(0, 4)}-${raw.slice(4)}`.toUpperCase());
  }
  const stored = plain.map((code) => ({
    hash: hashCode(code.toLowerCase().replace(/-/g, "")),
    used: false,
  }));
  return { plain, stored };
}

/**
 * If `input` matches an unused code, returns its index (to mark used);
 * otherwise -1. Comparison is normalised (case/dashes ignored).
 */
export function matchBackupCode(
  input: string,
  codes: StoredBackupCode[]
): number {
  const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = hashCode(normalized);
  return codes.findIndex(
    (c) => !c.used && crypto.timingSafeEqual(Buffer.from(c.hash), Buffer.from(target))
  );
}
