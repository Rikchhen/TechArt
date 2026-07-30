export type ProductCategory = "mobile" | "laptop" | "accessory" | "other";

export interface IProduct {
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stock: number;
  imageUrl?: string;
}
