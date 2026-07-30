import { api } from './client'
import type { SessionInfo, User } from '../types'

export async function getProfile(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/users/me/profile')
  return data.user
}

export async function updateProfile(name: string): Promise<User> {
  const { data } = await api.patch<{ user: User }>('/users/me/profile', { name })
  return data.user
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<number> {
  const { data } = await api.patch<{ revokedSessions: number }>(
    '/users/me/password',
    { currentPassword, newPassword },
  )
  return data.revokedSessions
}

export async function listSessions(): Promise<SessionInfo[]> {
  const { data } = await api.get<{ sessions: SessionInfo[] }>(
    '/users/me/sessions',
  )
  return data.sessions
}

export async function revokeOtherSessions(): Promise<number> {
  const { data } = await api.delete<{ revoked: number }>('/users/me/sessions')
  return data.revoked
}
