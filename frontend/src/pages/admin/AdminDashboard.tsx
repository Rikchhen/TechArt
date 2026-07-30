import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listAllOrders } from '../../api/orders'
import { listProducts } from '../../api/products'
import { StatusPill } from '../../components/StatusPill'
import { Icon, type IconName } from '../../components/Icon'
import { LoadingBlock } from '../../components/Spinner'
import { EmptyState } from '../../components/EmptyState'
import { formatPrice, formatDate, shortId } from '../../lib/format'
import { errorMessage } from '../../api/client'
import { useRealtime } from '../../hooks/useRealtime'
import { useMe } from '../../hooks/useAuth'
import type { Order, OrderStatus } from '../../types'

const LOW_STOCK_THRESHOLD = 5
const STATUS_ORDER: OrderStatus[] = ['pending', 'paid', 'shipped', 'cancelled']

type RangeKey = '7d' | '30d' | 'all'
const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: 'all', label: 'All time', days: null },
]

/** Orders that count toward revenue (cancelled ones don't). */
const isRevenue = (o: Order) => o.status !== 'cancelled'

function sumRevenue(orders: Order[]) {
  return orders.filter(isRevenue).reduce((s, o) => s + o.totalAmount, 0)
}
function sumUnits(orders: Order[]) {
  return orders
    .filter(isRevenue)
    .reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0)
}

