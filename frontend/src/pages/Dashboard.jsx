import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import GrievanceCard from '../components/GrievanceCard.jsx'

export default function Dashboard({ navigate }) {
  const [summary, setSummary] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api('/dashboard/summary'), api('/grievances')])
      .then(([summaryData, grievanceData]) => {
        setSummary(summaryData)
        setItems(grievanceData)
      })
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section className="workspace">
      <div className="summary-row">
        <div><strong>{summary?.total ?? 0}</strong><span>Total</span></div>
        <div><strong>{summary?.overdue ?? 0}</strong><span>Overdue</span></div>
        <div><strong>{summary?.by_status?.appeal_open ?? 0}</strong><span>Appeals open</span></div>
        <div><strong>{summary?.by_category?.complaint ?? 0}</strong><span>Complaints</span></div>
      </div>
      <div className="section-head">
        <div>
          <p className="eyebrow">Citizen dashboard</p>
          <h1>Track grievances</h1>
        </div>
        <button className="primary" onClick={() => navigate('/file')}>New grievance</button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="list">
        {items.map((item) => <GrievanceCard key={item.id} grievance={item} navigate={navigate} />)}
      </div>
    </section>
  )
}
