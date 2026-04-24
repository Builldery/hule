export const TOKEN_STORAGE_KEY = 'hule.token'
export const CURRENT_WORKSPACE_STORAGE_KEY = 'hule.currentWorkspaceId'

export class HttpError extends Error {
  readonly status: number
  readonly body: unknown
  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.status = status
    this.body = body
  }
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function handleUnauthorized(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(CURRENT_WORKSPACE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

export async function http<T = unknown>(input: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init.body != null && !(init.body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    let body: unknown = null
    try { body = await res.json() } catch { body = await res.text().catch(() => null) }
    if (res.status === 401) handleUnauthorized()
    throw new HttpError(res.status, body, `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
