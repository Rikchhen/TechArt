import { z } from "zod";

// The server derives the amount and callback URL from the stored order and
// configuration. The client is allowed to supply only the order identifier.
export const InitiatePaymentDto = z
  .object({
    orderId: z.string().trim().min(1, "Order ID is required"),
  })
  .strict();

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentDto>;

export const VerifyPaymentDto = z
  .object({
    pidx: z.string().trim().min(1, "PIDX is required"),
  })
  .strict();

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentDto>;
