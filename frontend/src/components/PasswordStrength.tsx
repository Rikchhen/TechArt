import { useMemo } from 'react'
import zxcvbn from 'zxcvbn'

const LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = [
  'var(--color-danger)',
  'var(--color-danger)',
  'var(--color-warn)',
  'var(--color-info)',
  'var(--color-success)',
]

export function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => {
    if (!password) return -1
    return zxcvbn(password).score // 0..4
  }, [password])

  if (score < 0) return null

  return (
    <div className="pw-strength" aria-live="polite">
      <div className="pw-bars">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="pw-bar"
            style={{
              background: i <= score ? COLORS[score] : 'var(--color-border)',
            }}
          />
        ))}
      </div>
      <span className="pw-label" style={{ color: COLORS[score] }}>
        {LABELS[score]}
      </span>
    </div>
  )
}
