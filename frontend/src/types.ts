// Shared domain types — mirror the shapes the backend returns.

export type Role = 'customer' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  emailVerified: boolean
  twoFactorEnabled: boolean
}

export interface SessionInfo {
  id: string
  current: boolean
  ip?: string
  userAgent?: string
  createdAt?: number
  expires?: string
}

export type ProductCategory = 'mobile' | 'laptop' | 'accessory' | 'other'

export const CATEGORIES: ProductCategory[] = [
  'mobile',
  'laptop',
  'accessory',
  'other',
]

export interface Product {
  _id: string
  name: string
  description: string
  category: ProductCategory
  price: number
  stock: number
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ProductList {
  items: Product[]
  total: number
  page: number
  limit: number
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled'

export interface OrderItem {
  productId: string
  name: string
  priceAtPurchase: number
  quantity: number
}

export type PaymentStatus =
  | 'unpaid'
  | 'initiated'
  | 'paid'
  | 'failed'
  | 'refunded'

export interface Payment {
  provider: 'khalti' | 'none'
  status: PaymentStatus
  pidx?: string
  transactionId?: string
  amountPaisa?: number
}

export interface Order {
  _id: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  payment?: Payment
  createdAt: string
  updatedAt: string
}

// Payload for POST /api/products and PATCH /api/products/:id
export interface ProductInput {
  name: string
  description: string
  category: ProductCategory
  price: number
  stock: number
  imageUrl?: string
}
