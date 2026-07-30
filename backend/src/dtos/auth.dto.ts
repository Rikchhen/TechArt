import { z } from "zod";

export const RegisterDto = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8),
    recaptchaToken: z.string().min(1).optional(),
  })
  .strict();

export const LoginDto = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
    recaptchaToken: z.string().min(1).optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof RegisterDto>;
export type LoginInput = z.infer<typeof LoginDto>;
