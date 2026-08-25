import { useState } from 'react'
import { api, saveSession } from '../api/client.js'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: 'Ananya Sharma',
    gender: '',
    premise_name: '',
    sub_locality: '',
    locality: '',
    country: 'India',
    state: '',
    district: '',
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
      <form onSubmit={submit} className={`stack ${mode === 'register' ? 'registration-form' : ''}`}>
        {mode === 'register' && <>
          <label>Name<input required minLength="2" maxLength="100" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Gender<select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Select gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select></label>
          <div className="form-grid">
            <label>Premise name<input required value={form.premise_name} onChange={(e) => setForm({ ...form, premise_name: e.target.value })} /></label>
            <label>Sub-locality<input required value={form.sub_locality} onChange={(e) => setForm({ ...form, sub_locality: e.target.value })} /></label>
            <label>Locality<input required value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} /></label>
            <label>Country<input required autoComplete="country-name" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
            <label>State<input required autoComplete="address-level1" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></label>
            <label>District<input required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></label>
            <label>Pincode<input required inputMode="numeric" autoComplete="postal-code" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></label>
          </div>
          <label>Mobile number<input required inputMode="numeric" pattern="[0-9]{10}" maxLength="10" autoComplete="tel" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} /></label>
          <label>Phone number <span className="muted">(optional)</span><input pattern="(?=.*[0-9])[0-9+() -]+" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        </>}
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
    </section>
  )
}
