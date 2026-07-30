import { api } from './client'
import type { Order, OrderStatus } from '../types'

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[]
}

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<Order> {
  const { data } = await api.post<{ order: Order }>('/orders', payload)
  return data.order
}

export async function listMyOrders(): Promise<Order[]> {
  const { data } = await api.get<{ orders: Order[] }>('/orders/mine')
  return data.orders
}

export async function listAllOrders(): Promise<Order[]> {
  const { data } = await api.get<{ orders: Order[] }>('/orders')
  return data.orders
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  const { data } = await api.patch<{ order: Order }>(`/orders/${id}/status`, {
    status,
  })
  return data.order
}
