import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { ProductImage } from './ProductImage'
import { CategoryPill } from './StatusPill'
import { Icon } from './Icon'
import { formatPrice } from '../lib/format'
import { useCart } from '../cart/CartContext'
import { useWishlist } from '../wishlist/WishlistContext'
import { useCompare } from '../compare/CompareContext'
import { useToast } from '../toast/ToastContext'

export function ProductCard({
  product,
  eager,
}: {
  product: Product
  /** Eager-load the image for cards rendered above the fold. */
  eager?: boolean
}) {
  const cart = useCart()
  const wishlist = useWishlist()
  const compare = useCompare()
  const toast = useToast()
  const outOfStock = product.stock <= 0
  const wished = wishlist.has(product._id)
  const comparing = compare.has(product._id)

  return (
    <article className="product-card card">
      <Link
        to={`/products/${product._id}`}
        className="product-card-media"
        aria-label={product.name}
      >
        <ProductImage src={product.imageUrl} alt={product.name} eager={eager} />
        <button
          type="button"
          className={`compare-toggle ${comparing ? 'is-active' : ''}`}
          aria-pressed={comparing}
          aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
          title={comparing ? 'Remove from compare' : 'Add to compare'}
          onClick={(e) => {
            e.preventDefault()
            if (comparing) {
              compare.remove(product._id)
              toast.toast('Removed from compare', 'info')
            } else if (compare.isFull) {
              toast.error('You can compare up to 4 products')
            } else {
              compare.toggle(product._id)
              toast.toast('Added to compare', 'info')
            }
          }}
        >
          <Icon name="compare" size={17} />
        </button>
        <button
          type="button"
          className={`wishlist-toggle ${wished ? 'is-active' : ''}`}
          aria-pressed={wished}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.preventDefault()
            wishlist.toggle(product)
            toast.toast(
              wished ? 'Removed from wishlist' : 'Saved to wishlist',
              'info',
            )
          }}
        >
          <Icon name="heart" size={18} filled={wished} />
        </button>
      </Link>

      <div className="product-card-body">
        <CategoryPill category={product.category} />
        <h3 className="product-card-title">
          <Link to={`/products/${product._id}`}>{product.name}</Link>
        </h3>
        <p className="product-card-price">{formatPrice(product.price)}</p>
        <div className="product-card-footer">
          {outOfStock ? (
            <span className="muted stock-out">Out of stock</span>
          ) : (
            <span className="muted stock-in">{product.stock} in stock</span>
          )}
          <button
            className="btn btn-primary btn-sm"
            disabled={outOfStock}
            onClick={() => {
              cart.add(product)
              toast.success(`${product.name} added to cart`)
            }}
          >
            <Icon name="bag" size={16} />
            Add
          </button>
        </div>
      </div>
    </article>
  )
}
