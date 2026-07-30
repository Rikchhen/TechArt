import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  message?: ReactNode
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <div className="empty-state card">
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <h2 className="empty-state-title">{title}</h2>
      {message ? <p className="muted">{message}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  )
}
