import type { OrderStatus } from '../types'

const STYLES: Record<OrderStatus, { color: string; tint: string }> = {
  pending: { color: 'var(--color-warn)', tint: 'var(--color-warn-tint)' },
  paid: { color: 'var(--color-info)', tint: 'var(--color-info-tint)' },
  shipped: { color: 'var(--color-success)', tint: 'var(--color-success-tint)' },
  cancelled: { color: 'var(--color-danger)', tint: 'var(--color-danger-tint)' },
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const s = STYLES[status]
  return (
    <span className="pill" style={{ color: s.color, background: s.tint }}>
      <span className="pill-dot" aria-hidden="true" />
      {status}
    </span>
  )
}

export function CategoryPill({ category }: { category: string }) {
  return <span className="pill pill-category">{category}</span>
}
