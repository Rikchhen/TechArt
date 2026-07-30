import { api } from './client'
import type { User } from '../types'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  recaptchaToken?: string
}

export interface LoginPayload {
  email: string
  password: string
  recaptchaToken?: string
}

export interface AuthConfig {
  googleEnabled: boolean
  recaptchaSiteKey?: string
}

export async function getAuthConfig(): Promise<AuthConfig> {
  const { data } = await api.get<AuthConfig>('/auth/config')
  return data
}

export async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await api.get<{ user: User }>('/auth/me')
    return data.user
  } catch {
    // 401 = not authenticated; treat as "no user" rather than an error.
    return null
  }
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/register', payload)
  return data.user
}

export type LoginResult =
  | { twoFactorRequired: true }
  | { twoFactorRequired: false; user: User }

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await api.post<{ user?: User; twoFactorRequired?: boolean }>(
    '/auth/login',
    payload,
  )
  if (data.twoFactorRequired) return { twoFactorRequired: true }
  return { twoFactorRequired: false, user: data.user as User }
}

/** Second step: submit a TOTP or backup code to finish a 2FA login. */
export async function twoFactorLogin(code: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/login/2fa', { code })
  return data.user
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

/* ---- Email verification & password reset ---- */

/** Resends the verification email to the signed-in user. */
export async function sendVerificationEmail(): Promise<void> {
  await api.post('/auth/verify-email/send')
}

/** Verifies using the token from the emailed link. */
export async function verifyEmailToken(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token })
}

/** Verifies using the 6-digit code from the email. */
export async function verifyEmailCode(
  email: string,
  code: string,
): Promise<void> {
  await api.post('/auth/verify-email/code', { email, code })
}

/** Always resolves — the API never reveals whether the address exists. */
export async function forgotPassword(email: string): Promise<string> {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', {
    email,
  })
  return data.message
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  await api.post('/auth/reset-password', { token, newPassword })
}
