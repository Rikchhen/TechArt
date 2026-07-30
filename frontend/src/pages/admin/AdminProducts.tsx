import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteProduct, listProducts } from '../../api/products'
import { CategoryPill } from '../../components/StatusPill'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Icon } from '../../components/Icon'
import { LoadingBlock } from '../../components/Spinner'
import { EmptyState } from '../../components/EmptyState'
import { formatPrice } from '../../lib/format'
import { useToast } from '../../toast/ToastContext'
import { errorMessage } from '../../api/client'
import type { Product } from '../../types'

export default function AdminProducts() {
  const qc = useQueryClient()
  const toast = useToast()
  const [target, setTarget] = useState<Product | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', 'admin'],
    queryFn: () => listProducts(1, 100),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted')
      setTarget(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err, 'Delete failed'))
    },
  })

  return (
    <section className="admin-section" aria-labelledby="admin-products-heading">
      <div className="section-head">
        <h2 id="admin-products-heading">Products</h2>
        <Link to="/admin/products/new" className="btn btn-primary btn-sm">
          <Icon name="plus" size={16} />
          New product
        </Link>
      </div>

      {isLoading ? (
        <LoadingBlock label="Loading products…" />
      ) : isError ? (
        <EmptyState title="Couldn't load products" message={errorMessage(error)} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="No products yet"
          message="Create your first product to get started."
          action={
            <Link to="/admin/products/new" className="btn btn-primary">
              New product
            </Link>
          }
        />
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Category</th>
                <th scope="col" className="num">
                  Price
                </th>
                <th scope="col" className="num">
                  Stock
                </th>
                <th scope="col" className="actions-col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data!.items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <Link to={`/products/${p._id}`} className="link">
                      {p.name}
                    </Link>
                  </td>
                  <td>
                    <CategoryPill category={p.category} />
                  </td>
                  <td className="num">{formatPrice(p.price)}</td>
                  <td className="num">
                    {p.stock === 0 ? (
                      <span className="stock-out">0</span>
                    ) : (
                      p.stock
                    )}
                  </td>
                  <td className="actions-col">
                    <div className="row-actions">
                      <Link
                        to={`/admin/products/${p._id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        <Icon name="pencil" size={15} />
                        Edit
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setTarget(p)}
                      >
                        <Icon name="trash" size={15} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete product?"
        message={
          target
            ? `“${target.name}” will be permanently removed. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={remove.isPending}
        onConfirm={() => target && remove.mutate(target._id)}
        onCancel={() => setTarget(null)}
      />
    </section>
  )
}
