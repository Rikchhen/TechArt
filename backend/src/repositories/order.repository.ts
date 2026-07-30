import { OrderModel } from "../models/order.model";
import { IOrder, IPayment, OrderStatus } from "../types/order.types";

type CreateOrderData = Pick<IOrder, "userId" | "items" | "totalAmount">;

export const orderRepository = {
  create(data: CreateOrderData) {
    return OrderModel.create(data);
  },

  findByUser(userId: string) {
    return OrderModel.find({ userId }).sort({ createdAt: -1 });
  },

  findById(id: string) {
    return OrderModel.findById(id);
  },

  findOwnedById(id: string, userId: string) {
    return OrderModel.findOne({ _id: id, userId });
  },

  findOwnedByPaymentPidx(pidx: string, userId: string) {
    return OrderModel.findOne({ "payment.pidx": pidx, userId });
  },

  updatePayment(id: string, payment: IPayment, orderStatus?: OrderStatus) {
    const update: Record<string, unknown> = { payment };
    if (orderStatus) update.status = orderStatus;
    return OrderModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  },

  findAll() {
    return OrderModel.find().sort({ createdAt: -1 });
  },

  updateStatus(id: string, status: OrderStatus) {
    return OrderModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );
  },
};
