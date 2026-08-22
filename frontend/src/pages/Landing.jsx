import { ArrowRight, FileText, Search, ShieldQuestion } from 'lucide-react'

export default function Landing({ navigate }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Synthetic hackathon demo</p>
        <h1>Have a problem with a government office or service?</h1>
        <p>Tell us what happened in plain language. The router classifies the issue, shows every department hop, watches the deadline, and makes the appeal trigger visible.</p>
        <div className="hero-actions">
          <button className="primary" onClick={() => navigate('/file')}>Lodge Grievance <ArrowRight size={18} /></button>
          <button onClick={() => navigate('/dashboard')}>View Status</button>
          <button onClick={() => navigate('/dashboard')}>Grievance Appeal</button>
        </div>
      </div>
      <div className="action-grid" aria-label="Quick actions">
        <button onClick={() => navigate('/file')}><FileText /><strong>Lodge Grievance</strong><span>Guided classification before submission</span></button>
        <button onClick={() => navigate('/dashboard')}><Search /><strong>View Status</strong><span>Routing trail instead of one opaque line</span></button>
        <button onClick={() => navigate('/dashboard')}><ShieldQuestion /><strong>Appeal</strong><span>Poor rating opens the 30-day window</span></button>
      </div>
    </section>
  )
}
