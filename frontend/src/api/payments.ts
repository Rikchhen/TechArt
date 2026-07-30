import { api } from './client'
import type { Order } from '../types'

export async function getPaymentConfig(): Promise<{ khaltiEnabled: boolean }> {
  const { data } = await api.get<{ khaltiEnabled: boolean }>('/payments/config')
  return data
}

/** Starts a Khalti payment; returns the URL to redirect the customer to. */
export async function initiateKhalti(
  orderId: string,
): Promise<{ paymentUrl: string; pidx: string }> {
  const { data } = await api.post<{ paymentUrl: string; pidx: string }>(
    '/payments/khalti/initiate',
    { orderId },
  )
  return data
}

export async function verifyKhalti(
  pidx: string,
): Promise<{ status: string; order: Order }> {
  const { data } = await api.post<{ status: string; order: Order }>(
    '/payments/khalti/verify',
    { pidx },
  )
  return data
}
