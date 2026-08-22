export default function ClassificationCard({ result, selected, onChange }) {
  if (!result) return null
  return (
    <div className="classification">
      <div>
        <p className="eyebrow">Suggested classification</p>
        <h2>{result.category}</h2>
        <p>{result.reasoning}</p>
        <small>Confidence {Math.round(result.confidence * 100)}%{result.matched_terms.length ? ` · matched ${result.matched_terms.join(', ')}` : ''}</small>
      </div>
      <label>
        Confirm or correct
        <select value={selected} onChange={(e) => onChange(e.target.value)}>
          <option value="complaint">Complaint</option>
          <option value="grievance">Grievance</option>
          <option value="suggestion">Suggestion</option>
        </select>
      </label>
    </div>
  )
}
