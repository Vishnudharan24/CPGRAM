import { useState } from 'react'
import { Send } from 'lucide-react'
import { api } from '../api/client.js'
import ClassificationCard from '../components/ClassificationCard.jsx'

export default function IntakeWizard({ navigate }) {
  const [description, setDescription] = useState('My pension has not been received for three months and the office says the file is pending.')
  const [classification, setClassification] = useState(null)
  const [category, setCategory] = useState('complaint')
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')

  async function classify() {
    setError('')
    try {
      const result = await api('/grievances/classify', { method: 'POST', body: JSON.stringify({ description }) })
      setClassification(result)
      setCategory(result.category)
    } catch (err) {
      setError(err.message)
    }
  }

  async function submit() {
    setError('')
    try {
      const result = await api('/grievances', { method: 'POST', body: JSON.stringify({ raw_description: description, category }) })
      setSubmitted(result)
    } catch (err) {
      setError(err.message)
    }
  }

  if (submitted) {
    return (
      <section className="panel">
        <p className="eyebrow">Submitted</p>
        <h1>{submitted.registration_id}</h1>
        <p>Your grievance is routed to <strong>{submitted.current_department.name}</strong>. The 21-day resolution clock is open.</p>
        <button className="primary" onClick={() => navigate(`/grievances/${submitted.id}`)}>Open routing trail</button>
      </section>
    )
  }

  return (
    <section className="workspace two-col">
      <div className="panel">
        <p className="eyebrow">Step 1</p>
        <h1>Describe what happened</h1>
        <label>
          Plain-language description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={9} />
        </label>
        <button onClick={classify}>Classify issue</button>
      </div>
      <div className="panel">
        <p className="eyebrow">Step 2</p>
        <h1>Confirm category</h1>
        <ClassificationCard result={classification} selected={category} onChange={setCategory} />
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={!classification} onClick={submit}><Send size={18} />Submit grievance</button>
      </div>
    </section>
  )
}
