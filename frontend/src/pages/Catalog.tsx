import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listProducts } from '../api/products'
import { CATEGORIES, type ProductCategory } from '../types'
import { ProductCard } from '../components/ProductCard'
import { Pagination } from '../components/Pagination'
import { LoadingBlock } from '../components/Spinner'
import { EmptyState } from '../components/EmptyState'
import { ProductImage } from '../components/ProductImage'
import { Icon } from '../components/Icon'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import { formatPrice } from '../lib/format'
import { errorMessage } from '../api/client'

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'name'
type CategoryFilter = 'all' | ProductCategory

const PAGE_SIZE = 12

export default function Catalog() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)

  const recent = useRecentlyViewed()

  // Pull a generous page of products and do search/filter/sort on the client so
  // the catalog stays responsive without extra endpoints.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', 'catalog'],
    queryFn: () => listProducts(1, 100),
  })

  const filtered = useMemo(() => {
    let items = data?.items ?? []
    const q = search.trim().toLowerCase()
    if (q) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    }
    if (category !== 'all') items = items.filter((p) => p.category === category)

    const sorted = [...items]
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    }
    return sorted
  }, [data, search, category, sort])

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(1)
    }
  }

  return (
    <div className="catalog">
      <section className="hero card">
        <div className="hero-copy">
          <p className="hero-eyebrow">Tech that keeps up</p>
          <h1 className="hero-title">
            Phones, laptops &amp; gear, without the runaround.
          </h1>
          <p className="muted hero-sub">
            A curated catalog of gadgets. Browse, save favourites, and check out
            in a couple of clicks.
          </p>
          <a href="#catalog-grid" className="btn btn-primary">
            Shop the catalog
          </a>
        </div>
      </section>

      {recent.items.length > 0 && (
        <section className="recent-section" aria-label="Recently viewed">
          <div className="section-head">
            <h2>Recently viewed</h2>
            <button className="link" onClick={recent.clear}>
              Clear
            </button>
          </div>
          <div className="recent-strip">
            {recent.items.map((r) => (
              <Link key={r.id} to={`/products/${r.id}`} className="recent-chip card">
                <ProductImage src={r.imageUrl} alt={r.name} className="recent-thumb" />
                <div className="recent-meta">
                  <span className="recent-name">{r.name}</span>
                  <span className="muted">{formatPrice(r.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="catalog-grid" className="catalog-main">
        <div className="section-head">
          <h2>Catalog</h2>
          <span className="muted">{filtered.length} products</span>
        </div>

        <div className="filters card">
          <div className="filter-search">
            <Icon name="search" size={18} className="filter-search-icon" />
            <input
              className="input"
              type="search"
              placeholder="Search products…"
              aria-label="Search products"
              value={search}
              onChange={(e) => resetPageAnd(setSearch)(e.target.value)}
            />
          </div>
          <label className="filter-select">
            <span className="sr-only">Category</span>
            <select
              className="select"
              aria-label="Filter by category"
              value={category}
              onChange={(e) =>
                resetPageAnd(setCategory)(e.target.value as CategoryFilter)
              }
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <span className="sr-only">Sort</span>
            <select
              className="select"
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <LoadingBlock label="Loading products…" />
        ) : isError ? (
          <EmptyState
            title="Couldn't load products"
            message={errorMessage(error)}
          />
        ) : pageItems.length === 0 ? (
          <EmptyState
            title="No products match"
            message="Try a different search or category."
          />
        ) : (
          <>
            <div className="product-grid">
              {pageItems.map((p, i) => (
                // Eager-load the first row so the grid isn't blank on arrival.
                <ProductCard key={p._id} product={p} eager={i < 4} />
              ))}
            </div>
            <Pagination
              page={page}
              limit={PAGE_SIZE}
              total={filtered.length}
              onPage={setPage}
            />
          </>
        )}
      </section>
    </div>
  )
}
