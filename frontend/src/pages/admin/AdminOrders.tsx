import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listAllOrders, updateOrderStatus } from '../../api/orders'
import { StatusPill } from '../../components/StatusPill'
import { LoadingBlock } from '../../components/Spinner'
import { EmptyState } from '../../components/EmptyState'
import { formatPrice, formatDateTime, shortId } from '../../lib/format'
import { errorMessage } from '../../api/client'
import { useToast } from '../../toast/ToastContext'
import type { Order, OrderStatus } from '../../types'

const STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'cancelled']

export default function AdminOrders() {
  const qc = useQueryClient()
  const toast = useToast()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['orders', 'all'],
    queryFn: listAllOrders,
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Optimistically reflect the new status.
      await qc.cancelQueries({ queryKey: ['orders', 'all'] })
      const prev = qc.getQueryData<Order[]>(['orders', 'all'])
      qc.setQueryData<Order[]>(['orders', 'all'], (old) =>
        old?.map((o) => (o._id === id ? { ...o, status } : o)),
      )
      return { prev }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['orders', 'all'], ctx.prev)
      toast.error(errorMessage(err, 'Could not update status'))
    },
    onSuccess: () => toast.success('Order status updated'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  if (isLoading) return <LoadingBlock label="Loading orders…" />
  if (isError) {
    return <EmptyState title="Couldn't load orders" message={errorMessage(error)} />
  }

  const orders = data ?? []

  return (
    <section className="admin-section" aria-labelledby="admin-orders-heading">
      <div className="section-head">
        <h2 id="admin-orders-heading">All orders</h2>
        <span className="muted">{orders.length} total</span>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" message="Orders will appear here once customers check out." />
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Placed</th>
                <th scope="col" className="num">
                  Items
                </th>
                <th scope="col">Status</th>
                <th scope="col">Update status</th>
                <th scope="col" className="num">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="mono">#{shortId(o._id)}</td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td className="num">
                    {o.items.reduce((n, i) => n + i.quantity, 0)}
                  </td>
                  <td>
                    <StatusPill status={o.status} />
                  </td>
                  <td>
                    <select
                      className="select status-select"
                      aria-label={`Update status for order ${shortId(o._id)}`}
                      value={o.status}
                      disabled={mutation.isPending}
                      onChange={(e) =>
                        mutation.mutate({
                          id: o._id,
                          status: e.target.value as OrderStatus,
                        })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s[0].toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="num">{formatPrice(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
