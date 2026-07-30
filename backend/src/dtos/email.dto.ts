import { z } from "zod";

export const EmailOnlyDto = z
  .object({
    email: z.string().trim().toLowerCase().email(),
  })
  .strict();

export const VerifyTokenDto = z
  .object({
    token: z.string().trim().min(16),
  })
  .strict();

export const VerifyCodeDto = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  })
  .strict();

export const ResetPasswordDto = z
  .object({
    token: z.string().trim().min(16),
    newPassword: z.string().min(8),
  })
  .strict();
