import { useEffect, useState } from 'react'
import { ArrowRight, Building2, Send } from 'lucide-react'
import { api } from '../api/client.js'
import ClassificationCard from '../components/ClassificationCard.jsx'

export default function IntakeWizard({ navigate }) {
  const [description, setDescription] = useState('My pension has not been received for three months and the office says the file is pending.')
  const [classification, setClassification] = useState(null)
  const [category, setCategory] = useState('complaint')
  const [step, setStep] = useState(1)
  const [organizations, setOrganizations] = useState([])
  const [organizationCode, setOrganizationCode] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/grievances/organizations')
      .then(setOrganizations)
      .catch((err) => setError(err.message))
  }, [])

  async function classify() {
    setError('')
    try {
      const result = await api('/grievances/classify', { method: 'POST', body: JSON.stringify({ description }) })
      setClassification(result)
      setCategory(result.category)
      setStep(2)
    } catch (err) {
      setError(err.message)
    }
  }

  async function submit() {
    setError('')
    try {
      const result = await api('/grievances', { method: 'POST', body: JSON.stringify({ raw_description: description, category, organization_code: organizationCode }) })
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
        <p>Your grievance is registered with <strong>{submitted.organization_name}</strong> and routed to <strong>{submitted.current_department.name}</strong>. The 21-day resolution clock is open.</p>
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
      {step >= 2 && <div className="panel">
        <p className="eyebrow">Step 2</p>
        <h1>Confirm category</h1>
        <ClassificationCard result={classification} selected={category} onChange={setCategory} />
        <button className="primary" disabled={!classification} onClick={() => setStep(3)}><ArrowRight size={18} />Choose organisation</button>
      </div>}
      {step === 3 && <div className="panel organization-panel">
        <p className="eyebrow">Step 3</p>
        <h1>Select organisation</h1>
        <p className="muted">Choose the organisation your grievance concerns.</p>
        <div className="organization-grid">
          {organizations.map((organization) => (
            <button
              className={`organization-card ${organizationCode === organization.code ? 'selected' : ''}`}
              key={organization.code}
              onClick={() => setOrganizationCode(organization.code)}
              type="button"
            >
              <Building2 size={20} />
              <span>{organization.name}</span>
            </button>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={!organizationCode} onClick={submit}><Send size={18} />Submit grievance</button>
      </div>}
    </section>
  )
}
