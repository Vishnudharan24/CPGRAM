import { Clock3 } from 'lucide-react'
import { formatDateTime } from '../api/client.js'

export default function SLAClock({ windows }) {
  const open = windows?.find((window) => window.status === 'open') || windows?.[windows.length - 1]
  if (!open) return <span className="sla muted">No SLA window</span>
  const deadline = new Date(open.deadline_at)
  const diffMs = deadline - new Date()
  const days = Math.ceil(diffMs / 86400000)
  const tone = open.status === 'missed' || days < 0 ? 'red' : days <= 3 ? 'amber' : 'green'
  return (
    <span className={`sla ${tone}`} title={formatDateTime(open.deadline_at)}>
      <Clock3 size={16} />
      {open.window_type === 'appeal' ? 'Appeal' : 'Resolution'} {open.status === 'open' ? `${Math.max(days, 0)}d left` : open.status}
    </span>
  )
}
