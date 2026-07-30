import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  type TwoFactorSetup,
} from '../api/twofa'
import {
  changePassword,
  listSessions,
  revokeOtherSessions,
} from '../api/users'
import { Field } from './Field'
import { Spinner } from './Spinner'
import { Icon } from './Icon'
import { PasswordStrength } from './PasswordStrength'
import { PasswordInput } from './PasswordInput'
import { useMe } from '../hooks/useAuth'
import { useToast } from '../toast/ToastContext'
import { errorMessage } from '../api/client'

function TwoFactorSection() {
  const { user } = useMe()
  const qc = useQueryClient()
  const toast = useToast()

  const [stage, setStage] = useState<'idle' | 'setup' | 'backup'>('idle')
  const [data, setData] = useState<TwoFactorSetup | null>(null)
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [disarmPassword, setDisarmPassword] = useState('')
  const [showDisable, setShowDisable] = useState(false)
  const [error, setError] = useState('')

  const refreshUser = () => {
    qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    qc.invalidateQueries({ queryKey: ['profile'] })
  }

  const setup = useMutation({
    mutationFn: setupTwoFactor,
    onSuccess: (d) => {
      setData(d)
      setStage('setup')
      setError('')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const enable = useMutation({
    mutationFn: (c: string) => enableTwoFactor(c),
    onSuccess: (codes) => {
      setBackupCodes(codes)
      setStage('backup')
      setCode('')
      setError('')
      refreshUser()
    },
    onError: (e) => setError(errorMessage(e, 'Invalid code')),
  })

  const disable = useMutation({
    mutationFn: (pw: string) => disableTwoFactor(pw),
    onSuccess: () => {
      setShowDisable(false)
      setDisarmPassword('')
      toast.success('Two-factor authentication disabled')
      refreshUser()
    },
    onError: (e) => setError(errorMessage(e, 'Could not disable 2FA')),
  })

  function downloadCodes() {
    const blob = new Blob(
      [
        'TechArt — two-factor backup codes\n',
        'Each code works once. Keep them somewhere safe.\n\n',
        ...backupCodes.map((c) => c + '\n'),
      ],
      { type: 'text/plain' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'techart-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Rendering ---
  if (stage === 'backup') {
    return (
      <div className="security-block">
        <h3>Save your backup codes</h3>
        <p className="muted">
          Store these somewhere safe. Each code can be used once if you lose your
          authenticator. They won't be shown again.
        </p>
        <ul className="backup-codes">
          {backupCodes.map((c) => (
            <li key={c} className="mono">
              {c}
            </li>
          ))}
        </ul>
        <div className="security-actions">
          <button className="btn btn-ghost btn-sm" onClick={downloadCodes}>
            <Icon name="package" size={15} />
            Download
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setStage('idle')}
          >
            I've saved them
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'setup' && data) {
    return (
      <div className="security-block">
        <h3>Set up authenticator</h3>
        <p className="muted">
          Scan this QR code with Google Authenticator, Authy, or 1Password — then
          enter the 6-digit code to confirm.
        </p>
        <div className="twofa-setup">
          <img src={data.qr} alt="Two-factor QR code" className="twofa-qr" />
          <div className="twofa-manual">
            <span className="muted">Or enter this key manually:</span>
            <code className="mono twofa-secret">{data.secret}</code>
          </div>
        </div>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        <form
          className="security-actions"
          onSubmit={(e) => {
            e.preventDefault()
            enable.mutate(code.trim())
          }}
        >
          <input
            className="input code-input"
            placeholder="123456"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="6-digit code"
          />
          <button
            className="btn btn-primary btn-sm"
            type="submit"
            disabled={enable.isPending}
          >
            {enable.isPending ? <Spinner label="Enabling" /> : 'Verify & enable'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setStage('idle')
              setError('')
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="security-block">
      <div className="security-row">
        <div>
          <h3>Two-factor authentication</h3>
          <p className="muted">
            {user?.twoFactorEnabled
              ? 'An authenticator app is required at sign-in.'
              : 'Add a second step at sign-in with an authenticator app.'}
          </p>
        </div>
        {user?.twoFactorEnabled ? (
          <span className="pill security-on">
            <Icon name="check" size={14} /> On
          </span>
        ) : (
          <span className="pill security-off">Off</span>
        )}
      </div>

      {user?.twoFactorEnabled ? (
        showDisable ? (
          <form
            className="security-inline-form"
            onSubmit={(e) => {
              e.preventDefault()
              disable.mutate(disarmPassword)
            }}
          >
            <PasswordInput
              placeholder="Confirm your password"
              autoComplete="current-password"
              value={disarmPassword}
              onChange={setDisarmPassword}
              aria-label="Confirm password to disable 2FA"
            />
            {error && <p className="field-error">{error}</p>}
            <div className="security-actions">
              <button
                className="btn btn-danger btn-sm"
                type="submit"
                disabled={disable.isPending}
              >
                {disable.isPending ? <Spinner label="Disabling" /> : 'Disable 2FA'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowDisable(false)
                  setError('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setShowDisable(true)
              setError('')
            }}
          >
            Disable
          </button>
        )
      ) : (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setup.mutate()}
          disabled={setup.isPending}
        >
          {setup.isPending ? <Spinner label="Preparing" /> : 'Enable 2FA'}
        </button>
      )}
    </div>
  )
}

function ChangePasswordSection() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: (revoked) => {
      setCurrent('')
      setNext('')
      setError('')
      toast.success(
        revoked > 0
          ? `Password changed — signed out ${revoked} other device(s)`
          : 'Password changed',
      )
    },
    onError: (e) => setError(errorMessage(e, 'Could not change password')),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (next.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="security-block">
      <h3>Change password</h3>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="security-form">
        <Field label="Current password">
          {({ id }) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              value={current}
              onChange={setCurrent}
            />
          )}
        </Field>
        <Field label="New password" hint="At least 8 characters.">
          {({ id }) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              value={next}
              onChange={setNext}
            />
          )}
        </Field>
        <PasswordStrength password={next} />
        <button
          className="btn btn-primary btn-sm"
          type="submit"
          disabled={mutation.isPending || !current || !next}
        >
          {mutation.isPending ? <Spinner label="Saving" /> : 'Update password'}
        </button>
      </form>
    </div>
  )
}

function SessionsSection() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: listSessions,
  })

  const revoke = useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success(
        n > 0 ? `Signed out ${n} other device(s)` : 'No other sessions',
      )
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const others = (sessions ?? []).filter((s) => !s.current).length

  return (
    <div className="security-block">
      <div className="security-row">
        <div>
          <h3>Active sessions</h3>
          <p className="muted">Devices currently signed in to your account.</p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => revoke.mutate()}
          disabled={revoke.isPending || others === 0}
        >
          <Icon name="log-out" size={15} />
          Log out other devices
        </button>
      </div>

      {isLoading ? (
        <Spinner label="Loading sessions" />
      ) : (
        <ul className="session-list">
          {(sessions ?? []).map((s) => (
            <li key={s.id} className="session-item">
              <span className="session-icon">
                <Icon name="shield" size={18} />
              </span>
              <div className="session-info">
                <span className="session-ua">
                  {s.userAgent || 'Unknown device'}
                  {s.current && <span className="session-current">This device</span>}
                </span>
                <span className="muted session-meta">
                  {s.ip ? `IP ${s.ip}` : 'IP unknown'}
                  {s.createdAt
                    ? ` · since ${new Date(s.createdAt).toLocaleString()}`
                    : ''}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SecuritySettings() {
  return (
    <div className="card security-card">
      <h2 className="security-heading">
        <Icon name="shield" size={20} />
        Security
      </h2>
      <TwoFactorSection />
      <hr className="security-divider" />
      <ChangePasswordSection />
      <hr className="security-divider" />
      <SessionsSection />
    </div>
  )
}
