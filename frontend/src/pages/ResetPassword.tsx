import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { resetPassword } from '../api/auth'
import { Field } from '../components/Field'
import { Spinner } from '../components/Spinner'
import { Icon } from '../components/Icon'
import { PasswordInput } from '../components/PasswordInput'
import { PasswordStrength } from '../components/PasswordStrength'
import { errorMessage } from '../api/client'
import { useToast } from '../toast/ToastContext'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const toast = useToast()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const reset = useMutation({
    mutationFn: () => resetPassword(token, password),
    onSuccess: () => {
      toast.success('Password updated — please sign in')
      navigate('/login', { replace: true })
    },
    onError: (e) => setError(errorMessage(e, 'Could not reset password')),
  })

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1 className="auth-title">Invalid reset link</h1>
          <p className="muted auth-sub">
            This link is missing its token. Request a new one to continue.
          </p>
          <Link to="/forgot-password" className="btn btn-primary btn-block">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setError('')
    reset.mutate()
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <span className="auth-badge">
          <Icon name="shield" size={22} />
        </span>
        <h1 className="auth-title">Set a new password</h1>
        <p className="muted auth-sub">
          Choose a strong password. This will sign you out on all devices.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="auth-form">
          <Field label="New password" hint="At least 8 characters.">
            {({ id }) => (
              <PasswordInput
                id={id}
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
              />
            )}
          </Field>
          <PasswordStrength password={password} />
          <Field label="Confirm new password">
            {({ id }) => (
              <PasswordInput
                id={id}
                autoComplete="new-password"
                value={confirm}
                onChange={setConfirm}
              />
            )}
          </Field>
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={reset.isPending}
          >
            {reset.isPending ? <Spinner label="Updating" /> : 'Update password'}
          </button>
        </form>

        <p className="muted auth-alt">
          <Link to="/login" className="link">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
