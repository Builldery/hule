export class HttpError extends Error {
    status;
    body;
    constructor(status, body, message) {
        super(message);
        this.status = status;
        this.body = body;
    }
}
export async function http(input, init = {}) {
    const res = await fetch(input, {
        ...init,
        headers: {
            ...(init.body != null && !(init.body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
            ...(init.headers ?? {}),
        },
    });
    if (!res.ok) {
        let body = null;
        try {
            body = await res.json();
        }
        catch {
            body = await res.text().catch(() => null);
        }
        throw new HttpError(res.status, body, `HTTP ${res.status}`);
    }
    if (res.status === 204)
        return undefined;
    return res.json();
}
