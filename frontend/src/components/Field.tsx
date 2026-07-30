import { useId, type ReactNode } from 'react'

interface FieldProps {
  label: string
  error?: string
  hint?: ReactNode
  children: (props: { id: string; describedBy?: string }) => ReactNode
}

/**
 * Pairs a real <label> with a control and wires aria-describedby to the error
 * or hint. The render-prop hands the generated id back to the input.
 */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const msgId = error || hint ? `${id}-msg` : undefined

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children({ id, describedBy: msgId })}
      {error ? (
        <p id={msgId} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
