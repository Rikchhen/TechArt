import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '../types'

export interface CartItem {
  productId: string
  name: string
  price: number
  imageUrl?: string
  stock: number
  quantity: number
}

interface CartValue {
  items: CartItem[]
  count: number
  subtotal: number
  add: (product: Product, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const STORAGE_KEY = 'gadgetstore.cart'
const CartContext = createContext<CartValue | null>(null)

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id)
      const cap = Math.max(0, product.stock)
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, cap)
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: nextQty } : i,
        )
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          quantity: Math.min(quantity, cap) || 1,
        },
      ]
    })
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    )
  }, [])

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const value = useMemo<CartValue>(
    () => ({ items, count, subtotal, add, setQuantity, remove, clear }),
    [items, count, subtotal, add, setQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
