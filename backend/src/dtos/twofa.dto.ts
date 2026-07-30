import { z } from "zod";

// Accepts a 6-digit TOTP code or a formatted backup code (e.g. "ABCD-1234").
export const TwoFactorCodeDto = z
  .object({
    code: z.string().trim().min(6).max(20),
  })
  .strict();

export const DisableTwoFactorDto = z
  .object({
    password: z.string().min(1),
  })
  .strict();

export type TwoFactorCodeInput = z.infer<typeof TwoFactorCodeDto>;
export type DisableTwoFactorInput = z.infer<typeof DisableTwoFactorDto>;
