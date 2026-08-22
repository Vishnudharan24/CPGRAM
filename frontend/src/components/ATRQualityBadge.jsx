import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function ATRQualityBadge({ flag }) {
  if (flag === 'ok') return <span className="quality ok"><CheckCircle2 size={16} />Substantive ATR</span>
  if (flag === 'too_short') return <span className="quality warn"><AlertTriangle size={16} />ATR too short</span>
  return <span className="quality warn"><AlertTriangle size={16} />Templated language detected</span>
}
