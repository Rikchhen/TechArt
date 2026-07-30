import axios, { AxiosError } from 'axios'

/*
  Single axios instance for the whole app.

  - baseURL '/api' is proxied to the Express backend by Vite in dev (see
    vite.config.ts), so the SPA and API are same-origin and the session cookie
    flows automatically. withCredentials keeps that working if the app is ever
    served cross-origin instead.
*/
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

const MUTATING = new Set(['post', 'put', 'patch', 'delete'])

// In-memory CSRF token (double-submit). Matched against the csrfToken cookie by
// the server on every mutating request.
let csrfToken: string | null = null

/**
 * Fetches a fresh CSRF token (the server also sets the matching cookie).
 * Primed once at startup from main.tsx; mutations lazily fetch it if missing.
 */
export async function ensureCsrfToken(): Promise<void> {
  try {
    const { data } = await api.get<{ csrfToken: string }>('/csrf')
    csrfToken = data.csrfToken
  } catch {
    // Leave null — the request interceptor will try again on the next mutation.
  }
}

// Attach the CSRF header to every state-changing request.
api.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (MUTATING.has(method)) {
    if (!csrfToken) await ensureCsrfToken()
    if (csrfToken) config.headers.set('x-csrf-token', csrfToken)
  }
  return config
})

// If a token goes stale (e.g. cookie expired), refresh once and retry.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as
      | (typeof error.config & { _csrfRetry?: boolean })
      | undefined
    const isCsrf =
      error.response?.status === 403 &&
      (error.response.data as { message?: string } | undefined)?.message
        ?.toLowerCase()
        .includes('csrf')

    if (isCsrf && config && !config._csrfRetry) {
      config._csrfRetry = true
      csrfToken = null
      await ensureCsrfToken()
      if (csrfToken) config.headers?.set?.('x-csrf-token', csrfToken)
      return api.request(config)
    }
    return Promise.reject(error)
  },
)

/** Normalise an axios error into a human-readable message. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    if (data?.errors) {
      const first = Object.values(data.errors).flat()[0]
      if (first) return first
    }
    if (data?.message) return data.message
    if (err.message) return err.message
  }
  if (err instanceof Error) return err.message
  return fallback
}
