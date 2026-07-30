import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface RecentItem {
  id: string
  name: string
  price: number
  imageUrl?: string
}

const STORAGE_KEY = 'gadgetstore.recentlyViewed'
const MAX = 6

interface RecentlyViewedValue {
  items: RecentItem[]
  add: (item: RecentItem) => void
  clear: () => void
}

const RecentlyViewedContext = createContext<RecentlyViewedValue | null>(null)

function load(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RecentItem[]) : []
  } catch {
    return []
  }
}

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentItem[]>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((item: RecentItem) => {
    setItems((prev) => {
      const next = [item, ...prev.filter((p) => p.id !== item.id)]
      return next.slice(0, MAX)
    })
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => ({ items, add, clear }), [items, add, clear])

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  )
}

export function useRecentlyViewed(): RecentlyViewedValue {
  const ctx = useContext(RecentlyViewedContext)
  if (!ctx) {
    throw new Error(
      'useRecentlyViewed must be used within a RecentlyViewedProvider',
    )
  }
  return ctx
}
