import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Search, X, Edit2, Trash2, Eye, Copy, Download,
  ChevronDown, ChevronLeft, ChevronRight, CheckCircle2,
  MapPin, Users, ClipboardList, Activity, Layers,
  Calendar, FileText, Target, AlertCircle, Loader2,
} from 'lucide-react'

import { subscribePhases } from '../firebase/phaseService'
import { subscribeSurveyForms } from '../firebase/surveyService'
import { subscribeAssignments, createAssignment, deleteAssignment as deleteAssignmentSvc } from '../firebase/assignmentService'
import { fetchAllBooths } from '../firebase/voterService'
import { subscribeAgents } from '../firebase/agentService'



const STATUS_CFG = {
  Active:    { color: '#10B981', bg: '#ECFDF5' },
  Completed: { color: '#5B5CEB', bg: '#EEF2FF' },
  Draft:     { color: '#94A3B8', bg: '#F8FAFC' },
  Paused:    { color: '#F59E0B', bg: '#FFFBEB' },
}

const PHASE_STATUS_CFG = {
  Active:    { color: '#10B981', bg: '#ECFDF5' },
  Completed: { color: '#5B5CEB', bg: '#EEF2FF' },
  Upcoming:  { color: '#F59E0B', bg: '#FFFBEB' },
}

