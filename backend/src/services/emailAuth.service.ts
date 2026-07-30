import zxcvbn from "zxcvbn";
import { userRepository } from "../repositories/user.repository";
import {
  issueToken,
  consumeToken,
  consumeCode,
  peekToken,
} from "./token.service";
import {
  sendMail,
  verificationEmail,
  passwordResetEmail,
  securityAlertEmail,
} from "./mailer.service";
import { sessionService } from "./session.service";
import { hashPassword } from "../utils/hash";
import { isPasswordBreached } from "../utils/hibp";
import { AppError } from "../utils/appError";
import { logger } from "../utils/logger";
import { env } from "../config/env";

const MIN_PASSWORD_SCORE = 2;

/** Issues a verification token/OTP and emails it. Safe to call repeatedly. */
async function sendVerification(userId: string): Promise<void> {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.emailVerified) {
    throw new AppError("Email is already verified", 409);
  }

  const { token, code } = await issueToken(userId, "email_verify");
  const link = `${env.APP_URL}/verify-email?token=${token}`;
  const mail = verificationEmail(user.name, link, code);
  await sendMail({ to: user.email, ...mail });
  logger.info("Verification email queued", { userId });
}

/** Verifies via the emailed link token. */
async function verifyByToken(token: string): Promise<void> {
  const userId = await consumeToken(token, "email_verify");
  if (!userId) {
    throw new AppError("This verification link is invalid or has expired", 400);
  }
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  user.emailVerified = true;
  await user.save();
  logger.info("Email verified via link", { userId });
}

/** Verifies via the 6-digit OTP from the email. */
async function verifyByCode(email: string, code: string): Promise<void> {
  const user = await userRepository.findByEmail(email.toLowerCase());
  // Generic error either way — don't reveal whether the address exists.
  if (!user) throw new AppError("Invalid or expired code", 400);

  const ok = await consumeCode(user._id.toString(), code, "email_verify");
  if (!ok) throw new AppError("Invalid or expired code", 400);

  user.emailVerified = true;
  await user.save();
  logger.info("Email verified via code", { userId: user._id.toString() });
}

/**
 * Starts a password reset. Always resolves without indicating whether the
 * address exists, so this endpoint can't be used to enumerate accounts.
 */
async function requestPasswordReset(email: string): Promise<void> {
  const user = await userRepository.findByEmail(email.toLowerCase());
  if (!user) {
    logger.info("Password reset requested for unknown address (ignored)");
    return;
  }

  const { token } = await issueToken(user._id.toString(), "password_reset");
  const link = `${env.APP_URL}/reset-password?token=${token}`;
  const mail = passwordResetEmail(user.name, link);
  await sendMail({ to: user.email, ...mail });
  logger.info("Password reset email queued", { userId: user._id.toString() });
}

/** Completes a password reset and signs the account out everywhere. */
async function resetPassword(token: string, newPassword: string): Promise<void> {
  // Validate everything BEFORE consuming, so a rejected password doesn't
  // invalidate the user's one-time link.
  const peekedId = await peekToken(token, "password_reset");
  if (!peekedId) {
    throw new AppError("This reset link is invalid or has expired", 400);
  }

  const user = await userRepository.findById(peekedId);
  if (!user) throw new AppError("User not found", 404);

  const { score, feedback } = zxcvbn(newPassword, [user.name, user.email]);
  if (score < MIN_PASSWORD_SCORE) {
    throw new AppError(
      feedback.warning ||
        "Password is too weak. Use a longer, less predictable password.",
      400
    );
  }
  if (await isPasswordBreached(newPassword)) {
    throw new AppError(
      "This password has appeared in a known data breach. Please choose a different one.",
      400
    );
  }

  // Only now burn the token (also closes the race between peek and use).
  const userId = await consumeToken(token, "password_reset");
  if (!userId) {
    throw new AppError("This reset link is invalid or has expired", 400);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // A reset implies the old password may be compromised — kill every session.
  const revoked = await sessionService.revokeAll(userId);
  logger.info("Password reset completed", { userId, revokedSessions: revoked });

  const alert = securityAlertEmail(user.name, "your password was reset", new Date());
  await sendMail({ to: user.email, ...alert });
}

/** Fire-and-forget security notification. */
async function notify(userId: string, action: string): Promise<void> {
  const user = await userRepository.findById(userId);
  if (!user) return;
  const mail = securityAlertEmail(user.name, action, new Date());
  await sendMail({ to: user.email, ...mail });
}

export const emailAuthService = {
  sendVerification,
  verifyByToken,
  verifyByCode,
  requestPasswordReset,
  resetPassword,
  notify,
};
