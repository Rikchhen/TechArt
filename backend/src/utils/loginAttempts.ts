import { AppError } from "./appError";
import { logger } from "./logger";

/*
  Per-account failed-login lockout (in addition to per-IP rate limiting).

  In-memory store: simple and dependency-free, but resets on restart and is
  per-process — for a multi-instance deployment back this with Redis/Mongo.

  Note: account lockout can be abused to lock a known victim's account; the short
  window plus IP rate limiting keeps that impact bounded.
*/
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

interface Entry {
  count: number;
  lockUntil: number;
}

const attempts = new Map<string, Entry>();

export function assertNotLocked(email: string): void {
  const entry = attempts.get(email);
  if (entry && entry.lockUntil > Date.now()) {
    throw new AppError(
      "Account temporarily locked due to repeated failed logins. Try again later.",
      429
    );
  }
}

export function recordFailure(email: string): void {
  const now = Date.now();
  const entry = attempts.get(email) ?? { count: 0, lockUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILURES) {
    entry.lockUntil = now + LOCK_MS;
    entry.count = 0;
    logger.warn("Account locked after repeated failed logins", { email });
  }
  attempts.set(email, entry);
}

export function resetAttempts(email: string): void {
  attempts.delete(email);
}
