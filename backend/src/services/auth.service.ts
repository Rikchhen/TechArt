import { HydratedDocument } from "mongoose";
import zxcvbn from "zxcvbn";
import { userRepository } from "../repositories/user.repository";
import { hashPassword, verifyPassword } from "../utils/hash";
import { RegisterInput, LoginInput } from "../dtos/auth.dto";
import { IUser, SafeUser } from "../types/user.types";
import { AppError } from "../utils/appError";
import { logger } from "../utils/logger";
import { isPasswordBreached } from "../utils/hibp";
import {
  assertNotLocked,
  recordFailure,
  resetAttempts,
} from "../utils/loginAttempts";

// Reject passwords a strength estimator rates below "fair". zxcvbn also factors
// in obvious user-specific inputs (name/email) so those can't be reused as the
// password. 0 very weak · 1 weak · 2 fair · 3 good · 4 strong.
const MIN_PASSWORD_SCORE = 2;

export function toSafeUser(user: HydratedDocument<IUser>): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified ?? false,
    twoFactorEnabled: user.twoFactorEnabled ?? false,
  };
}

async function register(dto: RegisterInput): Promise<SafeUser> {
  const { score, feedback } = zxcvbn(dto.password, [dto.name, dto.email]);
  if (score < MIN_PASSWORD_SCORE) {
    throw new AppError(
      feedback.warning ||
        "Password is too weak. Use a longer, less predictable password.",
      400
    );
  }

  if (await isPasswordBreached(dto.password)) {
    throw new AppError(
      "This password has appeared in a known data breach. Please choose a different one.",
      400
    );
  }

  const existing = await userRepository.findByEmail(dto.email);
  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await hashPassword(dto.password);
  const user = await userRepository.create({
    name: dto.name,
    email: dto.email,
    passwordHash,
    role: "customer",
  });

  logger.info("New account registered", { email: dto.email });
  return toSafeUser(user);
}

async function login(dto: LoginInput): Promise<SafeUser> {
  assertNotLocked(dto.email);

  const user = await userRepository.findByEmail(dto.email, true);
  if (!user) {
    recordFailure(dto.email);
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.passwordHash) {
    throw new AppError("This account uses Google sign-in", 400);
  }
  const passwordMatches = await verifyPassword(user.passwordHash, dto.password);
  if (!passwordMatches) {
    recordFailure(dto.email);
    throw new AppError("Invalid email or password", 401);
  }

  resetAttempts(dto.email);
  return toSafeUser(user);
}

export type GoogleProfile = { id: string; email: string; name: string };

async function loginWithGoogle(profile: GoogleProfile): Promise<SafeUser> {
  let user = await userRepository.findByGoogleId(profile.id);
  if (!user) {
    user = await userRepository.findByEmail(profile.email);
    if (user) {
      user = await userRepository.updateById(user._id.toString(), {
        googleId: profile.id,
        emailVerified: true,
      });
    } else {
      user = await userRepository.create({
        name: profile.name,
        email: profile.email,
        googleId: profile.id,
        emailVerified: true,
        role: "customer",
      });
    }
  }
  if (!user) throw new AppError("Could not create Google account", 500);
  return toSafeUser(user);
}

export const authService = { register, login, loginWithGoogle };
