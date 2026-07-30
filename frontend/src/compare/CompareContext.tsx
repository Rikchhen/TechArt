import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'gadgetstore.compare'
export const COMPARE_LIMIT = 4

interface CompareValue {
  ids: string[]
  count: number
  isFull: boolean
  has: (productId: string) => boolean
  /** Adds/removes; returns false if it couldn't add because the list is full. */
  toggle: (productId: string) => boolean
  remove: (productId: string) => void
  clear: () => void
}

const CompareContext = createContext<CompareValue | null>(null)

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }, [ids])

  const has = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  )

  const toggle = useCallback((productId: string) => {
    let added = false
    setIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      }
      if (prev.length >= COMPARE_LIMIT) return prev
      added = true
      return [...prev, productId]
    })
    // If it was already present we "removed" it; treat that as a successful action.
    return added || ids.includes(productId)
  }, [ids])

  const remove = useCallback((productId: string) => {
    setIds((prev) => prev.filter((id) => id !== productId))
  }, [])

  const clear = useCallback(() => setIds([]), [])

  const value = useMemo<CompareValue>(
    () => ({
      ids,
      count: ids.length,
      isFull: ids.length >= COMPARE_LIMIT,
      has,
      toggle,
      remove,
      clear,
    }),
    [ids, has, toggle, remove, clear],
  )

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  )
}

export function useCompare(): CompareValue {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider')
  return ctx
}