function fmt(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmtShort(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) }
function uid() { return Date.now() + Math.random() }
// questions field may be a count (number) or an array of question objects
function qCount(f) { return Array.isArray(f?.questions) ? f.questions.length : (f?.questions ?? 0) }

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepBar({ step }) {
  const steps = ['Phase & Survey', 'Select Booths', 'Summary & Name']
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < step, active = n === step
        return (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all flex-shrink-0"
                style={{ background: (done || active) ? '#5B5CEB' : '#E2E8F0', color: (done || active) ? '#fff' : '#94A3B8' }}>
                {done ? <CheckCircle2 size={14} /> : n}
              </div>
              <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: active ? '#5B5CEB' : done ? '#10B981' : '#94A3B8' }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className="mx-3 h-px w-8 flex-shrink-0" style={{ background: done ? '#5B5CEB' : '#E2E8F0' }} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Create Assignment Wizard ─────────────────────────────────────────────────

function CreateWizard({ onClose, onSave, defaultPhaseId, phases, surveyForms, booths, stations, boothsLoading }) {
  const [step, setStep]   = useState(1)
  const [phaseId, setPId] = useState(defaultPhaseId || '')
  const [formId, setFId]  = useState('')
  const [name, setName]   = useState('')
  const [selBooths, setSel] = useState(new Set())
  const [bSearch, setBSrch] = useState('')
  const [bStation, setBStn] = useState('')
  const [rangeFrom, setRF]  = useState('')
  const [rangeTo, setRT]    = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const selectedPhase = phases.find(p => p.id === phaseId)
  const selectedForm  = surveyForms.find(f => f.id === formId)

  const filteredBooths = useMemo(() => {
    let b = booths
    if (bStation) b = b.filter(x => x.stationId === bStation)
    if (bSearch)  b = b.filter(x => x.name.toLowerCase().includes(bSearch.toLowerCase()) || x.station.toLowerCase().includes(bSearch.toLowerCase()) || x.agent.toLowerCase().includes(bSearch.toLowerCase()))
    return b
  }, [booths, bStation, bSearch])

  function toggleBooth(id) { setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  function selectAll()   { setSel(new Set(filteredBooths.map(b => b.id))) }
  function selectNone()  { setSel(new Set()) }
  function applyRange() {
    const from = parseInt(rangeFrom, 10), to = parseInt(rangeTo, 10)
    if (!from || !to || from > to) return
    const ids = booths.filter(b => parseInt(b.no, 10) >= from && parseInt(b.no, 10) <= to).map(b => b.id)
    setSel(prev => { const n = new Set(prev); ids.forEach(id => n.add(id)); return n })
  }
  function selectByStation(sid) { const ids = booths.filter(b => b.stationId === sid).map(b => b.id); setSel(new Set(ids)) }

  function validateStep1() {
    const e = {}
    if (!phaseId) e.phaseId = 'Select a campaign phase'
    if (!formId)  e.formId  = 'Select a survey form'
    setErrors(e)
    return Object.keys(e).length === 0
  }
  function validateStep2() {
    const e = {}
    if (selBooths.size === 0) e.booths = 'Select at least one booth'
    setErrors(e)
    return Object.keys(e).length === 0
  }
  function validateStep3() {
    const e = {}
    if (!name.trim()) e.name = 'Assignment name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }
  async function save() {
    if (!validateStep3()) return
    setSaving(true)
    setSaveError('')
    try {
      await onSave({ name, phaseId, formId, boothRange: 'Custom', boothCount: selBooths.size, agentCount: selBooths.size, status: 'Active', notes: '' })
      onClose()
    } catch (e) {
      setSaveError('Failed to save. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}>
      <div className="bg-white rounded-2xl border border-[#E8ECF4] flex flex-col" style={{ width: step === 2 ? 620 : 520, maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {/* Modal header */}
        <div className="px-6 py-4 border-b border-[#E8ECF4] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-800 font-bold text-[16px]">New Survey Assignment</p>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
          </div>
          <StepBar step={step} />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Phase + Form ── */}
          {step === 1 && (
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-slate-600 text-[12px] font-semibold mb-2">Campaign Phase <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={phaseId} onChange={e => setPId(e.target.value)} className={`appearance-none w-full px-3.5 py-2.5 pr-9 rounded-xl border text-[13px] text-slate-700 outline-none cursor-pointer bg-white ${errors.phaseId ? 'border-red-300 bg-red-50' : 'border-[#E8ECF4]'}`}>
                    <option value="">Select campaign phase…</option>
                    {phases.map(p => <option key={p.id} value={p.id}>{p.name} — {p.status}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {errors.phaseId && <p className="text-red-400 text-[11px] mt-1">{errors.phaseId}</p>}
                {selectedPhase && (
                  <div className="mt-2 p-3 rounded-xl border border-[#E8ECF4] bg-slate-50 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: selectedPhase.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 text-[12px] font-semibold">{selectedPhase.name}</p>
                      <p className="text-slate-400 text-[11px]">{fmtShort(selectedPhase.startDate)} → {fmtShort(selectedPhase.endDate)} · {selectedPhase.booths} booths</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: PHASE_STATUS_CFG[selectedPhase.status]?.color, background: PHASE_STATUS_CFG[selectedPhase.status]?.bg }}>{selectedPhase.status}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 text-[12px] font-semibold mb-2">Survey Form <span className="text-red-400">*</span></label>
                <div className="space-y-2">
                  {surveyForms.map(f => (
                    <label key={f.id} onClick={() => setFId(f.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formId === f.id ? 'border-[#5B5CEB] bg-[#EEF2FF]' : 'border-[#E8ECF4] hover:border-slate-300 bg-white'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${formId === f.id ? 'border-[#5B5CEB]' : 'border-slate-300'}`}>
                        {formId === f.id && <div className="w-2 h-2 rounded-full" style={{ background: '#5B5CEB' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-[13px] font-medium">{f.name}</p>
                        <p className="text-slate-400 text-[11px]">{qCount(f)} questions · {f.category}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.formId && <p className="text-red-400 text-[11px] mt-1">{errors.formId}</p>}
              </div>
            </div>
          )}

          {/* ── Step 2: Select Booths ── */}
          {step === 2 && (
            <div className="px-6 py-5">
              {/* Quick-select controls */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button onClick={selectAll}  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[#5B5CEB] text-[#5B5CEB] hover:bg-indigo-50 transition-colors">Select All ({filteredBooths.length})</button>
                <button onClick={selectNone} className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 transition-colors">Clear</button>
                <span className="text-slate-300 text-[12px]">|</span>
                <span className="text-slate-400 text-[12px] font-medium">{selBooths.size} selected</span>
              </div>

              {/* Search + Station filter */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input value={bSearch} onChange={e => setBSrch(e.target.value)} placeholder="Search booth or agent…" className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E8ECF4] text-[12px] text-slate-700 placeholder-slate-400 outline-none" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
                </div>
                <div className="relative">
                  <select value={bStation} onChange={e => setBStn(e.target.value)} className="appearance-none pl-3 pr-7 py-2 rounded-xl border border-[#E8ECF4] text-[12px] text-slate-600 outline-none cursor-pointer bg-white" style={{ minWidth: 140 }}>
                    <option value="">All Stations</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Range selector */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-slate-50 border border-[#E8ECF4]">
                <span className="text-[12px] text-slate-500 flex-shrink-0">Booth range:</span>
                <input value={rangeFrom} onChange={e => setRF(e.target.value)} placeholder="From" type="number" className="w-16 px-2 py-1 rounded-lg border border-[#E8ECF4] text-[12px] text-center outline-none bg-white" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
                <span className="text-slate-400 text-[12px]">–</span>
                <input value={rangeTo} onChange={e => setRT(e.target.value)} placeholder="To" type="number" className="w-16 px-2 py-1 rounded-lg border border-[#E8ECF4] text-[12px] text-center outline-none bg-white" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
                <button onClick={applyRange} className="px-3 py-1 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: '#5B5CEB' }}>Apply</button>
              </div>

              {/* Select by station buttons */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                <span className="text-[11px] text-slate-400 self-center">By station:</span>
                {stations.map(s => (
                  <button key={s.id} onClick={() => selectByStation(s.id)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors">{s.name}</button>
                ))}
              </div>

              {/* Booth checkbox list */}
              <div className="border border-[#E8ECF4] rounded-xl overflow-hidden" style={{ maxHeight: 260, overflowY: 'auto' }}>
                {boothsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-[12px]">
                    <Loader2 size={16} className="animate-spin" style={{ color: '#5B5CEB' }} />
                    <span>Loading booths…</span>
                  </div>
                ) : booths.length === 0 ? (
                  <div className="flex flex-col items-center gap-1 py-10 text-center">
                    <p className="text-slate-500 text-[12px] font-medium">No booth data found</p>
                    <p className="text-slate-400 text-[11px]">Import a voter CSV in the Voters page first.</p>
                  </div>
                ) : filteredBooths.length === 0
                  ? <p className="text-center py-8 text-slate-400 text-[12px]">No booths match your filter.</p>
                  : filteredBooths.map(b => (
                    <label key={b.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${selBooths.has(b.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={selBooths.has(b.id)} onChange={() => toggleBooth(b.id)} className="w-4 h-4 rounded accent-indigo-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-[13px] font-medium">{b.name}</p>
                        <p className="text-slate-400 text-[11px]">{b.station}</p>
                      </div>
                      <span className="text-slate-400 text-[11px] flex-shrink-0">{b.agent}</span>
                    </label>
                  ))
                }
              </div>
              {errors.booths && <p className="text-red-400 text-[11px] mt-2">{errors.booths}</p>}
            </div>
          )}

          {/* ── Step 3: Summary & Name ── */}
          {step === 3 && (
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-slate-600 text-[12px] font-semibold mb-1.5">Assignment Name <span className="text-red-400">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Urban Booths, Rural Zone A…" className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-slate-700 placeholder-slate-400 outline-none ${errors.name ? 'border-red-300 bg-red-50' : 'border-[#E8ECF4]'}`} onFocus={e => { if (!errors.name) e.target.style.borderColor='#5B5CEB' }} onBlur={e => { if (!errors.name) e.target.style.borderColor='#E8ECF4' }} />
                {errors.name && <p className="text-red-400 text-[11px] mt-1">{errors.name}</p>}
              </div>

              {/* Summary card */}
              <div className="rounded-2xl border border-[#E8ECF4] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E8ECF4]" style={{ background: '#F8FAFC' }}>
                  <p className="text-slate-600 font-semibold text-[12px] uppercase tracking-wider">Assignment Summary</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {[
                    ['Campaign Phase', selectedPhase?.name || '—'],
                    ['Survey Form',    selectedForm?.name  || '—'],
                    ['Questions',      selectedForm ? `${qCount(selectedForm)} questions` : '—'],
                    ['Selected Booths',   `${selBooths.size} booth${selBooths.size !== 1 ? 's' : ''}`],
                    ['Affected Agents',   `${selBooths.size} agent${selBooths.size !== 1 ? 's' : ''}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-4 py-3">
                      <span className="text-slate-400 text-[12px]">{k}</span>
                      <span className="text-slate-700 text-[12px] font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-100 bg-blue-50/50">
                <AlertCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-600 text-[12px] leading-relaxed">Booth Agents assigned to the selected booths will automatically receive <strong>{selectedForm?.name}</strong> in their mobile app.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        {saveError && (
          <div className="mx-6 mb-0 mt-2 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[12px] flex items-center gap-2">
            <AlertCircle size={13} />{saveError}
          </div>
        )}
        <div className="px-6 py-4 border-t border-[#E8ECF4] flex items-center justify-between flex-shrink-0">
          <div>
            {step > 1 && <button onClick={() => setStep(s => s - 1)} disabled={saving} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-[13px] font-medium transition-colors disabled:opacity-40"><ChevronLeft size={14} /> Back</button>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors disabled:opacity-40">Cancel</button>
            {step < 3
              ? <button onClick={next} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#5B5CEB,#818CF8)' }}>Next <ChevronRight size={14} /></button>
              : <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-70" style={{ background: 'linear-gradient(135deg,#5B5CEB,#818CF8)' }}>{saving && <Loader2 size={13} className="animate-spin" />}{saving ? 'Saving…' : 'Create Assignment'}</button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssignSurveys() {
  const [phases, setPhases]             = useState([])
  const [surveyForms, setSurveyForms]   = useState([])
  const [assignments, setAssignments]   = useState([])
  const [booths, setBooths]             = useState([])
  const [boothsLoading, setBoothsLoading] = useState(true)
  const [agents, setAgents]             = useState([])
  const [selectedPhaseId, setPhaseId]   = useState('')
  const [search, setSearch]             = useState('')
  const [filterForm, setFilterForm]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [drawer, setDrawer]             = useState(null)
  const [showCreate, setShowCreate]     = useState(false)

  useEffect(() => subscribePhases(
    data => { setPhases(data); setPhaseId(prev => prev || data[0]?.id || '') },
    err  => console.error('[AssignSurveys] phases error:', err)
  ), [])
  useEffect(() => subscribeSurveyForms(
    data => setSurveyForms(data),
    err  => console.error('[AssignSurveys] surveys error:', err)
  ), [])
  useEffect(() => subscribeAssignments(
    data => { setAssignments(data); if (drawer) setDrawer(data.find(a => a.id === drawer.id) || null) },
    err  => console.error('[AssignSurveys] assignments error:', err)
  ), [])
  useEffect(() => subscribeAgents(
    data => setAgents(data),
    err  => console.error('[AssignSurveys] agents error:', err)
  ), [])
  useEffect(() => {
    fetchAllBooths()
      .then(data => { setBooths(data); setBoothsLoading(false) })
      .catch(() => setBoothsLoading(false))
  }, [])

  const selectedPhase = phases.find(p => p.id === selectedPhaseId)
  const phaseStatusCfg = PHASE_STATUS_CFG[selectedPhase?.status] || PHASE_STATUS_CFG.Upcoming

  // Assignments for selected phase
  const phaseAssignments = useMemo(() => assignments.filter(a => a.phaseId === selectedPhaseId), [assignments, selectedPhaseId])

  // Filtered
  const filtered = useMemo(() => {
    let d = phaseAssignments
    if (search) { const q = search.toLowerCase(); d = d.filter(a => a.name.toLowerCase().includes(q)) }
    if (filterForm)   d = d.filter(a => a.formId === filterForm)
    if (filterStatus) d = d.filter(a => a.status === filterStatus)
    return d
  }, [phaseAssignments, search, filterForm, filterStatus])

  // Summary metrics for selected phase
  const totalBooths = phaseAssignments.reduce((s, a) => s + (a.boothCount || 0), 0)
  const uniqueForms = [...new Set(phaseAssignments.map(a => a.formId))].length
  const coveragePct = selectedPhase?.booths > 0 ? Math.min(100, Math.round(totalBooths / selectedPhase.booths * 100)) : 0

  // Build wizard-ready booth list from real Firestore data
  const agentByBooth = useMemo(() => {
    const map = {}
    agents.forEach(a => { if (a.boothId) map[String(a.boothId)] = a })
    return map
  }, [agents])

  const wizardBooths = useMemo(() => booths.map(b => ({
    id:        b.boothNo,
    no:        String(b.boothNo).padStart(3, '0'),
    name:      `Booth ${b.boothNo}`,
    station:   b.pollingStation || '',
    stationId: b.pollingStation || '',
    agent:     agentByBooth[String(b.boothNo)]?.name || 'Unassigned',
  })), [booths, agentByBooth])

  const wizardStations = useMemo(() => {
    const map = {}
    booths.forEach(b => {
      if (!b.pollingStation) return
      if (!map[b.pollingStation]) map[b.pollingStation] = { id: b.pollingStation, name: b.pollingStation, boothCount: 0 }
      map[b.pollingStation].boothCount++
    })
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
  }, [booths])

  async function saveAssignment(a) { await createAssignment(a) }
  async function handleDelete(id) { await deleteAssignmentSvc(id); if (drawer?.id === id) setDrawer(null) }

  return (
    <div className="-m-6 flex flex-col bg-[#F5F7FB]" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-[#E8ECF4] px-6 py-4 flex-shrink-0" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-800 font-bold text-xl">Survey Assignments</h1>
            <p className="text-slate-400 text-[13px] mt-0.5">Assign different survey forms to selected booths within a campaign phase.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8ECF4] bg-white text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors"><Download size={14} /> Export</button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#5B5CEB,#818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}><Plus size={14} /> New Assignment</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* ── Phase Selector + Phase Card ── */}
        <div className="bg-white rounded-2xl border border-[#E8ECF4] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: selectedPhase?.color + '20' }}>
                <Target size={18} style={{ color: selectedPhase?.color || '#5B5CEB' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-bold text-[15px]">{selectedPhase?.name}</p>
                <p className="text-slate-400 text-[12px] mt-0.5">
                  {fmtShort(selectedPhase?.startDate)} → {fmtShort(selectedPhase?.endDate)} &nbsp;·&nbsp; {selectedPhase?.booths} total booths
                </p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ color: phaseStatusCfg.color, background: phaseStatusCfg.bg }}>{selectedPhase?.status}</span>
            </div>

            {/* Phase picker */}
            <div className="relative flex-shrink-0">
              <select value={selectedPhaseId} onChange={e => { setPhaseId(e.target.value); setSearch(''); setFilterForm(''); setFilterStatus('') }} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E8ECF4] text-[13px] text-slate-600 outline-none cursor-pointer bg-white" style={{ minWidth: 200 }}>
                {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Assignments', value: phaseAssignments.length,          color: '#5B5CEB', bg: '#EEF2FF', icon: Layers },
            { label: 'Survey Forms Used', value: uniqueForms,                       color: '#8B5CF6', bg: '#F5F3FF', icon: ClipboardList },
            { label: 'Assigned Booths',   value: totalBooths.toLocaleString(),      color: '#10B981', bg: '#ECFDF5', icon: MapPin },
            { label: 'Coverage',          value: `${coveragePct}%`,                 color: '#F59E0B', bg: '#FFFBEB', icon: Target },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E8ECF4] p-5 flex items-center gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}><Icon size={20} style={{ color }} /></div>
              <div>
                <p className="text-slate-800 font-bold text-2xl leading-none">{value}</p>
                <p className="text-slate-400 text-[12px] mt-1">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Coverage progress bar */}
        {selectedPhase && (
          <div className="bg-white rounded-2xl border border-[#E8ECF4] px-5 py-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 text-[13px] font-semibold">Booth Coverage in This Phase</span>
              <span className="font-bold text-[14px]" style={{ color: selectedPhase.color }}>{coveragePct}% ({totalBooths.toLocaleString()} / {selectedPhase.booths || 0} booths)</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${coveragePct}%`, background: `linear-gradient(90deg, ${selectedPhase.color}, ${selectedPhase.color}99)` }} />
            </div>
            {coveragePct < 100 && (
              <p className="text-slate-400 text-[11px] mt-1.5">{((selectedPhase.booths || 0) - totalBooths).toLocaleString()} booths not yet assigned in this phase.</p>
            )}
          </div>
        )}

        {/* ── Search + Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" style={{ minWidth: 240 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assignment…" className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-700 placeholder-slate-400 outline-none" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          <div className="relative">
            <select value={filterForm} onChange={e => setFilterForm(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-600 outline-none cursor-pointer" style={{ minWidth: 160 }}>
              <option value="">All Survey Forms</option>
              {surveyForms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-600 outline-none cursor-pointer" style={{ minWidth: 130 }}>
              <option value="">All Status</option>
              {['Active','Completed','Paused','Draft'].map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {(search || filterForm || filterStatus) && <button onClick={() => { setSearch(''); setFilterForm(''); setFilterStatus('') }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-slate-500 border border-[#E8ECF4] bg-white hover:bg-slate-50 transition-colors"><X size={12} /> Clear</button>}
          <span className="ml-auto text-slate-400 text-[12px]">{filtered.length} assignment{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Assignment Table ── */}
        <div className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#E8ECF4]" style={{ background: '#F8FAFC' }}>
                {['Assignment Name', 'Survey Form', 'Booth Range', 'Assigned Booths', 'Booth Agents', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? (
                  <tr><td colSpan={8} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EEF2FF' }}><ClipboardList size={18} style={{ color: '#5B5CEB' }} /></div>
                      <p className="text-slate-500 font-medium text-[13px]">No assignments yet</p>
                      <p className="text-slate-400 text-[12px]">Create your first assignment for this campaign phase.</p>
                      <button onClick={() => setShowCreate(true)} className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#5B5CEB,#818CF8)' }}><Plus size={13} /> New Assignment</button>
                    </div>
                  </td></tr>
                )
                : filtered.map(a => {
                  const sf = surveyForms.find(f => f.id === a.formId)
                  const sc = STATUS_CFG[a.status] || STATUS_CFG.Draft
                  return (
                    <tr key={a.id} onClick={() => setDrawer(a)} className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors group">
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: selectedPhase?.color || '#5B5CEB' }} />
                          <span className="text-slate-800 font-semibold text-[13px] whitespace-nowrap">{a.name}</span>
                        </div>
                      </td>
                      {/* Survey form */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}><FileText size={11} style={{ color: '#5B5CEB' }} /></div>
                          <div>
                            <p className="text-slate-700 font-medium text-[12px] whitespace-nowrap">{sf?.name || '—'}</p>
                            <p className="text-slate-400 text-[11px]">{qCount(sf)} Q</p>
                          </div>
                        </div>
                      </td>
                      {/* Booth range */}
                      <td className="px-4 py-3.5"><span className="text-slate-500 text-[12px] font-mono">{a.boothRange}</span></td>
                      {/* Booth count */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} style={{ color: '#5B5CEB' }} />
                          <span className="text-slate-700 font-semibold">{a.boothCount}</span>
                        </div>
                      </td>
                      {/* Agents */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Users size={12} style={{ color: '#10B981' }} />
                          <span className="text-slate-700 font-semibold">{a.agentCount}</span>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: sc.color, background: sc.bg }}>{a.status}</span></td>
                      {/* Created */}
                      <td className="px-4 py-3.5 text-slate-400 text-[12px] whitespace-nowrap">{fmt(a.createdAt)}</td>
                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDrawer(a)} title="View"   className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"><Eye size={14} /></button>
                          <button onClick={() => setDrawer(a)} title="Edit"   className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => { const { id, _createdAt, ...rest } = a; createAssignment({ ...rest, name: a.name + ' (Copy)' }) }} title="Duplicate" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Copy size={14} /></button>
                          <button onClick={() => handleDelete(a.id)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Assignment Drawer ─── */}
      {drawer && (() => {
        const sf  = surveyForms.find(f => f.id === drawer.formId)
        const ph  = phases.find(p => p.id === drawer.phaseId)
        const sc  = STATUS_CFG[drawer.status] || STATUS_CFG.Draft
        return (
          <>
            <div className="fixed inset-0 bg-black/20 z-40" style={{ backdropFilter: 'blur(1px)' }} onClick={() => setDrawer(null)} />
            <div className="fixed right-0 top-16 bottom-0 bg-white border-l border-[#E8ECF4] z-50 flex flex-col" style={{ width: 400, boxShadow: '-4px 0 24px rgba(0,0,0,0.10)' }}>

              {/* Drawer header */}
              <div className="px-5 py-4 border-b border-[#E8ECF4] flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: ph?.color || '#5B5CEB' }} />
                      <p className="text-slate-400 text-[11px] font-medium">{ph?.name}</p>
                    </div>
                    <p className="text-slate-800 font-bold text-[16px]">{drawer.name}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button onClick={() => setDrawer(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mt-2" style={{ color: sc.color, background: sc.bg }}>{drawer.status}</span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Metrics */}
                <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-[#E8ECF4]">
                  {[
                    { label: 'Assigned Booths', value: drawer.boothCount, color: '#5B5CEB', bg: '#EEF2FF', icon: MapPin },
                    { label: 'Booth Agents',    value: drawer.agentCount, color: '#10B981', bg: '#ECFDF5', icon: Users },
                  ].map(({ label, value, color, bg, icon: Icon }) => (
                    <div key={label} className="rounded-xl border border-[#E8ECF4] p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}><Icon size={15} style={{ color }} /></div>
                      <div><p className="text-slate-800 font-bold text-[17px] leading-none">{value}</p><p className="text-slate-400 text-[11px] mt-0.5">{label}</p></div>
                    </div>
                  ))}
                </div>

                {/* Survey form */}
                <div className="px-5 py-4 border-b border-[#E8ECF4]">
                  <p className="text-slate-600 font-semibold text-[13px] mb-3">Survey Form</p>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E8ECF4]">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}><ClipboardList size={16} style={{ color: '#5B5CEB' }} /></div>
                    <div>
                      <p className="text-slate-700 font-semibold text-[13px]">{sf?.name || '—'}</p>
                      <p className="text-slate-400 text-[11px]">{qCount(sf)} questions · {sf?.category}</p>
                    </div>
                  </div>
                </div>

                {/* Assignment details */}
                <div className="px-5 py-4 border-b border-[#E8ECF4]">
                  <p className="text-slate-600 font-semibold text-[13px] mb-3">Assignment Details</p>
                  <div className="space-y-0">
                    {[
                      ['Campaign Phase',  ph?.name || '—'],
                      ['Booth Range',     drawer.boothRange],
                      ['Created By',      drawer.createdBy],
                      ['Created Date',    fmt(drawer.createdAt)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                        <span className="text-slate-400 text-[12px]">{k}</span>
                        <span className="text-slate-700 text-[12px] font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {drawer.notes && (
                  <div className="px-5 py-4 border-b border-[#E8ECF4]">
                    <p className="text-slate-600 font-semibold text-[13px] mb-2">Notes</p>
                    <p className="text-slate-500 text-[12px] leading-relaxed bg-slate-50 rounded-xl p-3 border border-[#E8ECF4]">{drawer.notes}</p>
                  </div>
                )}

                {/* How it works */}
                <div className="px-5 py-4">
                  <p className="text-slate-600 font-semibold text-[13px] mb-3">How This Works</p>
                  <div className="space-y-2">
                    {[
                      { icon: MapPin,       label: `${drawer.boothCount} booths assigned` },
                      { icon: Users,        label: `${drawer.agentCount} agents automatically receive the survey` },
                      { icon: ClipboardList,label: `Survey: ${sf?.name || '—'} (${qCount(sf)} Qs)` },
                      { icon: Activity,     label: 'Responses linked to Phase + Booth + Voter' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2.5 text-[12px] text-slate-500">
                        <Icon size={13} style={{ color: '#5B5CEB' }} />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-[#E8ECF4] flex-shrink-0 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors"><Edit2 size={14} /> Edit</button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors"><MapPin size={14} /> View Booths</button>
                <button onClick={() => handleDelete(drawer.id)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 text-red-400 text-[13px] font-medium hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </>
        )
      })()}

      {/* ─── Create Wizard ─── */}
      {showCreate && <CreateWizard defaultPhaseId={selectedPhaseId} onClose={() => setShowCreate(false)} onSave={saveAssignment} phases={phases} surveyForms={surveyForms} booths={wizardBooths} stations={wizardStations} boothsLoading={boothsLoading} />}
    </div>
  )
}
