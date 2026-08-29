import SLAClock from './SLAClock.jsx'

export default function GrievanceCard({ grievance, navigate }) {
  return (
    <button className="grievance-card" onClick={() => navigate(`/grievances/${grievance.id}`)}>
      <div>
        <strong>{grievance.registration_id}</strong>
        <p>{grievance.raw_description}</p>
      </div>
      <div className="card-meta">
        <span className={`badge ${grievance.category}`}>{grievance.category}</span>
        <span>{grievance.organization_name}</span>
        <span>{grievance.current_department.name}</span>
        <SLAClock windows={grievance.review_windows} />
      </div>
    </button>
  )
}
