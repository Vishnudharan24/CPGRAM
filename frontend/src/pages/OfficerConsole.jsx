import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

export default function OfficerConsole() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState('')
  const [atr, setAtr] = useState('Matter has been resolved as per rules. No further action is required.')
  const [decision, setDecision] = useState('Appeal reviewed. The office must provide a case-specific response within seven working days.')
  const [message, setMessage] = useState('')

  async function load() {
    try {
      const data = await api('/grievances')
      setItems(data)
      setSelected((current) => current || data[0]?.id || '')
    } catch (err) {
      setMessage(err.message)
    }
  }

  useEffect(() => { load() }, [])

  async function fileAtr() {
    try {
      await api(`/grievances/${selected}/atr`, { method: 'POST', body: JSON.stringify({ content: atr, mark_resolved: true }) })
      setMessage('ATR filed and grievance marked resolved.')
      load()
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function decideAppeal() {
    try {
      await api(`/grievances/${selected}/appeal/decision`, { method: 'POST', body: JSON.stringify({ decision }) })
      setMessage('Appeal decision recorded.')
      load()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <section className="workspace two-col">
      <div className="panel">
        <p className="eyebrow">Demo officer console</p>
        <h1>Act on a grievance</h1>
        <label>Case<select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {items.map((item) => <option key={item.id} value={item.id}>{item.registration_id} · {item.status}</option>)}
        </select></label>
        <label>ATR content<textarea rows={6} value={atr} onChange={(e) => setAtr(e.target.value)} /></label>
        <button className="primary" disabled={!selected} onClick={fileAtr}>File ATR and resolve</button>
        {message && <p className="notice">{message}</p>}
      </div>
      <div className="panel">
        <p className="eyebrow">NAA action</p>
        <h1>Decide appeal</h1>
        <label>Decision<textarea rows={7} value={decision} onChange={(e) => setDecision(e.target.value)} /></label>
        <button disabled={!selected} onClick={decideAppeal}>Record appeal decision</button>
      </div>
    </section>
  )
}
