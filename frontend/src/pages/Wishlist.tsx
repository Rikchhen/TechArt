import { Link } from 'react-router-dom'
import { useWishlist } from '../wishlist/WishlistContext'
import { useCart } from '../cart/CartContext'
import { useToast } from '../toast/ToastContext'
import { ProductImage } from '../components/ProductImage'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { formatPrice } from '../lib/format'

export default function Wishlist() {
  const wishlist = useWishlist()
  const cart = useCart()
  const toast = useToast()

  if (wishlist.items.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="heart" size={40} />}
        title="Your wishlist is empty"
        message={
          <>
            Tap the heart on any product to save it here.{' '}
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
    <div className="wishlist-page">
      <div className="section-head">
        <h1 className="page-title">Wishlist</h1>
        <button
          className="link"
          onClick={() => {
            wishlist.clear()
            toast.toast('Wishlist cleared', 'info')
          }}
        >
          Clear all
        </button>
      </div>

      <ul className="wishlist-items">
        {wishlist.items.map((item) => (
          <li key={item.productId} className="wishlist-item card">
            <Link to={`/products/${item.productId}`} className="wishlist-item-media">
              <ProductImage src={item.imageUrl} alt={item.name} />
            </Link>
            <div className="wishlist-item-info">
              <Link
                to={`/products/${item.productId}`}
                className="wishlist-item-name"
              >
                {item.name}
              </Link>
              <span className="product-card-price">{formatPrice(item.price)}</span>
            </div>
            <div className="wishlist-item-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  // Wishlist entries carry no stock count; add a single unit and
                  // let the cart/stock rules apply on the product page.
                  cart.add(
                    {
                      _id: item.productId,
                      name: item.name,
                      price: item.price,
                      imageUrl: item.imageUrl,
                      stock: 99,
                      category: 'other',
                      description: '',
                      createdAt: '',
                      updatedAt: '',
                    },
                    1,
                  )
                  toast.success(`${item.name} added to cart`)
                }}
              >
                Add to cart
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  wishlist.remove(item.productId)
                  toast.toast(`${item.name} removed from wishlist`, 'info')
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
