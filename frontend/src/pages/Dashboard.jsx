import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import GrievanceCard from '../components/GrievanceCard.jsx'

export default function Dashboard({ navigate }) {
  const [summary, setSummary] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState(null)

  useEffect(() => {
    Promise.all([api('/dashboard/summary'), api('/grievances')])
      .then(([summaryData, grievanceData]) => {
        setSummary(summaryData)
        setItems(grievanceData)
      })
      .catch((err) => setError(err.message))
  }, [])

  const displayedItems = filter
    ? items.filter((item) => {
        if (filter === 'overdue') return item.review_windows.some((rw) => rw.status === 'missed')
        if (filter === 'appeal_open') return item.status === 'appeal_open'
        if (filter === 'complaint') return item.category === 'complaint'
        return true
      })
    : items

  return (
    <section className="workspace">
      <div className="summary-row" style={{ cursor: 'pointer' }}>
        <div onClick={() => setFilter(null)} className={filter === null ? 'active-filter' : ''}>
          <strong>{summary?.total ?? 0}</strong><span>Total</span>
        </div>
        <div onClick={() => setFilter(filter === 'overdue' ? null : 'overdue')} className={filter === 'overdue' ? 'active-filter' : ''}>
          <strong>{summary?.overdue ?? 0}</strong><span>Overdue</span>
        </div>
        <div onClick={() => setFilter(filter === 'appeal_open' ? null : 'appeal_open')} className={filter === 'appeal_open' ? 'active-filter' : ''}>
          <strong>{summary?.by_status?.appeal_open ?? 0}</strong><span>Appeals open</span>
        </div>
        <div onClick={() => setFilter(filter === 'complaint' ? null : 'complaint')} className={filter === 'complaint' ? 'active-filter' : ''}>
          <strong>{summary?.by_category?.complaint ?? 0}</strong><span>Complaints</span>
        </div>
      </div>
      <div className="section-head">
        <div>
          <p className="eyebrow">Citizen dashboard</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ margin: 0 }}>{filter ? `Showing ${filter.replace('_', ' ')}s` : 'Track grievances'}</h1>
            {filter && (
              <button className="secondary" onClick={() => setFilter(null)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', alignSelf: 'center' }}>
                Show All
              </button>
            )}
          </div>
        </div>
        <button className="primary" onClick={() => navigate('/file')}>New grievance</button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="list">
        {displayedItems.length > 0 ? (
          displayedItems.map((item) => <GrievanceCard key={item.id} grievance={item} navigate={navigate} />)
        ) : (
          <p className="muted">No items found.</p>
        )}
      </div>
    </section>
  )
}
