import { Icon } from './Icon'

interface PaginationProps {
  page: number
  limit: number
  total: number
  onPage: (page: number) => void
}

export function Pagination({ page, limit, total, onPage }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit))
  if (pages <= 1) return null

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
      >
        <Icon name="arrow-left" size={16} />
        Prev
      </button>
      <span className="muted pagination-status">
        Page {page} of {pages}
      </span>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
      >
        Next
        <Icon name="arrow-right" size={16} />
      </button>
    </nav>
  )
}
