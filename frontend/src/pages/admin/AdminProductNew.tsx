import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct } from '../../api/products'
import { ProductForm } from '../../components/ProductForm'
import { useToast } from '../../toast/ToastContext'
import { errorMessage } from '../../api/client'

export default function AdminProductNew() {
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()

  const create = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created')
      navigate('/admin/products')
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not create product')),
  })

  return (
    <section className="admin-section" aria-labelledby="new-product-heading">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin/products" className="link">
          Products
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="muted">New</span>
      </nav>
      <h2 id="new-product-heading">New product</h2>
      <div className="card form-card">
        <ProductForm
          submitLabel="Create product"
          busy={create.isPending}
          onSubmit={(input) => create.mutate(input)}
        />
      </div>
    </section>
  )
}
