import { useEffect, useState } from 'react'
import { api, getUser } from '../api/client.js'
import GrievanceCard from '../components/GrievanceCard.jsx'
import { STATES } from '../utils/states.js'
import { DISTRICTS } from '../utils/districts.js'

export default function OfficerDashboard({ navigate }) {
  const user = getUser()
  const [grievances, setGrievances] = useState([])
  const [summary, setSummary] = useState(null)
  const [filter, setFilter] = useState(null)
  const [officers, setOfficers] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [message, setMessage] = useState('')
  
  // Forms
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    role: 'gro',
    organization_code: user.organization_code || '',
    level: 'Central',
    state_code: STATES[0].code,
    district_code: DISTRICTS.find(d => d.state_code === STATES[0].code)?.code || '',
    password: ''
  })

  async function loadData() {
    try {
      const [gData, sData] = await Promise.all([
        api('/grievances'),
        api('/dashboard/summary')
      ])
      setGrievances(gData)
      setSummary(sData)
      
      if (user.role === 'admin' || user.role === 'npg') {
        const oData = await api('/officer-accounts')
        setOfficers(oData)
      }
      if (user.role === 'admin') {
        const orgData = await api('/grievances/organizations')
        setOrganizations(orgData)
        if (orgData.length > 0) {
            setNewOfficer(prev => ({...prev, organization_code: orgData[0].code}))
        }
      }
    } catch (err) {
      setMessage(err.message)
    }
  }

  useEffect(() => { loadData() }, [])

  async function createOfficer(e) {
    e.preventDefault()
    try {
      await api('/officer-accounts', { method: 'POST', body: JSON.stringify(newOfficer) })
      setMessage('Officer account created successfully.')
      loadData()
    } catch (err) {
      setMessage(err.message)
    }
  }

  if (user.role === 'citizen') {
    return <div className="panel"><p>Unauthorized. Citizens cannot access the officer dashboard.</p></div>
  }

  const isUsersTab = window.location.pathname === '/officer/users'

  const displayedGrievances = filter 
    ? grievances.filter(g => {
        if (filter === 'appeal_pending') return g.status === 'appeal_open' && g.appeal_text && !g.appeal_decision;
        if (filter === 'appeal_accepted') return g.appeal_decision?.includes('[ACCEPT]');
        if (filter === 'appeal_rejected') return g.appeal_decision?.includes('[REJECT]');
        return g.category === filter;
      })
    : grievances

  return (
    <section className="workspace stack">
      <div className="panel">
        <h1>{user.role.toUpperCase()} {isUsersTab ? 'Officer Management' : 'Dashboard'}</h1>
        <p className="muted">Logged in as {user.name} ({user.email})</p>
        {user.organization_code && <p className="muted">Organisation: {user.organization_code} | Level: {user.level}</p>}
        {message && <p className="notice">{message}</p>}
      </div>

      {isUsersTab && ['admin', 'central_admin', 'state_admin', 'ut_admin', 'npg'].includes(user.role) && (
        <div className="panel">
          <h2>Officer Management</h2>
          <form onSubmit={createOfficer} className="stack" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
            <label>Role Type 
              <select value={newOfficer.role} onChange={e => setNewOfficer({...newOfficer, role: e.target.value})}>
                {user.role === 'admin' && (
                  <>
                    <option value="central_admin">Central Admin</option>
                    <option value="state_admin">State Admin</option>
                    <option value="ut_admin">UT Admin</option>
                  </>
                )}
                {['admin', 'central_admin', 'state_admin', 'ut_admin'].includes(user.role) && (
                  <option value="npg">NPG / Nodal GRO</option>
                )}
                <option value="gro">GRO</option>
                {user.role === 'npg' && <option value="appellate_authority">Appellate Authority</option>}
              </select>
            </label>
            
            {['npg', 'gro', 'appellate_authority'].includes(newOfficer.role) && (
              <label>Administrative Level 
                <select value={newOfficer.level} onChange={e => setNewOfficer({...newOfficer, level: e.target.value})}>
                    <option value="Central">Central</option>
                    <option value="State">State</option>
                    <option value="District">District</option>
                </select>
              </label>
            )}

            {['state_admin', 'ut_admin'].includes(newOfficer.role) || (['npg', 'gro', 'appellate_authority'].includes(newOfficer.role) && ['State', 'District'].includes(newOfficer.level)) ? (
              <label>State/UT 
                <select value={newOfficer.state_code} onChange={e => {
                    const newDistricts = DISTRICTS.filter(d => d.state_code === e.target.value)
                    setNewOfficer({...newOfficer, state_code: e.target.value, district_code: newDistricts.length ? newDistricts[0].code : ''})
                }}>
                    {STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </label>
            ) : null}

            {['npg', 'gro', 'appellate_authority'].includes(newOfficer.role) && newOfficer.level === 'District' && (
              <label>District 
                <select value={newOfficer.district_code} onChange={e => setNewOfficer({...newOfficer, district_code: e.target.value})}>
                    {DISTRICTS.filter(d => d.state_code === newOfficer.state_code).map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </label>
            )}

            {['central_admin', 'npg', 'gro', 'appellate_authority'].includes(newOfficer.role) && (
              <label>Ministry / Department 
                <select value={newOfficer.organization_code} onChange={e => setNewOfficer({...newOfficer, organization_code: e.target.value})}>
                    {organizations.map(org => <option key={org.code} value={org.code}>{org.name}</option>)}
                </select>
              </label>
            )}

            <label>Name <input required value={newOfficer.name} onChange={e => setNewOfficer({...newOfficer, name: e.target.value})} /></label>
            <label>Email <input required type="email" value={newOfficer.email} onChange={e => setNewOfficer({...newOfficer, email: e.target.value})} /></label>
            <label>Password <input required type="password" value={newOfficer.password} onChange={e => setNewOfficer({...newOfficer, password: e.target.value})} /></label>
            <button type="submit">Create Account</button>
          </form>

          <h3>Active Officers</h3>
          <table style={{ width: '100%', textAlign: 'left' }}>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Org</th><th>Level</th></tr></thead>
            <tbody>
              {officers.map(o => (
                <tr key={o.id}>
                  <td>{o.name}</td><td>{o.email}</td><td>{o.role.toUpperCase()}</td><td>{o.organization_code || 'ALL'}</td><td>{o.level || 'ALL'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isUsersTab && (user.role === 'admin' || user.role === 'npg' || user.role === 'gro' || user.role === 'appellate_authority') && (
        <>
          <div className="summary-row" style={{ cursor: 'pointer' }}>
            <div onClick={() => setFilter(filter === 'grievance' ? null : 'grievance')} className={filter === 'grievance' ? 'active-filter' : ''}>
              <strong>{summary?.by_category?.grievance ?? 0}</strong><span>Grievances</span>
            </div>
            <div onClick={() => setFilter(filter === 'complaint' ? null : 'complaint')} className={filter === 'complaint' ? 'active-filter' : ''}>
              <strong>{summary?.by_category?.complaint ?? 0}</strong><span>Complaints</span>
            </div>
            <div onClick={() => setFilter(filter === 'suggestion' ? null : 'suggestion')} className={filter === 'suggestion' ? 'active-filter' : ''}>
              <strong>{summary?.by_category?.suggestion ?? 0}</strong><span>Suggestions</span>
            </div>
          </div>

          {(user.role === 'admin' || user.role === 'appellate_authority') && (
            <div className="summary-row" style={{ cursor: 'pointer', marginTop: '1rem' }}>
              <div onClick={() => setFilter(filter === 'appeal_pending' ? null : 'appeal_pending')} className={filter === 'appeal_pending' ? 'active-filter' : ''}>
                <strong>{summary?.appeals_pending ?? 0}</strong><span>Pending Appeals</span>
              </div>
              <div onClick={() => setFilter(filter === 'appeal_accepted' ? null : 'appeal_accepted')} className={filter === 'appeal_accepted' ? 'active-filter' : ''}>
                <strong style={{color: 'var(--primary)'}}>{summary?.appeals_accepted ?? 0}</strong><span>Accepted</span>
              </div>
              <div onClick={() => setFilter(filter === 'appeal_rejected' ? null : 'appeal_rejected')} className={filter === 'appeal_rejected' ? 'active-filter' : ''}>
                <strong style={{color: 'var(--red)'}}>{summary?.appeals_rejected ?? 0}</strong><span>Rejected</span>
              </div>
            </div>
          )}
          
          <div className="section-head">
            <div>
              <p className="eyebrow">{user.role.toUpperCase()} View</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h1 style={{ margin: 0 }}>{filter ? `Showing ${filter.replace('_', ' ')}s` : 'All items'}</h1>
                {filter && (
                  <button className="secondary" onClick={() => setFilter(null)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', alignSelf: 'center' }}>
                    Show All
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="list">
            {displayedGrievances.length > 0 ? (
              displayedGrievances.map((item) => (
                <GrievanceCard key={item.id} grievance={item} navigate={navigate} />
              ))
            ) : (
              <p className="muted">No items found.</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
