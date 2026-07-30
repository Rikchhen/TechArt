import { Types } from "mongoose";

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export type PaymentStatus =
  | "unpaid"
  | "initiated"
  | "paid"
  | "failed"
  | "refunded";

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  priceAtPurchase: number;
  quantity: number;
}

export interface IPayment {
  provider: "khalti" | "none";
  status: PaymentStatus;
  pidx?: string;
  transactionId?: string;
  amountPaisa?: number;
}

export interface IOrder {
  userId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  payment: IPayment;
}
