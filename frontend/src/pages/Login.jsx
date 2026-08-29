import { useState } from 'react'
import { api, saveSession } from '../api/client.js'
import { STATES } from '../utils/states.js'
import { DISTRICTS } from '../utils/districts.js'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: 'Ananya Sharma',
    gender: '',
    premise_name: '',
    sub_locality: '',
    locality: '',
    country: 'India',
    state_code: STATES[0].code,
    district_code: DISTRICTS.find(d => d.state_code === STATES[0].code)?.code || '',
    pincode: '',
    mobile_number: '',
    phone: '',
    email: 'ananya@example.com',
    password: 'password',
    confirm_password: 'password',
    role: 'citizen'
  })
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      const session = await api(mode === 'login' ? '/auth/login' : '/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      if (window.location.pathname === '/officer' && session.role === 'citizen') {
        throw new Error('This login portal is for officers only. Please use the standard citizen login.')
      }
      if (window.location.pathname !== '/officer' && session.role !== 'citizen') {
        throw new Error('This login portal is for citizens only. Please use the officer login.')
      }
      saveSession(session)
      onLogin()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="panel narrow">
      <div className="segmented">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
      </div>
      <form onSubmit={submit} className="stack">
        {mode === 'register' && <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {mode === 'register' && (
          <>
          <label>Confirm password<input required type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} /></label>
          </>
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
