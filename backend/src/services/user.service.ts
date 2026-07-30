import zxcvbn from "zxcvbn";
import { userRepository } from "../repositories/user.repository";
import { UpdateProfileInput } from "../dtos/user.dto";
import { toSafeUser } from "./auth.service";
import { hashPassword, verifyPassword } from "../utils/hash";
import { isPasswordBreached } from "../utils/hibp";
import { AppError } from "../utils/appError";

const MIN_PASSWORD_SCORE = 2;

async function getProfile(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return toSafeUser(user);
}

async function updateProfile(userId: string, dto: UpdateProfileInput) {
  const user = await userRepository.updateById(userId, dto);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return toSafeUser(user);
}

async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (!user.passwordHash) {
    throw new AppError("Google-only accounts cannot change a password", 400);
  }

  const matches = await verifyPassword(user.passwordHash, currentPassword);
  if (!matches) {
    throw new AppError("Current password is incorrect", 401);
  }

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

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}

export const userService = { getProfile, updateProfile, changePassword };
