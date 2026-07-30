import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { verifyKhalti } from '../api/payments'
import { useCart } from '../cart/CartContext'
import { Icon } from '../components/Icon'
import { Spinner } from '../components/Spinner'
import { formatPrice } from '../lib/format'
import { errorMessage } from '../api/client'
import type { Order } from '../types'

type Outcome = 'verifying' | 'paid' | 'pending' | 'failed' | 'error'

export default function PaymentCallback() {
  const [params] = useSearchParams()
  const pidx = params.get('pidx')
  const cart = useCart()
  const qc = useQueryClient()

  const [outcome, setOutcome] = useState<Outcome>('verifying')
  const [order, setOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!pidx) {
      setOutcome('error')
      setMessage('Missing payment reference.')
      return
    }

    verifyKhalti(pidx)
      .then(({ status, order }) => {
        qc.invalidateQueries({ queryKey: ['orders'] })
        setOrder(order)
        if (status === 'Completed') {
          cart.clear()
          setOutcome('paid')
        } else if (status === 'Pending' || status === 'Initiated') {
          setOutcome('pending')
        } else {
          setOutcome('failed')
          setMessage(`Payment ${status.toLowerCase()}.`)
        }
      })
      .catch((e) => {
        setOutcome('error')
        setMessage(errorMessage(e, 'Could not verify the payment'))
      })
  }, [pidx, cart, qc])

  return (
    <div className="auth-page">
      <div className="auth-card card">
        {outcome === 'verifying' && (
          <>
            <h1 className="auth-title">Confirming payment…</h1>
            <p className="muted auth-sub">
              <Spinner label="Verifying" /> Checking your Khalti payment.
            </p>
          </>
        )}

        {outcome === 'paid' && (
          <>
            <span className="auth-badge">
              <Icon name="check-circle" size={22} />
            </span>
            <h1 className="auth-title">Payment successful</h1>
            <p className="muted auth-sub">
              Thanks — your order is paid{order ? ` (${formatPrice(order.totalAmount)})` : ''}.
            </p>
            <Link
              to={order ? `/orders/${order._id}` : '/orders'}
              className="btn btn-primary btn-block"
            >
              View order
            </Link>
          </>
        )}

        {outcome === 'pending' && (
          <>
            <h1 className="auth-title">Payment pending</h1>
            <p className="muted auth-sub">
              Your payment is still processing. We'll update the order once Khalti
              confirms it.
            </p>
            <Link to="/orders" className="btn btn-primary btn-block">
              My orders
            </Link>
          </>
        )}

        {(outcome === 'failed' || outcome === 'error') && (
          <>
            <span className="auth-badge auth-badge-danger">
              <Icon name="alert-circle" size={22} />
            </span>
            <h1 className="auth-title">Payment not completed</h1>
            <div className="alert alert-error" role="alert">
              {message || 'The payment was not completed.'}
            </div>
            <Link to="/cart" className="btn btn-primary btn-block">
              Back to cart
            </Link>
            {order && (
              <Link to={`/orders/${order._id}`} className="link auth-alt">
                View order and try payment again
              </Link>
            )}
            <Link to="/orders" className="link auth-alt">
              View my orders
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
