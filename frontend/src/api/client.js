const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function readBody(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : null),
      ...(headers || null),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await readBody(res)
  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.status}`, {
      status: res.status,
      body: data,
    })
  }
  return data
}

