import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Field } from '../components/Field'
import { Spinner } from '../components/Spinner'
import { PasswordStrength } from '../components/PasswordStrength'
import { PasswordInput } from '../components/PasswordInput'
import { useLogin, useRegister } from '../hooks/useAuth'
import { useToast } from '../toast/ToastContext'
import { errorMessage } from '../api/client'
import { getAuthConfig, type AuthConfig } from '../api/auth'
import { Recaptcha } from '../components/Recaptcha'

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

export default function Register() {
  const register = useRegister()
  const login = useLogin()
  const toast = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [authConfig, setAuthConfig] = useState<AuthConfig>()
  const [recaptchaToken, setRecaptchaToken] = useState<string>()

  useEffect(() => {
    void getAuthConfig().then(setAuthConfig).catch(() => undefined)
  }, [])

  const busy = register.isPending || login.isPending

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const parsed = schema.safeParse({ name, email, password })
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
      await register.mutateAsync({ ...parsed.data, recaptchaToken })
      // Sign the new customer straight in for a smooth first-run experience.
      // A brand-new account never has 2FA, so this completes in one step.
      const result = await login.mutateAsync({
        email: parsed.data.email,
        password: parsed.data.password,
      })
      if (!result.twoFactorRequired) {
        toast.success(
          `Account created — welcome, ${result.user.name.split(' ')[0]}!`,
        )
      }
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(errorMessage(err, 'Registration failed'))
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Create your account</h1>
        <p className="muted auth-sub">Join TechArt in a few seconds.</p>

        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate className="auth-form">
          <Field label="Full name" error={errors.name}>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                className="input"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </Field>

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

          <Field
            label="Password"
            error={errors.password}
            hint="At least 8 characters."
          >
            {({ id, describedBy }) => (
              <PasswordInput
                id={id}
                describedBy={describedBy}
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
              />
            )}
          </Field>
          <PasswordStrength password={password} />
          <Recaptcha siteKey={authConfig?.recaptchaSiteKey} onToken={setRecaptchaToken} />

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={busy}
          >
            {busy ? <Spinner label="Creating account" /> : 'Create account'}
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
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
