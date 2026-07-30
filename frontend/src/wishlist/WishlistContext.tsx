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

export interface WishlistItem {
  productId: string
  name: string
  price: number
  imageUrl?: string
}

interface WishlistValue {
  items: WishlistItem[]
  count: number
  has: (productId: string) => boolean
  toggle: (product: Product) => void
  remove: (productId: string) => void
  clear: () => void
}

const STORAGE_KEY = 'gadgetstore.wishlist'
const WishlistContext = createContext<WishlistValue | null>(null)

function load(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WishlistItem[]) : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const has = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items],
  )

  const toggle = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === product._id)) {
        return prev.filter((i) => i.productId !== product._id)
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
        },
      ]
    })
  }, [])

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<WishlistValue>(
    () => ({ items, count: items.length, has, toggle, remove, clear }),
    [items, has, toggle, remove, clear],
  )

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider')
  return ctx
}
