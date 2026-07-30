import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProduct, updateProduct } from '../../api/products'
import { ProductForm } from '../../components/ProductForm'
import { LoadingBlock } from '../../components/Spinner'
import { EmptyState } from '../../components/EmptyState'
import { useToast } from '../../toast/ToastContext'
import { errorMessage } from '../../api/client'
import type { ProductInput } from '../../types'

export default function AdminProductEdit() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  })

  const update = useMutation({
    mutationFn: (input: ProductInput) => updateProduct(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated')
      navigate('/admin/products')
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update product')),
  })

  if (isLoading) return <LoadingBlock label="Loading product…" />
  if (isError || !product) {
    return (
      <EmptyState
        title="Product not found"
        message={error ? errorMessage(error) : undefined}
        action={
          <Link to="/admin/products" className="btn btn-primary">
            Back to products
          </Link>
        }
      />
    )
  }

  return (
    <section className="admin-section" aria-labelledby="edit-product-heading">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/products" className="link">
          Products
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="muted">Edit</span>
      </nav>
      <h2 id="edit-product-heading">Edit “{product.name}”</h2>
      <div className="card form-card">
        <ProductForm
          initial={{
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl,
          }}
          submitLabel="Save changes"
          busy={update.isPending}
          onSubmit={(input) => update.mutate(input)}
        />
      </div>
    </section>
  )
}
