import { api } from './client'

export interface TwoFactorSetup {
  qr: string // data: URL of the QR code
  secret: string // base32 secret for manual entry
  otpauthUrl: string
}

export async function setupTwoFactor(): Promise<TwoFactorSetup> {
  const { data } = await api.post<TwoFactorSetup>('/auth/2fa/setup')
  return data
}

export async function enableTwoFactor(code: string): Promise<string[]> {
  const { data } = await api.post<{ backupCodes: string[] }>('/auth/2fa/enable', {
    code,
  })
  return data.backupCodes
}

export async function disableTwoFactor(password: string): Promise<void> {
  await api.post('/auth/2fa/disable', { password })
}
