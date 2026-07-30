import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listMyOrders } from '../api/orders'
import { StatusPill } from '../components/StatusPill'
import { LoadingBlock } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { formatPrice, formatDate, shortId } from '../lib/format'
import { errorMessage } from '../api/client'

export default function MyOrders() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: listMyOrders,
  })

  if (isLoading) return <LoadingBlock label="Loading your orders…" />
  if (isError) {
    return <EmptyState title="Couldn't load orders" message={errorMessage(error)} />
  }

  const orders = data ?? []
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="package" size={40} />}
        title="No orders yet"
        message={
          <>
            When you place an order it'll show up here.{' '}
            <Link to="/" className="link">
              Start shopping
            </Link>
            .
          </>
        }
      />
    )
  }

  return (
    <div className="orders-page">
      <h1 className="page-title">My orders</h1>
      <ul className="order-list">
        {orders.map((order) => (
          <li key={order._id}>
            <Link to={`/orders/${order._id}`} className="order-row card">
              <div className="order-row-main">
                <span className="mono order-id">#{shortId(order._id)}</span>
                <span className="muted">{formatDate(order.createdAt)}</span>
              </div>
              <div className="order-row-meta">
                <span className="muted">
                  {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)
                </span>
                <StatusPill status={order.status} />
                <strong>{formatPrice(order.totalAmount)}</strong>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
