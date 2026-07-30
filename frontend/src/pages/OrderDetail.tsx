import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listMyOrders } from '../api/orders'
import { getPaymentConfig, initiateKhalti } from '../api/payments'
import { StatusPill } from '../components/StatusPill'
import { LoadingBlock, Spinner } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { formatPrice, formatDateTime, shortId } from '../lib/format'
import { errorMessage } from '../api/client'

export default function OrderDetail() {
  const { id = '' } = useParams()
  const qc = useQueryClient()

  // The API exposes the caller's orders as a list; find the requested one there.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: listMyOrders,
  })

  const { data: paymentConfig } = useQuery({
    queryKey: ['payments', 'config'],
    queryFn: getPaymentConfig,
  })

  const payWithKhalti = useMutation({
    mutationFn: initiateKhalti,
    onSuccess: ({ paymentUrl }) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      window.location.assign(paymentUrl)
    },
  })

  if (isLoading) return <LoadingBlock label="Loading order…" />
  if (isError) {
    return <EmptyState title="Couldn't load order" message={errorMessage(error)} />
  }

  const order = data?.find((o) => o._id === id)
  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        message="We couldn't find that order on your account."
        action={
          <Link to="/orders" className="btn btn-primary">
            Back to my orders
          </Link>
        }
      />
    )
  }

  const canPayWithKhalti =
    paymentConfig?.khaltiEnabled &&
    order.status === 'pending' &&
    order.payment?.status !== 'paid' &&
    order.payment?.status !== 'refunded'

  return (
    <div className="order-detail">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/orders" className="link">
          My orders
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="muted">#{shortId(order._id)}</span>
      </nav>

      <div className="order-detail-head card">
        <div>
          <h1 className="page-title">Order #{shortId(order._id)}</h1>
          <p className="muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusPill status={order.status} />
      </div>

      {order.payment?.provider === 'khalti' && (
        <p className="muted">
          Payment status: <strong>{order.payment.status}</strong>
        </p>
      )}

      {canPayWithKhalti && (
        <div className="card order-payment-action">
          <div>
            <h2 className="summary-title">Payment pending</h2>
            <p className="muted">Complete this order securely with Khalti.</p>
          </div>
          {payWithKhalti.isError && (
            <p className="alert alert-error" role="alert">
              {errorMessage(payWithKhalti.error, 'Could not start Khalti payment')}
            </p>
          )}
          <button
            className="btn btn-primary"
            onClick={() => payWithKhalti.mutate(order._id)}
            disabled={payWithKhalti.isPending}
          >
            {payWithKhalti.isPending ? <Spinner label="Redirecting" /> : 'Pay with Khalti'}
          </button>
        </div>
      )}

      <div className="card order-detail-items">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col" className="num">
                Price
              </th>
              <th scope="col" className="num">
                Qty
              </th>
              <th scope="col" className="num">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.productId}>
                <td>{item.name}</td>
                <td className="num">{formatPrice(item.priceAtPurchase)}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">
                  {formatPrice(item.priceAtPurchase * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="num order-total-label">
                Total
              </td>
              <td className="num order-total-value">
                {formatPrice(order.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
