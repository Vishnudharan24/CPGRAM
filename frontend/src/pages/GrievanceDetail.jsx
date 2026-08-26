import { useEffect, useState } from 'react'
import { api, formatDateTime, getUser } from '../api/client.js'
import ATRQualityBadge from '../components/ATRQualityBadge.jsx'
import RoutingTrail from '../components/RoutingTrail.jsx'
import SLAClock from '../components/SLAClock.jsx'

export default function GrievanceDetail({ id }) {
  const user = getUser()
  const [item, setItem] = useState(null)
  const [appealText, setAppealText] = useState('The ATR is generic and does not address the exact facts of my case.')
  const [error, setError] = useState('')
  
  const [atrContent, setAtrContent] = useState('Matter has been resolved as per rules. No further action is required.')
  const [atrFile, setAtrFile] = useState(null)

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

  async function fileAtr() {
    setError('')
    try {
      const formData = new FormData()
      formData.append('content', atrContent)
      formData.append('mark_resolved', 'true')
      if (atrFile) {
        formData.append('files', atrFile)
      }
      setItem(await api(`/grievances/${id}/atr`, { method: 'POST', body: formData }))
      setAtrContent('')
      setAtrFile(null)
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return <section className="panel"><p className="error">{error}</p></section>
  if (!item) return <section className="panel"><p>Loading...</p></section>

  const isOfficer = user?.role === 'gro' || user?.role === 'npg' || user?.role === 'admin'
  const canFileAtr = isOfficer && !['resolved', 'closed', 'appeal_open', 'appeal_resolved'].includes(item.status)

  return (
    <section className="workspace detail">
      <div className="section-head">
        <div>
          <p className="eyebrow">{item.registration_id}</p>
          <h1>{item.category} · {item.status.replace('_', ' ')}</h1>
          <p className="muted">Organisation: <strong>{item.organization_name}</strong> ({item.organization_code})</p>
          {item.category_path && (
            <p className="muted">Category Path: <strong>{item.category_path}</strong></p>
          )}
          <p>{item.raw_description}</p>
          {item.category_input_values && Object.keys(item.category_input_values).length > 0 && (
            <div className="muted" style={{ marginTop: '0.5rem' }}>
              <strong>Additional Details:</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                {Object.entries(item.category_input_values).map(([key, value]) => (
                  <li key={key}><strong>{key}:</strong> {value}</li>
                ))}
              </ul>
            </div>
          )}
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
              {atr.attachments && atr.attachments.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Attachments:</strong>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {atr.attachments.map(att => (
                      <li key={att.id}>
                        <a href={`http://localhost:8000${att.file_path}`} target="_blank" rel="noopener noreferrer">{att.file_name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <small>{formatDateTime(atr.created_at)}</small>
            </article>
          )) : <p className="muted">No ATR has been filed yet.</p>}
          
          {!isOfficer && item.status === 'resolved' && (
            <div className="rating-box">
              <p>Rating this resolution <strong>Poor</strong> opens a 30-day appeal window automatically.</p>
              <button onClick={() => rate('good')}>Good</button>
              <button onClick={() => rate('average')}>Average</button>
              <button className="danger" onClick={() => rate('poor')}>Poor</button>
            </div>
          )}
          
          {!isOfficer && item.status === 'appeal_open' && (
            <div className="stack">
              <label>Appeal text<textarea rows={4} value={appealText} onChange={(e) => setAppealText(e.target.value)} /></label>
              <button className="primary" onClick={appeal}>File appeal</button>
            </div>
          )}
          
          {canFileAtr && (
            <div className="stack" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <h3>Process Grievance (File ATR)</h3>
              <label>ATR content
                <textarea rows={4} value={atrContent} onChange={(e) => setAtrContent(e.target.value)} />
              </label>
              <label>Supporting Document (Optional)
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt" onChange={(e) => setAtrFile(e.target.files[0])} />
              </label>
              <button className="primary" onClick={fileAtr} disabled={!atrContent}>File ATR and resolve</button>
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
