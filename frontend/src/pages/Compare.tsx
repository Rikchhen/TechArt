import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listProducts } from '../api/products'
import { useCompare } from '../compare/CompareContext'
import { useCart } from '../cart/CartContext'
import { useToast } from '../toast/ToastContext'
import { ProductImage } from '../components/ProductImage'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { LoadingBlock } from '../components/Spinner'
import { CategoryPill } from '../components/StatusPill'
import { formatPrice } from '../lib/format'

export default function Compare() {
  const compare = useCompare()
  const cart = useCart()
  const toast = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'catalog'],
    queryFn: () => listProducts(1, 100),
  })

  if (compare.count === 0) {
    return (
      <EmptyState
        icon={<Icon name="compare" size={40} />}
        title="Nothing to compare yet"
        message={
          <>
            Add products with the compare button on any card (up to 4), then view
            them side by side.{' '}
            <Link to="/" className="link">
              Browse the catalog
            </Link>
            .
          </>
        }
      />
    )
  }

  if (isLoading) return <LoadingBlock label="Loading comparison…" />

  // Preserve the order products were added in.
  const byId = new Map((data?.items ?? []).map((p) => [p._id, p]))
  const products = compare.ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  const cheapest = Math.min(...products.map((p) => p.price))

  return (
    <div className="compare-page">
      <div className="section-head">
        <h1 className="page-title">Compare</h1>
        <button className="link" onClick={compare.clear}>
          Clear all
        </button>
      </div>

      <div className="table-wrap card">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col" className="compare-attr">
                Product
              </th>
              {products.map((p) => (
                <th key={p._id} scope="col" className="compare-col">
                  <div className="compare-head">
                    <Link to={`/products/${p._id}`} className="compare-media">
                      <ProductImage src={p.imageUrl} alt={p.name} />
                    </Link>
                    <Link to={`/products/${p._id}`} className="compare-name">
                      {p.name}
                    </Link>
                    <button
                      className="compare-remove"
                      aria-label={`Remove ${p.name} from compare`}
                      onClick={() => compare.remove(p._id)}
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="compare-attr">
                Price
              </th>
              {products.map((p) => (
                <td key={p._id}>
                  <span className="compare-price">{formatPrice(p.price)}</span>
                  {p.price === cheapest && products.length > 1 && (
                    <span className="compare-badge">Lowest</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="compare-attr">
                Category
              </th>
              {products.map((p) => (
                <td key={p._id}>
                  <CategoryPill category={p.category} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="compare-attr">
                Availability
              </th>
              {products.map((p) => (
                <td key={p._id}>
                  {p.stock > 0 ? (
                    <span className="stock-in">{p.stock} in stock</span>
                  ) : (
                    <span className="stock-out">Out of stock</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="compare-attr">
                Description
              </th>
              {products.map((p) => (
                <td key={p._id} className="compare-desc">
                  {p.description}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="compare-attr" />
              {products.map((p) => (
                <td key={p._id}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={p.stock <= 0}
                    onClick={() => {
                      cart.add(p)
                      toast.success(`${p.name} added to cart`)
                    }}
                  >
                    <Icon name="bag" size={15} />
                    Add
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
