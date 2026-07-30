import { z } from "zod";

const categoryEnum = z.enum(["mobile", "laptop", "accessory", "other"]);

// Either an absolute URL (external image) or a relative path produced by our
// own upload endpoint, e.g. "/uploads/9f3c….jpg". The strict pattern prevents
// arbitrary relative paths from being stored.
const imageUrlSchema = z.union([
  z.string().url(),
  z.string().regex(/^\/uploads\/[A-Za-z0-9._-]+$/, "Invalid image path"),
]);

const productShape = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1),
  category: categoryEnum,
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  imageUrl: imageUrlSchema.optional(),
};

export const CreateProductDto = z.object(productShape).strict();

export const UpdateProductDto = z.object(productShape).partial().strict();

export type CreateProductInput = z.infer<typeof CreateProductDto>;
export type UpdateProductInput = z.infer<typeof UpdateProductDto>;
