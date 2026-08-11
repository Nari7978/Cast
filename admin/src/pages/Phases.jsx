import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Search, Download, X, Edit2, Archive, Eye,
  ChevronDown, ChevronLeft, ChevronRight,
  Calendar, Users, ClipboardList, BarChart2,
  CheckCircle2, Clock, AlertCircle, Circle,
  ArrowRight, MapPin, FileText, Trash2,
  Target, TrendingUp, Activity, Layers,
} from 'lucide-react'

import { subscribePhases, createPhase, updatePhase, deletePhase } from '../services/phaseService'
import { subscribeSurveyForms } from '../services/surveyService'

const STATUS_CONFIG = {
  Active:    { color: '#10B981', bg: '#ECFDF5', icon: Activity,      label: 'Active'    },
  Completed: { color: '#5B5CEB', bg: '#EEF2FF', icon: CheckCircle2,  label: 'Completed' },
  Upcoming:  { color: '#F59E0B', bg: '#FFFBEB', icon: Clock,         label: 'Upcoming'  },
  Draft:     { color: '#94A3B8', bg: '#F8FAFC', icon: Circle,        label: 'Draft'     },
  Archived:  { color: '#EF4444', bg: '#FEF2F2', icon: Archive,       label: 'Archived'  },
}

const TIMELINE_LABELS = [
  'Phase Created', 'Survey Form Added', 'Booths Assigned',
  'Survey Started', 'Responses Received', 'Phase Completed',
]

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtShort(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const EMPTY_FORM = {
  name: '', description: '', startDate: '', endDate: '',
  status: 'Draft', color: '#5B5CEB', notes: '', surveyForms: [],
}
const COLOR_PRESETS = ['#5B5CEB','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#EF4444','#64748B']

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Phases() {
  const [phases, setPhases]         = useState([])
  const [surveys, setSurveys]       = useState([])
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [drawerPhase, setDrawerPhase]   = useState(null)
  const [showForm, setShowForm]         = useState(false)
  const [editingPhase, setEditingPhase] = useState(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [formErrors, setFormErrors]     = useState({})
  const [showBoothDialog, setShowBoothDialog] = useState(false)
  const [boothSearch, setBoothSearch]         = useState('')
  const [confirmDelete, setConfirmDelete]     = useState(null)  // phase to delete

  useEffect(() => subscribePhases(data => setPhases(data)), [])
  useEffect(() => subscribeSurveyForms(data => setSurveys(data), () => {}), [])

  useEffect(() => {
    if (drawerPhase) setDrawerPhase(phases.find(p => p.id === drawerPhase.id) || null)
  }, [phases])

  // ── summary counts ────
  const counts = useMemo(() => ({
    total:     phases.length,
    active:    phases.filter(p => p.status === 'Active').length,
    completed: phases.filter(p => p.status === 'Completed').length,
    upcoming:  phases.filter(p => p.status === 'Upcoming').length,
    draft:     phases.filter(p => p.status === 'Draft').length,
  }), [phases])

  // ── filtered list ────
  const filtered = useMemo(() => {
    let data = phases
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    if (filterStatus) data = data.filter(p => p.status === filterStatus)
    return data
  }, [phases, search, filterStatus])

  // ── open edit ────
  function openEdit(phase) {
    setEditingPhase(phase)
    setForm({ name: phase.name, description: phase.description, startDate: phase.startDate, endDate: phase.endDate, status: phase.status, color: phase.color, notes: phase.notes, surveyForms: phase.surveyForms || [] })
    setFormErrors({})
    setShowForm(true)
  }

  // ── open create ────
  function openCreate() {
    setEditingPhase(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowForm(true)
  }

  // ── validate + save ────
  async function saveForm() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Phase name is required'
    if (form.startDate && form.endDate && form.endDate < form.startDate) errors.endDate = 'End date must be after start date'
    if (Object.keys(errors).length) { setFormErrors(errors); return }

    if (editingPhase) {
      await updatePhase(editingPhase.id, form)
    } else {
      await createPhase(form)
    }
    setShowForm(false)
  }

  async function archivePhase(phase) {
    await updatePhase(phase.id, { status: 'Archived' })
  }

  async function handleDelete(phase) {
    await deletePhase(phase.id)
    setConfirmDelete(null)
    if (drawerPhase?.id === phase.id) setDrawerPhase(null)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="-m-6 flex flex-col bg-[#F5F7FB]" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-[#E8ECF4] px-6 py-4 flex-shrink-0" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-800 font-bold text-xl">Campaign Phases</h1>
            <p className="text-slate-400 text-[13px] mt-0.5">Manage campaign phases, survey forms, booth assignments and execution.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8ECF4] bg-white text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">
              <Download size={14} /> Export
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}
            >
              <Plus size={14} /> Create Phase
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Phases',  value: counts.total,     color: '#5B5CEB', bg: '#EEF2FF', icon: Layers },
            { label: 'Active',        value: counts.active,    color: '#10B981', bg: '#ECFDF5', icon: Activity },
            { label: 'Completed',     value: counts.completed, color: '#8B5CF6', bg: '#F5F3FF', icon: CheckCircle2 },
            { label: 'Upcoming',      value: counts.upcoming,  color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E8ECF4] p-5 flex items-center gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-slate-800 font-bold text-2xl leading-none">{value}</p>
                <p className="text-slate-400 text-[12px] mt-1">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Filter Bar ── */}
        <div className="flex items-center gap-3">
          <div className="relative" style={{ minWidth: 260 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search phases..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-700 placeholder-slate-400 outline-none"
              onFocus={e => e.target.style.borderColor = '#5B5CEB'}
              onBlur={e => e.target.style.borderColor = '#E8ECF4'}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>
            )}
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-600 outline-none cursor-pointer"
              style={{ minWidth: 140 }}
            >
              <option value="">All Status</option>
              {['Active','Completed','Upcoming','Draft','Archived'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {(search || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterStatus('') }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-slate-500 border border-[#E8ECF4] bg-white hover:bg-slate-50 transition-colors">
              <X size={12} /> Clear
            </button>
          )}
          <span className="ml-auto text-slate-400 text-[12px]">{filtered.length} phase{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Phase Table ── */}
        <div className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#E8ECF4]" style={{ background: '#F8FAFC' }}>
                {['Phase', 'Description', 'Survey Forms', 'Booths', 'Responses', 'Start Date', 'End Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-14 text-slate-400 text-[13px]">No phases found.</td></tr>
              ) : filtered.map(phase => {
                const sc = STATUS_CONFIG[phase.status] || STATUS_CONFIG.Draft
                const StatusIcon = sc.icon
                const pct = phase.booths > 0 ? Math.round(phase.completedBooths / phase.booths * 100) : 0
                return (
                  <tr
                    key={phase.id}
                    onClick={() => setDrawerPhase(phase)}
                    className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors group"
                  >
                    {/* Phase name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: phase.color }} />
                        <span className="text-slate-800 font-semibold text-[13px] whitespace-nowrap">{phase.name}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <span className="text-slate-500 text-[12px] block truncate">{phase.description || '—'}</span>
                    </td>

                    {/* Survey Forms */}
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <FileText size={13} style={{ color: '#5B5CEB' }} />
                        {phase.surveyForms.length}
                      </span>
                    </td>

                    {/* Booths */}
                    <td className="px-4 py-3.5">
                      <div>
                        <span className="text-slate-700 font-semibold">{phase.booths.toLocaleString()}</span>
                        {phase.booths > 0 && (
                          <div className="mt-1 h-1 w-16 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: phase.color }} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Responses */}
                    <td className="px-4 py-3.5">
                      <span className="text-slate-700 font-semibold">{phase.responses.toLocaleString()}</span>
                    </td>

                    {/* Start Date */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{fmtShort(phase.startDate)}</td>

                    {/* End Date */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{fmtShort(phase.endDate)}</td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color: sc.color, background: sc.bg }}>
                        <StatusIcon size={11} />
                        {sc.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setDrawerPhase(phase)} title="View" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"><Eye size={14} /></button>
                        <button onClick={() => openEdit(phase)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Edit2 size={14} /></button>
                        {phase.status !== 'Archived' && (
                          <button onClick={() => archivePhase(phase)} title="Archive" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"><Archive size={14} /></button>
                        )}
                        <button onClick={() => setConfirmDelete(phase)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────── Phase Drawer ─────────────────── */}
      {drawerPhase && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" style={{ backdropFilter: 'blur(1px)' }} onClick={() => setDrawerPhase(null)} />
          <div className="fixed right-0 top-16 bottom-0 bg-white border-l border-[#E8ECF4] z-50 flex flex-col overflow-hidden" style={{ width: 480, boxShadow: '-4px 0 24px rgba(0,0,0,0.10)' }}>

            {/* Drawer header */}
            <div className="px-5 py-4 border-b border-[#E8ECF4] flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0" style={{ background: drawerPhase.color }} />
                  <div>
                    <p className="text-slate-800 font-bold text-[16px]">{drawerPhase.name}</p>
                    <p className="text-slate-400 text-[12px] mt-0.5">{drawerPhase.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                  <button onClick={() => { openEdit(drawerPhase); setDrawerPhase(null) }} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Edit2 size={15} /></button>
                  <button onClick={() => setDrawerPhase(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
                </div>
              </div>

              {/* Status + dates row */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {(() => { const sc = STATUS_CONFIG[drawerPhase.status] || STATUS_CONFIG.Draft; const SI = sc.icon; return (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: sc.color, background: sc.bg }}><SI size={11} />{sc.label}</span>
                )})()}
                <span className="text-slate-400 text-[12px]">
                  {fmtShort(drawerPhase.startDate)} → {fmtShort(drawerPhase.endDate)}
                </span>
              </div>
            </div>

            {/* Drawer body — scrollable */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Metrics ── */}
              <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-[#E8ECF4]">
                {[
                  { label: 'Assigned Booths',       value: drawerPhase.booths.toLocaleString(),           icon: MapPin,        color: '#5B5CEB', bg: '#EEF2FF' },
                  { label: 'Booth Agents',           value: drawerPhase.agentsAssigned.toLocaleString(),  icon: Users,         color: '#10B981', bg: '#ECFDF5' },
                  { label: 'Survey Forms',           value: drawerPhase.surveyForms.length,               icon: FileText,      color: '#8B5CF6', bg: '#F5F3FF' },
                  { label: 'Responses Collected',    value: drawerPhase.responses.toLocaleString(),       icon: BarChart2,     color: '#F59E0B', bg: '#FFFBEB' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="rounded-xl border border-[#E8ECF4] p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold text-[17px] leading-none">{value}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Survey Progress ── */}
              <div className="px-5 py-4 border-b border-[#E8ECF4]">
                <p className="text-slate-700 font-semibold text-[13px] mb-3">Survey Progress</p>
                <div className="space-y-2 mb-3">
                  {[
                    { label: 'Assigned Booths',   value: drawerPhase.booths,           color: '#5B5CEB' },
                    { label: 'Completed Booths',  value: drawerPhase.completedBooths,  color: '#10B981' },
                    { label: 'Pending Booths',    value: drawerPhase.pendingBooths,    color: '#F59E0B' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-slate-500 text-[12px]">{label}</span>
                      </div>
                      <span className="text-slate-700 text-[12px] font-semibold">{value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {drawerPhase.booths > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-400 text-[11px]">Completion</span>
                      <span className="text-[12px] font-bold" style={{ color: drawerPhase.color }}>
                        {Math.round(drawerPhase.completedBooths / drawerPhase.booths * 100)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(drawerPhase.completedBooths / drawerPhase.booths * 100)}%`, background: drawerPhase.color }} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Survey Forms ── */}
              <div className="px-5 py-4 border-b border-[#E8ECF4]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-700 font-semibold text-[13px]">Survey Forms</p>
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 transition-colors">
                    <Plus size={12} /> Add Form
                  </button>
                </div>
                {(drawerPhase.surveyForms || []).length === 0 ? (
                  <p className="text-slate-400 text-[12px] py-2">No survey forms linked.</p>
                ) : (
                  <div className="space-y-2">
                    {drawerPhase.surveyForms.map((fid, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8ECF4] hover:border-slate-200 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
                          <ClipboardList size={14} style={{ color: '#5B5CEB' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 font-semibold text-[13px]">{String(fid)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Booth Assignment ── */}
              <div className="px-5 py-4 border-b border-[#E8ECF4]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-700 font-semibold text-[13px]">Booth Assignment</p>
                  <button
                    onClick={() => setShowBoothDialog(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <MapPin size={12} /> Manage Booths
                  </button>
                </div>
                <div className="p-3 rounded-xl border border-[#E8ECF4] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EEF2FF' }}>
                      <MapPin size={14} style={{ color: '#5B5CEB' }} />
                    </div>
                    <div>
                      <p className="text-slate-700 font-semibold text-[13px]">{drawerPhase.booths.toLocaleString()} Booths Assigned</p>
                      <p className="text-slate-400 text-[11px]">{drawerPhase.agentsAssigned} agents active</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                </div>
              </div>

              {/* ── Timeline ── */}
              <div className="px-5 py-4">
                <p className="text-slate-700 font-semibold text-[13px] mb-4">Timeline</p>
                <div className="space-y-0">
                  {TIMELINE_LABELS.map((label, i) => {
                    const date = drawerPhase.timeline?.[i]
                    const done = !!date
                    const isLast = i === TIMELINE_LABELS.length - 1
                    return (
                      <div key={label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                            style={{ background: done ? drawerPhase.color : '#E2E8F0', border: '2px solid', borderColor: done ? drawerPhase.color : '#E2E8F0' }}>
                            {done && <CheckCircle2 size={12} color="white" />}
                          </div>
                          {!isLast && <div className="w-px flex-1 my-1" style={{ background: done ? drawerPhase.color + '40' : '#E2E8F0', minHeight: 24 }} />}
                        </div>
                        <div className="pb-4 pt-0.5">
                          <p className={`text-[12px] font-semibold ${done ? 'text-slate-700' : 'text-slate-400'}`}>{label}</p>
                          {date && <p className="text-slate-400 text-[11px] mt-0.5">{fmt(date)}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              {drawerPhase.notes && (
                <div className="px-5 pb-5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-[#E8ECF4]">
                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-slate-600 text-[12px] leading-relaxed">{drawerPhase.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-[#E8ECF4] flex-shrink-0">
              <div className="flex gap-2">
                <button onClick={() => { openEdit(drawerPhase); setDrawerPhase(null) }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">
                  <Edit2 size={14} /> Edit Phase
                </button>
                {drawerPhase.status !== 'Archived' && (
                  <button onClick={() => archivePhase(drawerPhase)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-100 text-amber-500 text-[13px] font-medium hover:bg-amber-50 transition-colors">
                    <Archive size={14} />
                  </button>
                )}
                <button onClick={() => setConfirmDelete(drawerPhase)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 text-red-500 text-[13px] font-medium hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────── Booth Assignment Dialog ─────────────────── */}
      {showBoothDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-2xl border border-[#E8ECF4] w-[500px] max-h-[80vh] flex flex-col" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="px-5 py-4 border-b border-[#E8ECF4] flex items-center justify-between flex-shrink-0">
              <p className="text-slate-800 font-bold text-[15px]">Manage Booth Assignments</p>
              <button onClick={() => setShowBoothDialog(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
            </div>
            <div className="px-5 py-4 border-b border-[#E8ECF4] flex-shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={boothSearch}
                  onChange={e => setBoothSearch(e.target.value)}
                  placeholder="Search booth..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8ECF4] text-[13px] text-slate-700 placeholder-slate-400 outline-none"
                  onFocus={e => e.target.style.borderColor = '#5B5CEB'}
                  onBlur={e => e.target.style.borderColor = '#E8ECF4'}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              {/* Mock booth list */}
              {Array.from({ length: 12 }, (_, i) => {
                const num = String(i + 1).padStart(3, '0')
                const stations = ['Rishikesh', 'Haridwar', 'Dehradun North', 'Dehradun South']
                const st = stations[i % stations.length]
                const label = `Booth ${num} — ${st}`
                if (boothSearch && !label.toLowerCase().includes(boothSearch.toLowerCase())) return null
                return (
                  <label key={num} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" defaultChecked={i < 8} className="w-4 h-4 rounded accent-indigo-500" />
                    <div>
                      <p className="text-slate-700 text-[13px] font-medium">Booth {num}</p>
                      <p className="text-slate-400 text-[11px]">{st}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            <div className="px-5 py-4 border-t border-[#E8ECF4] flex gap-2 flex-shrink-0">
              <button onClick={() => setShowBoothDialog(false)} className="flex-1 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => setShowBoothDialog(false)} className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)' }}>Save Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── Delete Confirmation ─────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-2xl border border-[#E8ECF4] w-[400px] p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF2F2' }}>
                <Trash2 size={18} style={{ color: '#EF4444' }} />
              </div>
              <div>
                <p className="text-slate-800 font-bold text-[15px]">Delete Phase</p>
                <p className="text-slate-400 text-[12px] mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-600 text-[13px] mb-5">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{confirmDelete.name}"</span>? All associated data will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                style={{ background: '#EF4444' }}>
                Delete Phase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── Create / Edit Phase Form ─────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-2xl border border-[#E8ECF4] w-[520px] max-h-[90vh] flex flex-col" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

            {/* Form header */}
            <div className="px-6 py-4 border-b border-[#E8ECF4] flex items-center justify-between flex-shrink-0">
              <p className="text-slate-800 font-bold text-[16px]">{editingPhase ? 'Edit Phase' : 'Create Phase'}</p>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Phase Name */}
              <div>
                <label className="block text-slate-600 text-[12px] font-semibold mb-1.5">Phase Name <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Door-to-Door Campaign"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-slate-700 placeholder-slate-400 outline-none transition-all ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-[#E8ECF4]'}`}
                  onFocus={e => { if (!formErrors.name) e.target.style.borderColor = '#5B5CEB' }}
                  onBlur={e => { if (!formErrors.name) e.target.style.borderColor = '#E8ECF4' }}
                />
                {formErrors.name && <p className="text-red-400 text-[11px] mt-1">{formErrors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-600 text-[12px] font-semibold mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this campaign phase..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8ECF4] text-[13px] text-slate-700 placeholder-slate-400 outline-none resize-none transition-all"
                  onFocus={e => e.target.style.borderColor = '#5B5CEB'}
                  onBlur={e => e.target.style.borderColor = '#E8ECF4'}
                />
              </div>

              {/* Start + End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 text-[12px] font-semibold mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8ECF4] text-[13px] text-slate-700 outline-none transition-all"
                    onFocus={e => e.target.style.borderColor = '#5B5CEB'}
                    onBlur={e => e.target.style.borderColor = '#E8ECF4'}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[12px] font-semibold mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-slate-700 outline-none transition-all ${formErrors.endDate ? 'border-red-300 bg-red-50' : 'border-[#E8ECF4]'}`}
                    onFocus={e => { if (!formErrors.endDate) e.target.style.borderColor = '#5B5CEB' }}
                    onBlur={e => { if (!formErrors.endDate) e.target.style.borderColor = '#E8ECF4' }}
                  />
                  {formErrors.endDate && <p className="text-red-400 text-[11px] mt-1">{formErrors.endDate}</p>}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-600 text-[12px] font-semibold mb-1.5">Status</label>
                <div className="relative">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="appearance-none w-full px-3.5 py-2.5 pr-9 rounded-xl border border-[#E8ECF4] text-[13px] text-slate-700 outline-none cursor-pointer">
                    {['Draft','Active','Completed','Upcoming','Archived'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-slate-600 text-[12px] font-semibold mb-2">Phase Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }}>
                      {form.color === c && <CheckCircle2 size={14} color="white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Survey Forms */}
              <div>
                <label className="block text-slate-600 text-[12px] font-semibold mb-1.5">Linked Survey Forms</label>
                {surveys.length === 0 ? (
                  <p className="text-slate-400 text-[12px]">No survey forms available. Create one first.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-[#E8ECF4] rounded-xl p-3">
                    {surveys.map(s => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form.surveyForms || []).includes(s.id)}
                          onChange={e => setForm(f => ({
                            ...f,
                            surveyForms: e.target.checked
                              ? [...(f.surveyForms || []), s.id]
                              : (f.surveyForms || []).filter(id => id !== s.id),
                          }))}
                          className="accent-[#5B5CEB]"
                        />
                        <span className="text-[13px] text-slate-700">{s.name || s.title || s.id}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-600 text-[12px] font-semibold mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes or remarks..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8ECF4] text-[13px] text-slate-700 placeholder-slate-400 outline-none resize-none transition-all"
                  onFocus={e => e.target.style.borderColor = '#5B5CEB'}
                  onBlur={e => e.target.style.borderColor = '#E8ECF4'}
                />
              </div>
            </div>

            {/* Form footer */}
            <div className="px-6 py-4 border-t border-[#E8ECF4] flex gap-2 flex-shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={saveForm} className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)' }}>
                {editingPhase ? 'Save Changes' : 'Create Phase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
