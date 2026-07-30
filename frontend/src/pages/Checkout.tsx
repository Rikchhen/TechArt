import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createOrder } from '../api/orders'
import { getPaymentConfig, initiateKhalti } from '../api/payments'
import { useCart } from '../cart/CartContext'
import { useMe } from '../hooks/useAuth'
import { useToast } from '../toast/ToastContext'
import { EmptyState } from '../components/EmptyState'
import { Spinner } from '../components/Spinner'
import { Icon } from '../components/Icon'
import { formatPrice } from '../lib/format'
import { errorMessage } from '../api/client'

type PayMethod = 'khalti' | 'demo'

export default function Checkout() {
  const cart = useCart()
  const { user } = useMe()
  const toast = useToast()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: payConfig } = useQuery({
    queryKey: ['payments', 'config'],
    queryFn: getPaymentConfig,
  })
  const khaltiEnabled = payConfig?.khaltiEnabled ?? false

  const [method, setMethod] = useState<PayMethod>('demo')
  const [error, setError] = useState('')

  // Places the order, then either redirects to Khalti or finishes (demo).
  const checkout = useMutation({
    mutationFn: async (chosen: PayMethod) => {
      const order = await createOrder({
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      })
      if (chosen === 'khalti') {
        const { paymentUrl } = await initiateKhalti(order._id)
        return { order, paymentUrl }
      }
      return { order, paymentUrl: null as string | null }
    },
    onSuccess: ({ order, paymentUrl }) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      if (paymentUrl) {
        // Keep the cart until payment is confirmed on the callback page.
        toast.toast('Redirecting to Khalti…', 'info')
        window.location.href = paymentUrl
      } else {
        cart.clear()
        toast.success('Order placed!')
        navigate(`/orders/${order._id}`, { replace: true })
      }
    },
    onError: (e) => setError(errorMessage(e, 'Could not place order')),
  })

  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Nothing to check out"
        message={
          <>
            Your cart is empty.{' '}
            <Link to="/" className="link">
              Find something you like
            </Link>
            .
          </>
        }
      />
    )
  }

  const effectiveMethod = khaltiEnabled ? method : 'demo'

  return (
    <div className="checkout-page">
      <h1 className="page-title">Checkout</h1>

      <div className="checkout-layout">
        <section className="card checkout-details">
          <h2 className="summary-title">Shipping to</h2>
          <p className="checkout-user">
            <strong>{user?.name}</strong>
            <br />
            <span className="muted">{user?.email}</span>
          </p>

          <h2 className="summary-title">Payment method</h2>
          <div className="pay-methods">
            {khaltiEnabled && (
              <label className={`pay-method ${method === 'khalti' ? 'is-active' : ''}`}>
                <input
                  type="radio"
                  name="pay"
                  checked={method === 'khalti'}
                  onChange={() => setMethod('khalti')}
                />
                <span className="pay-method-body">
                  <span className="pay-method-title">
                    <span className="khalti-badge">Khalti</span>
                    Pay with Khalti
                  </span>
                  <span className="muted pay-method-sub">
                    Wallet, eBanking, mobile banking, cards
                  </span>
                </span>
              </label>
            )}
            <label className={`pay-method ${effectiveMethod === 'demo' ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="pay"
                checked={effectiveMethod === 'demo'}
                onChange={() => setMethod('demo')}
              />
              <span className="pay-method-body">
                <span className="pay-method-title">
                  <Icon name="package" size={16} />
                  Place order (demo)
                </span>
                <span className="muted pay-method-sub">
                  No payment collected — records the order and adjusts stock.
                </span>
              </span>
            </label>
          </div>
          {!khaltiEnabled && (
            <p className="field-hint">
              Khalti isn't configured on the server — set <code>KHALTI_SECRET_KEY</code>{' '}
              to enable online payment.
            </p>
          )}

          <h2 className="summary-title">Items</h2>
          <ul className="checkout-items">
            {cart.items.map((i) => (
              <li key={i.productId} className="checkout-item">
                <span>
                  {i.name} <span className="muted">× {i.quantity}</span>
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="cart-summary card" aria-label="Order summary">
          <h2 className="summary-title">Summary</h2>
          <div className="summary-row">
            <span className="muted">Items</span>
            <span>{cart.count}</span>
          </div>
          <div className="summary-row">
            <span className="muted">Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span className="muted">Shipping</span>
            <span>Free</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              setError('')
              checkout.mutate(effectiveMethod)
            }}
            disabled={checkout.isPending}
          >
            {checkout.isPending ? (
              <Spinner label="Processing" />
            ) : effectiveMethod === 'khalti' ? (
              `Pay ${formatPrice(cart.subtotal)} with Khalti`
            ) : (
              `Place order · ${formatPrice(cart.subtotal)}`
            )}
          </button>
          <Link to="/cart" className="btn btn-ghost btn-block">
            Back to cart
          </Link>
        </aside>
      </div>
    </div>
  )
}
