import { Schema, model } from "mongoose";
import { IOrder } from "../types/order.types";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    priceAtPurchase: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["khalti", "none"],
      default: "none",
    },
    status: {
      type: String,
      enum: ["unpaid", "initiated", "paid", "failed", "refunded"],
      default: "unpaid",
    },
    pidx: { type: String },
    transactionId: { type: String },
    amountPaisa: { type: Number },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "cancelled"],
      default: "pending",
    },
    payment: {
      type: paymentSchema,
      default: () => ({ provider: "none", status: "unpaid" }),
    },
  },
  { timestamps: true }
);

// A Khalti payment session can belong to only one order. `sparse` permits the
// normal no-payment orders, whose embedded payment has no pidx.
orderSchema.index({ "payment.pidx": 1 }, { unique: true, sparse: true });

export const OrderModel = model<IOrder>("Order", orderSchema);
