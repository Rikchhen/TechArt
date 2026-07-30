import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  verifyEmailToken,
  verifyEmailCode,
  sendVerificationEmail,
} from '../api/auth'
import { Field } from '../components/Field'
import { Spinner } from '../components/Spinner'
import { Icon } from '../components/Icon'
import { useMe } from '../hooks/useAuth'
import { errorMessage } from '../api/client'
import { useToast } from '../toast/ToastContext'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { user } = useMe()
  const qc = useQueryClient()
  const toast = useToast()

  const [email, setEmail] = useState(user?.email ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const attempted = useRef(false)

  const refreshUser = () => {
    qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    qc.invalidateQueries({ queryKey: ['profile'] })
  }

  const byToken = useMutation({
    mutationFn: (t: string) => verifyEmailToken(t),
    onSuccess: () => {
      setVerified(true)
      setError('')
      refreshUser()
    },
    onError: (e) => setError(errorMessage(e, 'Verification failed')),
  })

  const byCode = useMutation({
    mutationFn: () => verifyEmailCode(email, code.trim()),
    onSuccess: () => {
      setVerified(true)
      setError('')
      refreshUser()
    },
    onError: (e) => setError(errorMessage(e, 'Invalid or expired code')),
  })

  const resend = useMutation({
    mutationFn: sendVerificationEmail,
    onSuccess: () => toast.success('Verification email sent — check your inbox'),
    onError: (e) => toast.error(errorMessage(e, 'Could not send email')),
  })

  // A link click lands here with ?token=… — verify it once automatically.
  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true
      byToken.mutate(token)
    }
  }, [token, byToken])

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email)
  }, [user, email])

  if (verified || user?.emailVerified) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <span className="auth-badge">
            <Icon name="check-circle" size={22} />
          </span>
          <h1 className="auth-title">Email verified</h1>
          <p className="muted auth-sub">
            Thanks — your address is confirmed and your account is secured.
          </p>
          <Link to="/" className="btn btn-primary btn-block">
            Continue to catalog
          </Link>
        </div>
      </div>
    )
  }

  if (token && byToken.isPending) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1 className="auth-title">Verifying…</h1>
          <p className="muted auth-sub">
            <Spinner label="Verifying" /> Checking your verification link.
          </p>
        </div>
      </div>
    )
  }

  function onCodeSubmit(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your email')
      return
    }
    byCode.mutate()
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <span className="auth-badge">
          <Icon name="shield" size={22} />
        </span>
        <h1 className="auth-title">Verify your email</h1>
        <p className="muted auth-sub">
          We emailed you a link and a 6-digit code. Use either one — they expire
          in 30 minutes.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onCodeSubmit} noValidate className="auth-form">
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
          <Field label="6-digit code">
            {({ id }) => (
              <input
                id={id}
                className="input code-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            )}
          </Field>
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={byCode.isPending}
          >
            {byCode.isPending ? <Spinner label="Verifying" /> : 'Verify email'}
          </button>
        </form>

        {user && (
          <button
            className="link auth-alt"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
          >
            {resend.isPending ? 'Sending…' : "Didn't get it? Resend email"}
          </button>
        )}
      </div>
    </div>
  )
}
