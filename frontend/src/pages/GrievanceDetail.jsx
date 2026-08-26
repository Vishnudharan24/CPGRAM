import { useEffect, useState } from 'react'
import { api, formatDateTime } from '../api/client.js'
import ATRQualityBadge from '../components/ATRQualityBadge.jsx'
import RoutingTrail from '../components/RoutingTrail.jsx'
import SLAClock from '../components/SLAClock.jsx'

export default function GrievanceDetail({ id }) {
  const [item, setItem] = useState(null)
  const [appealText, setAppealText] = useState('The ATR is generic and does not address the exact facts of my case.')
  const [error, setError] = useState('')

  async function load() {
    try {
      setItem(await api(`/grievances/${id}`))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [id])

  async function rate(rating) {
    setError('')
    try {
      setItem(await api(`/grievances/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating }) }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function appeal() {
    setError('')
    try {
      setItem(await api(`/grievances/${id}/appeal`, { method: 'POST', body: JSON.stringify({ text: appealText }) }))
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return <section className="panel"><p className="error">{error}</p></section>
  if (!item) return <section className="panel"><p>Loading...</p></section>

  return (
    <section className="workspace detail">
      <div className="section-head">
        <div>
          <p className="eyebrow">{item.registration_id}</p>
          <h1>{item.category} · {item.status.replace('_', ' ')}</h1>
          <p className="muted">Organisation: <strong>{item.organization_name}</strong> ({item.organization_code})</p>
          <p>{item.raw_description}</p>
        </div>
        <SLAClock windows={item.review_windows} />
      </div>
      <div className="two-col">
        <div className="panel">
          <h2>Routing trail</h2>
          <RoutingTrail events={item.events} />
        </div>
        <div className="panel">
          <h2>Action Taken Report</h2>
          {item.atrs.length ? item.atrs.map((atr) => (
            <article className="atr" key={atr.id}>
              <ATRQualityBadge flag={atr.quality_flag} />
              <p>{atr.content}</p>
              <small>{formatDateTime(atr.created_at)}</small>
            </article>
          )) : <p className="muted">No ATR has been filed yet.</p>}
          {item.status === 'resolved' && (
            <div className="rating-box">
              <p>Rating this resolution <strong>Poor</strong> opens a 30-day appeal window automatically.</p>
              <button onClick={() => rate('good')}>Good</button>
              <button onClick={() => rate('average')}>Average</button>
              <button className="danger" onClick={() => rate('poor')}>Poor</button>
            </div>
          )}
          {item.status === 'appeal_open' && (
            <div className="stack">
              <label>Appeal text<textarea rows={4} value={appealText} onChange={(e) => setAppealText(e.target.value)} /></label>
              <button className="primary" onClick={appeal}>File appeal</button>
            </div>
          )}
        </div>
      </div>
      <div className="panel">
        <h2>Timeline</h2>
        <div className="timeline">
          {item.events.map((event) => (
            <div key={event.id}>
              <strong>{event.event_type.replaceAll('_', ' ')}</strong>
              <span>{formatDateTime(event.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
