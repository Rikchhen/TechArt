import { z } from "zod";

export const CreateOrderDto = z
  .object({
    items: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1),
            quantity: z.number().int().positive(),
          })
          .strict()
      )
      .min(1),
  })
  .strict();

export const UpdateOrderStatusDto = z
  .object({
    status: z.enum(["pending", "paid", "shipped", "cancelled"]),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof CreateOrderDto>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusDto>;
