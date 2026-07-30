import crypto from "crypto";
import { logger } from "./logger";

/*
  Checks a password against the HaveIBeenPwned breached-password corpus using
  k-anonymity: only the first 5 chars of the SHA-1 hash leave this server, and we
  match the suffix locally. The full password/hash is never transmitted.

  Fails OPEN — if the API is unreachable we allow the password rather than block
  sign-ups, since this is a defense-in-depth check on top of the strength meter.
*/
export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = crypto
      .createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;

    const body = await res.text();
    for (const line of body.split("\n")) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix && Number(count) > 0) {
        return true;
      }
    }
    return false;
  } catch (err) {
    logger.warn("HIBP breach check unavailable; allowing password", {
      error: (err as Error).message,
    });
    return false;
  }
}
