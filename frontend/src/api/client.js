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

export async function api(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || 'Request failed')
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
