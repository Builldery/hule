export class HttpError extends Error {
  readonly status: number
  readonly body: unknown
  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.status = status
    this.body = body
  }
}

export async function http<T = unknown>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init.body != null && !(init.body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    let body: unknown = null
    try { body = await res.json() } catch { body = await res.text().catch(() => null) }
    throw new HttpError(res.status, body, `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
