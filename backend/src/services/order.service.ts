import { Types } from "mongoose";
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { CreateOrderInput } from "../dtos/order.dto";
import { IOrderItem, OrderStatus } from "../types/order.types";
import { AppError } from "../utils/appError";

async function createOrder(userId: string, dto: CreateOrderInput) {
  const items: IOrderItem[] = [];
  let totalAmount = 0;

  for (const line of dto.items) {
    const product = await productRepository.findById(line.productId);
    if (!product) {
      throw new AppError(`Product not found: ${line.productId}`, 404);
    }
    if (product.stock < line.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`, 409);
    }

    items.push({
      productId: product._id,
      name: product.name,
      priceAtPurchase: product.price,
      quantity: line.quantity,
    });
    totalAmount += product.price * line.quantity;
  }

  const order = await orderRepository.create({
    userId: new Types.ObjectId(userId),
    items,
    totalAmount,
  });

  for (const line of items) {
    await productRepository.decrementStock(
      line.productId.toString(),
      line.quantity
    );
  }

  return order;
}

async function listMine(userId: string) {
  return orderRepository.findByUser(userId);
}

async function listAll() {
  return orderRepository.findAll();
}

async function updateStatus(id: string, status: OrderStatus) {
  const order = await orderRepository.updateStatus(id, status);
  if (!order) {
    throw new AppError("Order not found", 404);
  }
  return order;
}

export const orderService = { createOrder, listMine, listAll, updateStatus };
