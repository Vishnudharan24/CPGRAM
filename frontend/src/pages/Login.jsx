import { useState } from 'react'
import { api, saveSession } from '../api/client.js'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: 'Ananya Sharma', email: 'ananya@example.com', password: 'password', role: 'citizen' })
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      const session = await api(mode === 'login' ? '/auth/login' : '/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      saveSession(session)
      onLogin()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="panel narrow stack">
      <div className="segmented">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
      </div>
      <form onSubmit={submit} className="stack">
        {mode === 'register' && <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {mode === 'register' && (
          <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="citizen">Citizen</option>
            <option value="officer">Officer</option>
            <option value="admin">Admin</option>
          </select></label>
        )}
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
      </form>

      {mode === 'login' && (
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Demo Credentials (password: password)</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li><button type="button" onClick={() => setForm({ ...form, email: 'ananya@example.com' })} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0 }}>Citizen: ananya@example.com</button></li>
            <li><button type="button" onClick={() => setForm({ ...form, email: 'officer@example.com' })} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0 }}>Officer: officer@example.com</button></li>
            <li><button type="button" onClick={() => setForm({ ...form, email: 'admin@example.com' })} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0 }}>Admin: admin@example.com</button></li>
          </ul>
        </div>
      )}
    </section>
  )
}
