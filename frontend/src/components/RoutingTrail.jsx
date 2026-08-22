import { MapPin } from 'lucide-react'
import { formatDateTime } from '../api/client.js'

export default function RoutingTrail({ events }) {
  const hops = events.filter((event) => event.to_department && event.event_type.includes('routed'))
  return (
    <div className="trail">
      {hops.map((event) => (
        <div className="hop" key={event.id}>
          <span className="hop-dot"><MapPin size={16} /></span>
          <div>
            <strong>{event.to_department.name}</strong>
            <small>{event.to_department.level.replace('_', ' ')} · {formatDateTime(event.created_at)}</small>
          </div>
        </div>
      ))}
      {!hops.length && <p className="muted">No routing events yet.</p>}
    </div>
  )
}
