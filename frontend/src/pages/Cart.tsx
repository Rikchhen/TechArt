import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { useMe } from '../hooks/useAuth'
import { ProductImage } from '../components/ProductImage'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { formatPrice } from '../lib/format'

export default function Cart() {
  const cart = useCart()
  const { user } = useMe()

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="cart" size={40} />}
        title="Your cart is empty"
        message={
          <>
            Looks like you haven't added anything yet.{' '}
            <Link to="/" className="link">
              Browse the catalog
            </Link>
            .
          </>
        }
      />
    )
  }

  return (
    <div className="cart-page">
      <h1 className="page-title">Your cart</h1>

      <div className="cart-layout">
        <ul className="cart-items">
          {cart.items.map((item) => (
            <li key={item.productId} className="cart-item card">
              <Link to={`/products/${item.productId}`} className="cart-item-media">
                <ProductImage src={item.imageUrl} alt={item.name} />
              </Link>
              <div className="cart-item-info">
                <Link to={`/products/${item.productId}`} className="cart-item-name">
                  {item.name}
                </Link>
                <span className="muted">{formatPrice(item.price)} each</span>
              </div>
              <div className="qty-control" aria-label={`Quantity for ${item.name}`}>
                <button
                  className="qty-btn"
                  aria-label="Decrease quantity"
                  onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Icon name="minus" size={16} />
                </button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  className="qty-btn"
                  aria-label="Increase quantity"
                  onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
              <div className="cart-item-total">
                {formatPrice(item.price * item.quantity)}
              </div>
              <button
                className="cart-item-remove"
                aria-label={`Remove ${item.name} from cart`}
                onClick={() => cart.remove(item.productId)}
              >
                <Icon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ul>

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
          <Link to="/checkout" className="btn btn-primary btn-block">
            {user ? 'Proceed to checkout' : 'Sign in & check out'}
          </Link>
          {!user && (
            <p className="muted cart-signin-note">
              You'll be asked to sign in before placing your order.
            </p>
          )}
          <button className="btn btn-ghost btn-block" onClick={cart.clear}>
            Clear cart
          </button>
        </aside>
      </div>
    </div>
  )
}
