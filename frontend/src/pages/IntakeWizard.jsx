import React, { useEffect, useState } from 'react'
import { ArrowRight, Building2, Send, ChevronRight, MapPin } from 'lucide-react'
import { api, getUser } from '../api/client.js'
import ClassificationCard from '../components/ClassificationCard.jsx'
import { STATES } from '../utils/states.js'
import { DISTRICTS } from '../utils/districts.js'

export default function IntakeWizard({ navigate }) {
  const user = getUser()
  const [description, setDescription] = useState('My pension has not been received for three months and the office says the file is pending.')
  const [classification, setClassification] = useState(null)
  const [category, setCategory] = useState('complaint')
  const [step, setStep] = useState(1)
  const [organizations, setOrganizations] = useState([])
  const [organizationCode, setOrganizationCode] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [orgSearch, setOrgSearch] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')
  const [grievanceLocation, setGrievanceLocation] = useState({
    state_code: user?.state_code || STATES[0].code,
    district_code: user?.district_code || ''
  })

  const [hierarchy, setHierarchy] = useState([])
  const [selectedHierarchy, setSelectedHierarchy] = useState({})
  const [finalCategory, setFinalCategory] = useState(null)
  const [categoryInputValues, setCategoryInputValues] = useState({})
  const [otherDetails, setOtherDetails] = useState('')

  const isOtherSelected = Object.values(selectedHierarchy).some(val => 
    val && val.toLowerCase().includes('other')
  );

  useEffect(() => {
    api('/grievances/organizations')
      .then(setOrganizations)
      .catch((err) => setError(err.message))
  }, [])

  async function classify() {
    setError('')
    try {
      getSuggestion() // Trigger in background
      const result = await api('/grievances/classify', { method: 'POST', body: JSON.stringify({ description }) })
      setClassification(result)
      setCategory(result.category)
      setStep(2)
    } catch (err) {
      setError(err.message)
    }
  }

  async function getSuggestion() {
    setError('')
    setIsSuggesting(true)
    try {
      const result = await api('/grievances/suggest-path', { method: 'POST', body: JSON.stringify({ description }) })
      setAiSuggestion(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSuggesting(false)
    }
  }

  async function fetchCategories(orgCode) {
    try {
      const data = await api(`/organisations/${orgCode}/categories`)
      setHierarchy(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const MAX_LEVEL = 7;
  function getOptionsForLevel(level) {
    if (!hierarchy.length) return [];
    let filtered = hierarchy;
    for (let i = 1; i < level; i++) {
       const key = i === 1 ? 'level_1_category' : `level_${i}_subcategory`;
       if (selectedHierarchy[i]) {
         filtered = filtered.filter(item => item[key] === selectedHierarchy[i]);
       }
    }
    const currentKey = level === 1 ? 'level_1_category' : `level_${level}_subcategory`;
    const options = new Set(filtered.map(item => item[currentKey]).filter(Boolean));
    return Array.from(options);
  }

  function handleHierarchySelect(level, value) {
    const newSelected = { ...selectedHierarchy };
    // clear subsequent levels
    for (let i = level; i <= MAX_LEVEL; i++) {
      delete newSelected[i];
    }
    newSelected[level] = value;
    setSelectedHierarchy(newSelected);
    
    // check if this is a leaf node
    const leafItem = hierarchy.find(item => {
      let match = true;
      for (let i = 1; i <= MAX_LEVEL; i++) {
         const k = i === 1 ? 'level_1_category' : `level_${i}_subcategory`;
         if (i <= level) {
             if (item[k] !== (i === level ? value : selectedHierarchy[i])) match = false;
         } else {
             if (item[k]) match = false;
         }
      }
      return match && item.is_leaf_category === 'Yes';
    });
    
    if (leafItem) {
      setFinalCategory(leafItem);
    } else {
      setFinalCategory(null);
    }
  }

  async function submit() {
    setError('')
    try {
      const payload = { 
        raw_description: description, 
        category, 
        organization_code: organizationCode,
        state_code: grievanceLocation.state_code,
        district_code: grievanceLocation.district_code
      };
      if (finalCategory) {
        payload.category_code = finalCategory.category_code;
        payload.parent_category_code = finalCategory.parent_category_code;
        payload.category_name = finalCategory.category_name;
        payload.category_path = finalCategory.category_path;
        payload.category_stage = parseInt(finalCategory.stage) || null;
        payload.field_set_id = finalCategory.field_set_id;
        payload.destination_routing_codes = finalCategory.destination_routing_codes;
        payload.category_input_values = categoryInputValues;
      }
      
      if (isOtherSelected && otherDetails) {
        payload.category_input_values = { ...payload.category_input_values, 'Other Details': otherDetails };
      }

      const result = await api('/grievances', { method: 'POST', body: JSON.stringify(payload) })
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
        <button onClick={classify} disabled={isSuggesting}>
          {isSuggesting ? 'Classifying...' : 'Classify issue'}
        </button>
      </div>
      {step >= 2 && <div className="panel">
        <p className="eyebrow">Step 2</p>
        <h1>Confirm category</h1>
        <ClassificationCard result={classification} selected={category} onChange={setCategory} />
        <button className="primary" disabled={!classification} onClick={() => setStep(3)}><ArrowRight size={18} />Choose organisation</button>
      </div>}
      
      {(isSuggesting || aiSuggestion) && (
        <div className="panel" style={{ gridColumn: '1 / -1', border: '2px solid var(--primary)', background: 'var(--surface-hover)' }}>
          <p className="eyebrow">AI Assistant</p>
          <h1>Smart Routing Suggestion</h1>
          {isSuggesting ? (
             <p className="muted">Analyzing your grievance to find the best organization and category path...</p>
          ) : (
             <p style={{ fontSize: '1.1rem', margin: 0 }}>{aiSuggestion?.suggestion_text}</p>
          )}
        </div>
      )}
      {step >= 3 && <div className="panel organization-panel">
        <p className="eyebrow">Step 3</p>
        <h1>Select organisation</h1>
        <p className="muted" style={{ marginBottom: '1rem' }}>Choose the organisation your grievance concerns.</p>
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search organisation / ministry..." 
            value={orgSearch} 
            onChange={(e) => setOrgSearch(e.target.value)} 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}
          />
        </div>
        <div className="organization-grid" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {organizations.filter(o => o.name.toLowerCase().includes(orgSearch.toLowerCase()) || o.code.toLowerCase().includes(orgSearch.toLowerCase())).map((organization) => (
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
        {step === 3 && (
          <button className="primary" disabled={!organizationCode} onClick={() => {
            setStep(4);
            fetchCategories(organizationCode);
          }}><ArrowRight size={18} />Choose sub-category</button>
        )}
      </div>}
      
      {step >= 4 && <div className="panel">
        <p className="eyebrow">Step 4</p>
        <h1>Category Details</h1>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>Select the specific nature of your grievance.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, max-content) 1fr', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>Ministry / Department <span style={{color: 'red'}}>*</span></div>
          <div>{organizations.find(o => o.code === organizationCode)?.name}</div>

          {[1, 2, 3, 4, 5, 6, 7].map(level => {
            const options = getOptionsForLevel(level);
            if (options.length === 0) return null;
            const labelText = level === 1 ? 'Select main category' : 'Select next level category';
            return (
              <React.Fragment key={level}>
                <div style={{ fontWeight: 'bold' }}>{labelText} <span style={{color: 'red'}}>*</span></div>
                <select 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}
                  value={selectedHierarchy[level] || ''} 
                  onChange={(e) => handleHierarchySelect(level, e.target.value)}
                >
                  <option value="">Select option...</option>
                  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </React.Fragment>
            )
          })}
        </div>

        {finalCategory && finalCategory.parsed_input_fields && finalCategory.parsed_input_fields.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, max-content) 1fr', gap: '1rem', alignItems: 'center' }}>
              {finalCategory.parsed_input_fields.map((field, idx) => {
                const isDropdown = field.control && field.control.toLowerCase() === 'dropdown';
                let inputType = 'text';
                if (field.data_type) {
                  const dt = field.data_type.toLowerCase();
                  if (dt === 'number') inputType = 'number';
                  else if (dt === 'date') inputType = 'date';
                }
                
                return (
                  <React.Fragment key={idx}>
                    <div style={{ fontWeight: 'bold' }}>
                      {field.label} {field.mandatory && <span style={{color: 'red'}}>*</span>}
                    </div>
                    {isDropdown ? (
                      <select
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}
                        required={field.mandatory}
                        value={categoryInputValues[field.label] || ''}
                        onChange={e => setCategoryInputValues({...categoryInputValues, [field.label]: e.target.value})}
                      >
                        <option value="">Select...</option>
                        <option value="Mock Option 1">Mock Option 1</option>
                        <option value="Mock Option 2">Mock Option 2</option>
                        <option value="Mock Option 3">Mock Option 3</option>
                      </select>
                    ) : (
                      <input
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}
                        type={inputType}
                        required={field.mandatory}
                        value={categoryInputValues[field.label] || ''}
                        onChange={e => setCategoryInputValues({...categoryInputValues, [field.label]: e.target.value})}
                        maxLength={field.max_length || undefined}
                        minLength={field.min_length || undefined}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {isOtherSelected && (
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'minmax(250px, max-content) 1fr', gap: '1rem', alignItems: 'center' }}>
             <div style={{ fontWeight: 'bold' }}>Please specify (Other) <span className="muted" style={{fontWeight: 'normal', fontSize: '0.9em'}}>(Optional)</span></div>
             <input 
               type="text" 
               value={otherDetails}
               onChange={e => setOtherDetails(e.target.value)}
               placeholder="Briefly describe the exact nature of the grievance..."
               style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}
             />
          </div>
        )}

        {finalCategory && (
          <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
             <h4>Summary</h4>
             <p><strong>Organisation:</strong> {organizations.find(o => o.code === organizationCode)?.name}</p>
             <p><strong>Category Path:</strong> {finalCategory.category_path}</p>
             {finalCategory.destination_routing_codes && (
                <p><strong>Routing code:</strong> {finalCategory.destination_routing_codes}</p>
             )}
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MapPin size={20} className="primary" />
            <h3 style={{ margin: 0 }}>Grievance Location</h3>
          </div>
          <p className="muted" style={{ marginBottom: '1rem' }}>Please confirm the geographic location this grievance pertains to (defaults to your registered address).</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, max-content) 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold' }}>State <span style={{color: 'red'}}>*</span></div>
            <select 
              value={grievanceLocation.state_code} 
              onChange={e => {
                  const newDistricts = DISTRICTS.filter(d => d.state_code === e.target.value);
                  setGrievanceLocation({...grievanceLocation, state_code: e.target.value, district_code: newDistricts.length ? newDistricts[0].code : ''});
              }}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
                {STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, max-content) 1fr', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>District</div>
            <select 
              value={grievanceLocation.district_code} 
              onChange={e => setGrievanceLocation({...grievanceLocation, district_code: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
                <option value="">Select District (Optional)</option>
                {DISTRICTS.filter(d => d.state_code === grievanceLocation.state_code).map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="error" style={{marginTop: '1rem'}}>{error}</p>}
        
        <button 
          className="primary" 
          disabled={!finalCategory && !isOtherSelected} 
          onClick={submit} 
          style={{marginTop: '1.5rem'}}
        >
          <Send size={18} /> Submit grievance
        </button>
      </div>}
    </section>
  )
}
