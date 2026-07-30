import { z } from "zod";

export const UpdateProfileDto = z
  .object({
    name: z.string().trim().min(1).max(100),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;
