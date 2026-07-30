import { authenticator } from "otplib";
import QRCode from "qrcode";
import { userRepository } from "../repositories/user.repository";
import { encryptSecret, decryptSecret } from "../utils/crypto2fa";
import { generateBackupCodes, matchBackupCode } from "../utils/backupCodes";
import { verifyPassword } from "../utils/hash";
import { AppError } from "../utils/appError";

// Allow one 30s step of clock drift either side.
authenticator.options = { window: 1 };

const ISSUER = "TechArt";

/**
 * Begin enrollment: generate a fresh secret, store it (encrypted, still disabled),
 * and return a QR code + manual-entry secret for the authenticator app.
 */
async function setup(userId: string) {
  const user = await userRepository.findByIdWithSecret(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.twoFactorEnabled) {
    throw new AppError("Two-factor authentication is already enabled", 409);
  }

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, ISSUER, secret);
  const qr = await QRCode.toDataURL(otpauthUrl);

  user.twoFactorSecret = encryptSecret(secret);
  user.twoFactorEnabled = false;
  await user.save();

  return { qr, secret, otpauthUrl };
}

/** Confirm a code against the pending secret, enable 2FA, and issue backup codes. */
async function enable(userId: string, code: string) {
  const user = await userRepository.findByIdWithSecret(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.twoFactorEnabled) {
    throw new AppError("Two-factor authentication is already enabled", 409);
  }
  if (!user.twoFactorSecret) {
    throw new AppError("Start setup before enabling two-factor", 400);
  }

  const secret = decryptSecret(user.twoFactorSecret);
  if (!authenticator.check(code, secret)) {
    throw new AppError("Invalid authentication code", 400);
  }

  const { plain, stored } = generateBackupCodes();
  user.twoFactorEnabled = true;
  user.backupCodes = stored;
  await user.save();

  return { backupCodes: plain };
}

/** Disable 2FA after re-authenticating with the account password. */
async function disable(userId: string, password: string) {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) throw new AppError("User not found", 404);
  if (!user.passwordHash) {
    throw new AppError("Google-only accounts cannot use password re-authentication", 400);
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw new AppError("Incorrect password", 401);

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.backupCodes = undefined;
  await user.save();
}

/**
 * Verify a login challenge: accept either a valid TOTP code or an unused backup
 * code (which is then consumed). Returns true on success.
 */
async function verifyForLogin(userId: string, code: string): Promise<boolean> {
  const user = await userRepository.findByIdWithSecret(userId);
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return false;

  const secret = decryptSecret(user.twoFactorSecret);
  if (authenticator.check(code, secret)) return true;

  // Fall back to a one-time backup code.
  const codes = user.backupCodes ?? [];
  const idx = matchBackupCode(code, codes);
  if (idx >= 0) {
    codes[idx].used = true;
    user.backupCodes = codes;
    user.markModified("backupCodes");
    await user.save();
    return true;
  }

  return false;
}

export const twoFactorService = { setup, enable, disable, verifyForLogin };
