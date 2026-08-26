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
  
  const [decisionAction, setDecisionAction] = useState('accept')
  const [decisionRemarks, setDecisionRemarks] = useState('')

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

  async function submitDecision() {
    setError('')
    try {
      setItem(await api(`/grievances/${id}/appeal-decision`, { method: 'POST', body: JSON.stringify({ action: decisionAction, remarks: decisionRemarks }) }))
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

  const isOfficer = ['gro', 'npg', 'admin', 'appellate_authority'].includes(user?.role)
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
          
          {!isOfficer && item.status === 'appeal_open' && !item.appeal_text && (
            <div className="stack">
              <label>Appeal text<textarea rows={4} value={appealText} onChange={(e) => setAppealText(e.target.value)} /></label>
              <button className="primary" onClick={appeal}>File appeal</button>
            </div>
          )}

          {!isOfficer && item.status === 'appeal_open' && item.appeal_text && (
            <div className="panel" style={{ marginTop: '1rem', background: 'var(--surface)' }}>
              <p style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}><strong>Appeal sent successfully.</strong> The Appellate Authority is reviewing your case.</p>
              <p><strong>Your Appeal:</strong> {item.appeal_text}</p>
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

          {user?.role === 'appellate_authority' && item.status === 'appeal_open' && (
            <div className="stack" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <h3>Appeal Decision</h3>
              <p><strong>Citizen Appeal:</strong> {item.appeal_text || 'No appeal text provided yet.'}</p>
              <label>Decision
                <select value={decisionAction} onChange={(e) => setDecisionAction(e.target.value)}>
                  <option value="accept">Accept (Return to GRO)</option>
                  <option value="reject">Reject (Close Grievance)</option>
                </select>
              </label>
              <label>Remarks
                <textarea rows={4} value={decisionRemarks} onChange={(e) => setDecisionRemarks(e.target.value)} />
              </label>
              <button className="primary" onClick={submitDecision} disabled={!decisionRemarks}>Submit Decision</button>
            </div>
          )}

          {item.appeal_decision && (
            <div className="panel" style={{ marginTop: '1rem', background: 'var(--surface)' }}>
              <h3>Appeal Outcome</h3>
              <p><strong>Appeal:</strong> {item.appeal_text}</p>
              <p><strong>Decision:</strong> {item.appeal_decision}</p>
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
