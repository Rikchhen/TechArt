import { useState } from 'react'
import { Icon } from './Icon'

interface PasswordInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  describedBy?: string
  autoFocus?: boolean
  'aria-label'?: string
}

/**
 * Password field with a show/hide toggle. The toggle is a real button with an
 * aria-label and aria-pressed so screen readers announce the current state, and
 * it's excluded from the tab order's surprise by sitting right after the input.
 */
export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  describedBy,
  autoFocus,
  'aria-label': ariaLabel,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field">
      <input
        id={id}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        className="input"
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
      </button>
    </div>
  )
}
