import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  twoFactorLogin as twoFactorLoginRequest,
  type LoginPayload,
  type LoginResult,
  type RegisterPayload,
} from '../api/auth'
import type { User } from '../types'

const ME_KEY = ['auth', 'me'] as const

/** Current session user (null when unauthenticated). */
export function useMe() {
  const query = useQuery<User | null>({
    queryKey: ME_KEY,
    queryFn: fetchMe,
    staleTime: 60_000,
  })
  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAdmin: query.data?.role === 'admin',
  }
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation<LoginResult, unknown, LoginPayload>({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (result) => {
      // Only cache the user when the login is fully complete (no 2FA pending).
      if (!result.twoFactorRequired) qc.setQueryData(ME_KEY, result.user)
    },
  })
}

export function useTwoFactorLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => twoFactorLoginRequest(code),
    onSuccess: (user) => {
      qc.setQueryData(ME_KEY, user)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => logoutRequest(),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null)
      // Order history is user-specific — drop it on sign out.
      qc.removeQueries({ queryKey: ['orders'] })
    },
  })
}
