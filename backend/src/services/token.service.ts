import crypto from "crypto";
import { Types } from "mongoose";
import { TokenModel, TokenType } from "../models/token.model";

/*
  Single-use, expiring tokens for email verification and password reset.

  - The raw token/OTP is returned once (to email) and never stored; only SHA-256
    hashes live in the DB, so a dump can't be replayed.
  - Issuing a new token invalidates the previous ones of the same type.
  - OTP attempts are capped to stop brute-forcing a 6-digit code.
*/
const TTL_MINUTES = 30;
const MAX_OTP_ATTEMPTS = 5;

const sha256 = (v: string) =>
  crypto.createHash("sha256").update(v).digest("hex");

export interface IssuedToken {
  token: string;
  code: string;
}

/** Creates a fresh token (+ 6-digit OTP), invalidating older ones of this type. */
export async function issueToken(
  userId: string,
  type: TokenType
): Promise<IssuedToken> {
  await TokenModel.deleteMany({ userId: new Types.ObjectId(userId), type });

  const token = crypto.randomBytes(32).toString("hex");
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

  await TokenModel.create({
    userId: new Types.ObjectId(userId),
    type,
    tokenHash: sha256(token),
    codeHash: sha256(code),
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
    attempts: 0,
  });

  return { token, code };
}

/**
 * Checks a token WITHOUT consuming it. Use this to validate other input first,
 * so a rejected request (e.g. a too-weak password) doesn't burn the user's
 * one-time link and force them to request a new email.
 */
export async function peekToken(
  token: string,
  type: TokenType
): Promise<string | null> {
  const doc = await TokenModel.findOne({ tokenHash: sha256(token), type });
  if (!doc || doc.usedAt || doc.expiresAt.getTime() < Date.now()) return null;
  return doc.userId.toString();
}

/** Consumes a link token. Returns the userId, or null if invalid/expired/used. */
export async function consumeToken(
  token: string,
  type: TokenType
): Promise<string | null> {
  const doc = await TokenModel.findOne({ tokenHash: sha256(token), type });
  if (!doc || doc.usedAt || doc.expiresAt.getTime() < Date.now()) return null;

  doc.usedAt = new Date();
  await doc.save();
  return doc.userId.toString();
}

/** Consumes a 6-digit OTP for a given user. Returns true on success. */
export async function consumeCode(
  userId: string,
  code: string,
  type: TokenType
): Promise<boolean> {
  const doc = await TokenModel.findOne({
    userId: new Types.ObjectId(userId),
    type,
  });
  if (!doc || doc.usedAt || doc.expiresAt.getTime() < Date.now()) return false;

  if (doc.attempts >= MAX_OTP_ATTEMPTS) return false;

  if (doc.codeHash !== sha256(code)) {
    doc.attempts += 1;
    await doc.save();
    return false;
  }

  doc.usedAt = new Date();
  await doc.save();
  return true;
}

export const TOKEN_TTL_MINUTES = TTL_MINUTES;
