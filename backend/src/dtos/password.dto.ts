import { z } from "zod";

export const ChangePasswordDto = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  })
  .strict();

export type ChangePasswordInput = z.infer<typeof ChangePasswordDto>;
