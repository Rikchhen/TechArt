import { isValidObjectId } from "mongoose";
import {
  initiateKhaltiPayment,
  isKhaltiEnabled,
  verifyKhaltiPayment,
} from "../config/khalti";
import { env } from "../config/env";
import { orderRepository } from "../repositories/order.repository";
import { AppError } from "../utils/appError";

function amountToPaisa(amount: number): number {
  const paisa = Math.round(amount * 100);
  if (!Number.isSafeInteger(paisa) || paisa < 1) {
    throw new AppError("Order amount is invalid", 400);
  }
  return paisa;
}

async function initiateKhalti(orderId: string, userId: string) {
  if (!isKhaltiEnabled()) {
    throw new AppError("Khalti payments are not configured", 503);
  }
  if (!isValidObjectId(orderId)) {
    throw new AppError("Order not found", 404);
  }

  const order = await orderRepository.findOwnedById(orderId, userId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.status === "paid" || order.payment.status === "paid") {
    throw new AppError("This order has already been paid", 409);
  }
  if (order.status === "cancelled") {
    throw new AppError("A cancelled order cannot be paid", 409);
  }

  const amount = amountToPaisa(order.totalAmount);
  const khalti = await initiateKhaltiPayment({
    return_url: `${env.APP_URL}/payment/callback`,
    website_url: env.APP_URL,
    amount,
    purchase_order_id: order._id.toString(),
    purchase_order_name: `Order ${order._id.toString()}`,
  });

  if (!khalti.pidx || !khalti.payment_url) {
    throw new AppError("Khalti returned an invalid payment session", 502);
  }

  const updatedOrder = await orderRepository.updatePayment(order._id.toString(), {
    provider: "khalti",
    status: "initiated",
    pidx: khalti.pidx,
    amountPaisa: amount,
  });
  if (!updatedOrder) throw new AppError("Order not found", 404);

  return { paymentUrl: khalti.payment_url, pidx: khalti.pidx };
}

async function verifyKhalti(pidx: string, userId: string) {
  const order = await orderRepository.findOwnedByPaymentPidx(pidx, userId);
  if (!order) throw new AppError("Payment not found", 404);

  const khalti = await verifyKhaltiPayment(pidx);
  const expectedAmount = order.payment.amountPaisa;
  if (
    khalti.pidx !== pidx ||
    khalti.purchase_order_id !== order._id.toString() ||
    khalti.total_amount !== expectedAmount
  ) {
    throw new AppError("Khalti payment details do not match this order", 502);
  }

  if (khalti.status === "Completed") {
    const updatedOrder = await orderRepository.updatePayment(
      order._id.toString(),
      {
        ...order.payment,
        status: "paid",
        transactionId: khalti.transaction_id,
      },
      "paid"
    );
    if (!updatedOrder) throw new AppError("Order not found", 404);
    return { status: khalti.status, order: updatedOrder };
  }

  const terminalFailure = ["Expired", "User canceled", "Refunded"].includes(khalti.status);
  const updatedOrder = terminalFailure
    ? await orderRepository.updatePayment(order._id.toString(), {
        ...order.payment,
        status: khalti.status === "Refunded" ? "refunded" : "failed",
      })
    : order;

  return { status: khalti.status, order: updatedOrder };
}

export const paymentService = { initiateKhalti, verifyKhalti, isKhaltiEnabled };
