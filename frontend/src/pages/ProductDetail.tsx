import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProduct } from '../api/products'
import { ProductImage } from '../components/ProductImage'
import { CategoryPill } from '../components/StatusPill'
import { Icon } from '../components/Icon'
import { LoadingBlock } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { formatPrice } from '../lib/format'
import { useCart } from '../cart/CartContext'
import { useWishlist } from '../wishlist/WishlistContext'
import { useCompare } from '../compare/CompareContext'
import { useToast } from '../toast/ToastContext'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import { errorMessage } from '../api/client'

export default function ProductDetail() {
  const { id = '' } = useParams()
  const cart = useCart()
  const wishlist = useWishlist()
  const compare = useCompare()
  const toast = useToast()
  const recent = useRecentlyViewed()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  })

  // Depend on the stable `add` callback (not the whole `recent` object, whose
  // identity changes every time items update) — otherwise this effect re-fires
  // on its own writes and spins into an infinite render loop.
  const addRecent = recent.add
  useEffect(() => {
    if (product) {
      addRecent({
        id: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      })
    }
  }, [product, addRecent])

  if (isLoading) return <LoadingBlock label="Loading product…" />
  if (isError || !product) {
    return (
      <EmptyState
        title="Product not found"
        message={error ? errorMessage(error) : 'This product may have been removed.'}
        action={
          <Link to="/" className="btn btn-primary">
            Back to catalog
          </Link>
        }
      />
    )
  }

  const outOfStock = product.stock <= 0
  const wished = wishlist.has(product._id)
  const comparing = compare.has(product._id)

  function toggleCompare() {
    if (comparing) {
      compare.remove(product!._id)
      toast.toast('Removed from compare', 'info')
    } else if (compare.isFull) {
      toast.error('You can compare up to 4 products')
    } else {
      compare.toggle(product!._id)
      toast.toast('Added to compare', 'info')
    }
  }

  function buyNow() {
    cart.add(product!, qty)
    navigate('/checkout')
  }

  return (
    <div className="product-detail">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="link">
          Catalog
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="muted">{product.name}</span>
      </nav>

      <div className="product-detail-grid">
        <div className="product-detail-media card">
          <ProductImage src={product.imageUrl} alt={product.name} eager />
        </div>

        <div className="product-detail-info">
          <CategoryPill category={product.category} />
          <h1 className="product-detail-title">{product.name}</h1>
          <p className="product-detail-price">{formatPrice(product.price)}</p>

          <p className="product-detail-desc">{product.description}</p>

          <p className="product-detail-stock">
            {outOfStock ? (
              <span className="stock-out">Currently out of stock</span>
            ) : (
              <span className="stock-in">{product.stock} available</span>
            )}
          </p>

          <div className="product-detail-actions">
            <div className="qty-control" aria-label="Quantity">
              <button
                className="qty-btn"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={outOfStock || qty <= 1}
              >
                <Icon name="minus" size={16} />
              </button>
              <span className="qty-value" aria-live="polite">
                {qty}
              </span>
              <button
                className="qty-btn"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={outOfStock || qty >= product.stock}
              >
                <Icon name="plus" size={16} />
              </button>
            </div>

            <button
              className="btn btn-primary"
              disabled={outOfStock}
              onClick={() => {
                cart.add(product, qty)
                toast.success(`${product.name} added to cart`)
              }}
            >
              <Icon name="bag" size={18} />
              Add to cart
            </button>

            <button
              className="btn btn-buy"
              disabled={outOfStock}
              onClick={buyNow}
            >
              <Icon name="cart" size={18} />
              Buy now
            </button>

            <button
              className={`btn btn-ghost ${wished ? 'is-wished' : ''}`}
              aria-pressed={wished}
              onClick={() => {
                wishlist.toggle(product)
                toast.toast(
                  wished ? 'Removed from wishlist' : 'Saved to wishlist',
                  'info',
                )
              }}
            >
              <Icon name="heart" size={18} filled={wished} />
              {wished ? 'Saved' : 'Save'}
            </button>

            <button
              className={`btn btn-ghost ${comparing ? 'is-comparing' : ''}`}
              aria-pressed={comparing}
              onClick={toggleCompare}
            >
              <Icon name="compare" size={18} />
              {comparing ? 'Comparing' : 'Compare'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
