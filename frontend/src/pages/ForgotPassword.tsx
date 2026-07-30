import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { forgotPassword } from '../api/auth'
import { Field } from '../components/Field'
import { Spinner } from '../components/Spinner'
import { Icon } from '../components/Icon'
import { errorMessage } from '../api/client'

const schema = z.string().trim().email()

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const request = useMutation({
    mutationFn: () => forgotPassword(email.trim()),
    onSuccess: (msg) => setMessage(msg),
    onError: (e) => setError(errorMessage(e, 'Could not send reset email')),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!schema.safeParse(email).success) {
      setError('Enter a valid email')
      return
    }
    setError('')
    request.mutate()
  }

  if (message) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <span className="auth-badge">
            <Icon name="check-circle" size={22} />
          </span>
          <h1 className="auth-title">Check your inbox</h1>
          <div className="alert alert-info" role="status">
            {message}
          </div>
          <p className="muted auth-sub">
            The link expires in 30 minutes and can only be used once.
          </p>
          <Link to="/login" className="btn btn-primary btn-block">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Reset your password</h1>
        <p className="muted auth-sub">
          Enter your email and we'll send you a link to set a new password.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="auth-form">
          <Field label="Email">
            {({ id }) => (
              <input
                id={id}
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Field>
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={request.isPending}
          >
            {request.isPending ? <Spinner label="Sending" /> : 'Send reset link'}
          </button>
        </form>

        <p className="muted auth-alt">
          Remembered it?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