function Trend({ current, previous }: { current: number; previous: number }) {
  // No baseline to compare against — don't invent one.
  if (previous <= 0) return null
  const pct = ((current - previous) / previous) * 100
  if (!isFinite(pct)) return null
  const up = pct >= 0
  return (
    <span className={`stat-trend ${up ? 'is-up' : 'is-down'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
  to,
  trend,
}: {
  icon: IconName
  label: string
  value: string
  hint?: string
  to: string
  trend?: { current: number; previous: number }
}) {
  return (
    <Link to={to} className="stat-card card">
      <span className="stat-icon">
        <Icon name={icon} size={22} />
      </span>
      <div className="stat-body">
        <span className="stat-value">
          {value}
          {trend && <Trend current={trend.current} previous={trend.previous} />}
        </span>
        <span className="stat-label">{label}</span>
        {hint ? <span className="stat-hint muted">{hint}</span> : null}
      </div>
    </Link>
  )
}

/** Daily revenue bars built from real order timestamps — no chart library. */
function RevenueChart({ orders, days }: { orders: Order[]; days: number }) {
  const buckets = useMemo(() => {
    const out: { label: string; key: string; value: number }[] = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      out.push({
        key: d.toDateString(),
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: 0,
      })
    }
    const index = new Map(out.map((b, i) => [b.key, i]))
    for (const o of orders) {
      if (!isRevenue(o)) continue
      const i = index.get(new Date(o.createdAt).toDateString())
      if (i !== undefined) out[i].value += o.totalAmount
    }
    return out
  }, [orders, days])

  const max = Math.max(...buckets.map((b) => b.value), 1)
  const hasData = buckets.some((b) => b.value > 0)

  return (
    <div className="bar-chart" role="img" aria-label={`Daily revenue for the last ${days} days`}>
      {hasData ? (
        buckets.map((b) => (
          <div key={b.key} className="bar-col" title={`${b.label}: ${formatPrice(b.value)}`}>
            <div
              className="bar"
              style={{ height: `${Math.max((b.value / max) * 100, b.value > 0 ? 4 : 0)}%` }}
            />
          </div>
        ))
      ) : (
        <p className="muted chart-empty">No revenue in this period yet.</p>
      )}
    </div>
  )
}

function LiveBadge({
  status,
  lastEventAt,
}: {
  status: 'connecting' | 'live' | 'offline'
  lastEventAt: number | null
}) {
  const label =
    status === 'live' ? 'Live' : status === 'connecting' ? 'Connecting…' : 'Offline'
  return (
    <span
      className={`live-badge is-${status}`}
      title={
        lastEventAt
          ? `Last update ${new Date(lastEventAt).toLocaleTimeString()}`
          : 'Waiting for updates'
      }
      aria-live="polite"
    >
      <span className="live-dot" aria-hidden="true" />
      {label}
    </span>
  )
}

export default function AdminDashboard() {
  const qc = useQueryClient()
  const { isAdmin } = useMe()
  const [range, setRange] = useState<RangeKey>('all')
  // Push updates: the server tells us when orders/products change.
  const { status: liveStatus, lastEventAt } = useRealtime(isAdmin)

  const productsQuery = useQuery({
    queryKey: ['products', 'admin'],
    queryFn: () => listProducts(1, 100),
  })
  const ordersQuery = useQuery({
    queryKey: ['orders', 'all'],
    queryFn: listAllOrders,
  })

  const allOrders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data])
  const days = RANGES.find((r) => r.key === range)!.days

  // Split orders into the selected window and the equivalent window before it,
  // so the trend badges compare like with like.
  const { current, previous } = useMemo(() => {
    if (days === null) return { current: allOrders, previous: [] as Order[] }
    const now = Date.now()
    const start = now - days * 86400_000
    const prevStart = start - days * 86400_000
    return {
      current: allOrders.filter((o) => new Date(o.createdAt).getTime() >= start),
      previous: allOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= prevStart && t < start
      }),
    }
  }, [allOrders, days])

  if (productsQuery.isLoading || ordersQuery.isLoading) {
    return <LoadingBlock label="Loading dashboard…" />
  }
  if (productsQuery.isError || ordersQuery.isError) {
    return (
      <EmptyState
        title="Couldn't load dashboard"
        message={errorMessage(productsQuery.error ?? ordersQuery.error)}
      />
    )
  }

  const products = productsQuery.data?.items ?? []
  const revenue = sumRevenue(current)
  const units = sumUnits(current)
  const paidCount = current.filter(isRevenue).length
  const avgOrder = paidCount > 0 ? revenue / paidCount : 0

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: current.filter((o) => o.status === status).length,
  }))
  const lowStock = products
    .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
  const recentOrders = [...current]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)

  const isRefreshing = ordersQuery.isFetching || productsQuery.isFetching

  return (
    <section className="admin-section admin-dashboard" aria-labelledby="dash-heading">
      <div className="dashboard-head">
        <div className="dashboard-title">
          <h2 id="dash-heading">Overview</h2>
          <LiveBadge status={liveStatus} lastEventAt={lastEventAt} />
        </div>
        <div className="dashboard-controls">
          <div className="segmented" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r.key}
                className={`segmented-btn ${range === r.key ? 'is-active' : ''}`}
                aria-pressed={range === r.key}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ['orders'] })
              qc.invalidateQueries({ queryKey: ['products'] })
            }}
            disabled={isRefreshing}
          >
            <Icon name="trending-up" size={15} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          icon="trending-up"
          label="Revenue"
          value={formatPrice(revenue)}
          hint="Excludes cancelled orders"
          to="/admin/orders"
          trend={{ current: revenue, previous: sumRevenue(previous) }}
        />
        <StatCard
          icon="bag"
          label="Orders"
          value={String(current.length)}
          hint={`Avg ${formatPrice(avgOrder)} per order`}
          to="/admin/orders"
          trend={{ current: current.length, previous: previous.length }}
        />
        <StatCard
          icon="package"
          label="Units sold"
          value={String(units)}
          to="/admin/orders"
          trend={{ current: units, previous: sumUnits(previous) }}
        />
        <StatCard
          icon="grid"
          label="Products"
          value={String(products.length)}
          hint={lowStock.length > 0 ? `${lowStock.length} low on stock` : 'All well stocked'}
          to="/admin/products"
        />
      </div>

      <div className="card dashboard-panel">
        <div className="section-head">
          <h3>Revenue — last {days ?? 30} days</h3>
          <span className="muted">{formatPrice(revenue)} total</span>
        </div>
        <RevenueChart orders={allOrders} days={days ?? 30} />
      </div>

      <div className="dashboard-cols">
        <div className="card dashboard-panel">
          <div className="section-head">
            <h3>Orders by status</h3>
            <Link to="/admin/orders" className="link">
              Manage
            </Link>
          </div>
          <ul className="status-breakdown">
            {statusCounts.map(({ status, count }) => (
              <li key={status}>
                <StatusPill status={status} />
                <span className="status-count">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card dashboard-panel">
          <div className="section-head">
            <h3>
              Low stock{' '}
              {lowStock.length > 0 && (
                <span className="low-stock-flag">
                  <Icon name="alert-triangle" size={15} />
                  {lowStock.length}
                </span>
              )}
            </h3>
            <Link to="/admin/products" className="link">
              Manage
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="muted">Everything is well stocked.</p>
          ) : (
            <ul className="low-stock-list">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p._id}>
                  <Link to={`/admin/products/${p._id}`} className="link">
                    {p.name}
                  </Link>
                  <span className={p.stock === 0 ? 'stock-out' : 'muted'}>
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card dashboard-panel">
        <div className="section-head">
          <h3>Recent orders</h3>
          <Link to="/admin/orders" className="link">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="muted">No orders in this period.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td className="mono">#{shortId(o._id)}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>
                      <StatusPill status={o.status} />
                    </td>
                    <td className="num">{formatPrice(o.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
