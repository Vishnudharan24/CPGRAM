const API_BASE = '/api'

export function getToken() {
  return localStorage.getItem('cpgrams_token')
}

export function saveSession(session) {
  localStorage.setItem('cpgrams_token', session.access_token)
  localStorage.setItem('cpgrams_user', JSON.stringify({ name: session.name, email: session.email, role: session.role }))
}

export function getUser() {
  const raw = localStorage.getItem('cpgrams_user')
  return raw ? JSON.parse(raw) : null
}

export function clearSession() {
  localStorage.removeItem('cpgrams_token')
  localStorage.removeItem('cpgrams_user')
}

function formatApiError(detail) {
  if (Array.isArray(detail)) {
    return detail.map((item) => {
      const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : 'form'
      return `${field}: ${item.msg}`
    }).join('; ')
  }
  return typeof detail === 'string' ? detail : 'Request failed'
}

export async function api(path, options = {}) {
  const token = getToken()
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(formatApiError(data.detail))
  }
  return data
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(value))
}
