import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Field } from '../components/Field'
import { Spinner } from '../components/Spinner'
import { Icon } from '../components/Icon'
import { PasswordInput } from '../components/PasswordInput'
import { useLogin, useTwoFactorLogin } from '../hooks/useAuth'
import { useToast } from '../toast/ToastContext'
import { errorMessage } from '../api/client'
import { getAuthConfig, type AuthConfig } from '../api/auth'
import { Recaptcha } from '../components/Recaptcha'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

interface LocationState {
  from?: string
}

export default function Login() {
  const login = useLogin()
  const twoFactor = useTwoFactorLogin()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from ?? '/'

  const [step, setStep] = useState<'password' | '2fa'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [authConfig, setAuthConfig] = useState<AuthConfig>()
  const [recaptchaToken, setRecaptchaToken] = useState<string>()

  useEffect(() => {
    void getAuthConfig().then(setAuthConfig).catch(() => undefined)
  }, [])

  function finish(name: string) {
    toast.success(`Welcome back, ${name.split(' ')[0]}`)
    navigate(from, { replace: true })
  }

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const parsed = schema.safeParse({ email, password })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    try {
      const result = await login.mutateAsync({ ...parsed.data, recaptchaToken })
      if (result.twoFactorRequired) {
        setStep('2fa')
      } else {
        finish(result.user.name)
      }
    } catch (err) {
      setFormError(errorMessage(err, 'Sign in failed'))
    }
  }

  async function onCodeSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (code.trim().length < 6) {
      setFormError('Enter your 6-digit code or a backup code')
      return
    }
    try {
      const user = await twoFactor.mutateAsync(code.trim())
      finish(user.name)
    } catch (err) {
      setFormError(errorMessage(err, 'Invalid code'))
    }
  }

  if (step === '2fa') {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <span className="auth-badge">
            <Icon name="shield" size={22} />
          </span>
          <h1 className="auth-title">Two-factor authentication</h1>
          <p className="muted auth-sub">
            Enter the 6-digit code from your authenticator app, or a backup code.
          </p>

          {formError && (
            <div className="alert alert-error" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={onCodeSubmit} noValidate className="auth-form">
            <Field label="Authentication code">
              {({ id }) => (
                <input
                  id={id}
                  className="input code-input"
                  inputMode="text"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              )}
            </Field>
            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={twoFactor.isPending}
            >
              {twoFactor.isPending ? <Spinner label="Verifying" /> : 'Verify'}
            </button>
          </form>

          <button
            className="link auth-alt"
            onClick={() => {
              setStep('password')
              setCode('')
              setFormError('')
            }}
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Sign in</h1>
        <p className="muted auth-sub">Welcome back to TechArt.</p>

        {from !== '/' && !formError && (
          <div className="alert alert-info" role="status">
            {from === '/checkout'
              ? 'Please sign in to complete your checkout.'
              : 'Please sign in to continue.'}
          </div>
        )}

        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={onPasswordSubmit} noValidate className="auth-form">
          <Field label="Email" error={errors.email}>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Field>

          <Recaptcha siteKey={authConfig?.recaptchaSiteKey} onToken={setRecaptchaToken} />

          <Field
            label="Password"
            error={errors.password}
            hint={
              <Link to="/forgot-password" className="link">
                Forgot password?
              </Link>
            }
          >
            {({ id, describedBy }) => (
              <PasswordInput
                id={id}
                describedBy={describedBy}
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
              />
            )}
          </Field>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={login.isPending}
          >
            {login.isPending ? <Spinner label="Signing in" /> : 'Sign in'}
          </button>
        </form>

        {authConfig?.googleEnabled && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <a className="btn btn-ghost btn-block" href="/api/auth/google">
              Continue with Google
            </a>
          </>
        )}

        <p className="muted auth-alt">
          New here?{' '}
          <Link to="/register" className="link">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
