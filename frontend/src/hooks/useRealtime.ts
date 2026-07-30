import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export type RealtimeStatus = 'connecting' | 'live' | 'offline'

/**
 * Subscribes to the backend Server-Sent Events stream and invalidates the
 * matching React Query caches when data changes, so views update without a
 * reload or polling. EventSource reconnects on its own after a drop.
 *
 * `enabled` should be false for non-admins (the stream is admin-only).
 */
export function useRealtime(enabled: boolean) {
  const qc = useQueryClient()
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const [lastEventAt, setLastEventAt] = useState<number | null>(null)
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!enabled) {
      setStatus('offline')
      return
    }

    const es = new EventSource('/api/events', { withCredentials: true })
    sourceRef.current = es

    const markLive = () => setStatus('live')
    es.onopen = markLive
    es.addEventListener('connected', markLive)

    // EventSource fires `error` on drops and then retries automatically.
    es.onerror = () => {
      setStatus(es.readyState === EventSource.CLOSED ? 'offline' : 'connecting')
    }

    const onOrders = () => {
      setStatus('live')
      setLastEventAt(Date.now())
      qc.invalidateQueries({ queryKey: ['orders'] })
    }
    const onProducts = () => {
      setStatus('live')
      setLastEventAt(Date.now())
      qc.invalidateQueries({ queryKey: ['products'] })
    }

    es.addEventListener('orders:changed', onOrders)
    es.addEventListener('products:changed', onProducts)

    return () => {
      es.removeEventListener('orders:changed', onOrders)
      es.removeEventListener('products:changed', onProducts)
      es.close()
      sourceRef.current = null
    }
  }, [enabled, qc])

  return { status, lastEventAt }
}
