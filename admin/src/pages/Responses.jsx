import React, { useState, useMemo, useEffect } from 'react'
import {
  Search, FileSpreadsheet, FileText, Eye, X,
  ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  User, MapPin, Calendar, Building2, ClipboardList, MessageSquare,
  Layers, Activity, CheckCircle2, Hash, Loader2,
} from 'lucide-react'
import { fetchResponsesData } from '../firebase/responseService'

const PHASE_COLORS = ['#5B5CEB','#10B981','#F59E0B','#8B5CF6','#EF4444','#3B82F6','#EC4899']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildCSV(responses) {
  if (!responses.length) return ''
  const seenQ = new Set()
  const allQ = []
  responses.forEach(r => r.answers.forEach(a => {
    if (!seenQ.has(a.questionText)) { seenQ.add(a.questionText); allQ.push(a.questionText) }
  }))
  const fixed = [
    'Response ID', 'Campaign Phase', 'Survey Assignment', 'Survey Form',
    'Submission Date', 'Booth Number', 'Polling Station', 'Booth Agent',
    'EPIC Number', 'Voter Name', 'Age', 'Gender', 'Mobile',
  ]
  const headers = [...fixed, ...allQ]
  const rows = responses.map(r => {
    const aMap = {}
    r.answers.forEach(a => { aMap[a.questionText] = a.answer })
    return [
      r.id, r.phaseName, r.assignmentName, r.formName,
      r.submittedOn, r.boothNumber, r.stationName, r.agentName,
      r.epicNo, r.voterName, r.age, r.gender, r.mobile,
      ...allQ.map(q => aMap[q] ?? ''),
    ]
  })
  return [headers, ...rows]
    .map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function slug(name) {
  return name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

const PAGE_SIZE = 25

// ─── Sub-components ───────────────────────────────────────────────────────────

function SelectFilter({ value, onChange, placeholder, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        style={{ borderColor: '#E2E8F0', color: value ? '#1E293B' : '#94A3B8', minWidth: 148 }}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <span className="text-sm shrink-0" style={{ color: '#64748B' }}>{label}</span>
      <span className={`text-sm font-medium text-right ${mono ? 'font-mono' : ''}`} style={{ color: '#1E293B' }}>{value || '—'}</span>
    </div>
  )
}

function Drawer({ response, onClose }) {
  if (!response) return null
  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.18)' }} onClick={onClose} />
      <div
        className="fixed top-0 right-0 h-screen z-40 flex flex-col bg-white overflow-hidden"
        style={{ width: 440, boxShadow: '-8px 0 32px rgba(0,0,0,0.10)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#F1F5F9' }}>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#1E293B' }}>{response.id}</p>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Survey Response</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <X size={16} style={{ color: '#64748B' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* Voter Information */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User size={14} style={{ color: '#5B5CEB' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Voter Information</span>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
              <InfoRow label="EPIC Number"    value={response.epicNo} mono />
              <InfoRow label="Voter Name"     value={response.voterName} />
              <InfoRow label="Age"            value={`${response.age} years`} />
              <InfoRow label="Gender"         value={response.gender} />
              <InfoRow label="Mobile"         value={response.mobile} mono />
              <InfoRow label="Booth"          value={response.boothNumber} />
              <InfoRow label="Polling Station" value={response.stationName} />
            </div>
          </div>

          {/* Survey Information */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={14} style={{ color: '#5B5CEB' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Survey Information</span>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
              <InfoRow label="Campaign Phase"    value={response.phaseName} />
              <InfoRow label="Survey Assignment" value={response.assignmentName} />
              <InfoRow label="Survey Form"       value={response.formName} />
              <InfoRow label="Submitted By"      value={response.agentName} />
              <InfoRow label="Submission Date"   value={response.submittedOn} />
            </div>
          </div>

          {/* Survey Answers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} style={{ color: '#5B5CEB' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Survey Answers</span>
            </div>
            <div className="space-y-0">
              {response.answers.map((a, idx) => (
                <div key={idx}>
                  <div className="py-3">
                    <p className="text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                      Q{idx + 1} &nbsp; {a.questionText}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: '#1E293B' }}>{a.answer}</p>
                  </div>
                  {idx < response.answers.length - 1 && (
                    <div style={{ height: 1, background: '#F1F5F9' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Responses() {
  const [allResponses,    setAllResponses]    = useState([])
  const [phases,          setPhases]          = useState([])
  const [surveys,         setSurveys]         = useState([])
  const [agents,          setAgents]          = useState([])
  const [booths,          setBooths]          = useState([])
  const [uniqueStations,  setUniqueStations]  = useState([])
  const [loading,         setLoading]         = useState(true)

  const [search,        setSearch]        = useState('')
  const [filterPhase,   setFilterPhase]   = useState('')
  const [filterForm,    setFilterForm]    = useState('')
  const [filterStation, setFilterStation] = useState('')
  const [filterBooth,   setFilterBooth]   = useState('')
  const [filterAgent,   setFilterAgent]   = useState('')
  const [dateFrom,      setDateFrom]      = useState('')
  const [dateTo,        setDateTo]        = useState('')
  const [page,          setPage]          = useState(1)
  const [selected,      setSelected]      = useState(null)

  useEffect(() => {
    fetchResponsesData()
      .then(d => {
        setAllResponses(d.responses)
        setPhases(d.phases)
        setSurveys(d.surveys)
        setAgents(d.agents)
        setBooths(d.booths)
        setUniqueStations(d.uniqueStations)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const availableBooths = useMemo(() =>
    filterStation ? booths.filter(b => b.pollingStation === filterStation) : booths,
  [filterStation, booths])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allResponses.filter(r => {
      if (q && ![r.id, r.epicNo, r.voterName, r.boothNumber, r.agentName]
        .some(v => String(v).toLowerCase().includes(q))) return false
      if (filterPhase   && r.phaseId   !== filterPhase)   return false
      if (filterForm    && r.surveyId  !== filterForm)     return false
      if (filterStation && r.stationName !== filterStation) return false
      if (filterBooth   && r.boothNo   !== filterBooth)   return false
      if (filterAgent   && r.agentName !== filterAgent)   return false
      if (dateFrom) {
        if (!r.submittedDate || new Date(r.submittedDate) < new Date(dateFrom)) return false
      }
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (!r.submittedDate || new Date(r.submittedDate) > to) return false
      }
      return true
    })
  }, [allResponses, search, filterPhase, filterForm, filterStation, filterBooth, filterAgent, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const resetFilters = () => {
    setSearch(''); setFilterPhase(''); setFilterForm('')
    setFilterStation(''); setFilterBooth(''); setFilterAgent('')
    setDateFrom(''); setDateTo(''); setPage(1)
  }
  const hasFilters = search || filterPhase || filterForm ||
    filterStation || filterBooth || filterAgent || dateFrom || dateTo

  function handleExportFiltered() {
    const phase = phases.find(p => p.id === filterPhase)
    const namePart = phase ? slug(phase.name) : 'Filtered'
    downloadCSV(buildCSV(filtered), `${namePart}_Survey_Responses.csv`)
  }

  function handleExportAll() {
    downloadCSV(buildCSV(allResponses), 'All_Survey_Responses.csv')
  }

  const goPage = n => setPage(Math.max(1, Math.min(totalPages, n)))

  const todayStr        = new Date().toDateString()
  const todayCount      = allResponses.filter(r => r.submittedDate && new Date(r.submittedDate).toDateString() === todayStr).length
  const activePhaseName = filterPhase
    ? phases.find(p => p.id === filterPhase)?.name
    : phases.find(p => p.status === 'Active')?.name || (phases[0]?.name ?? '—')
  const activeSurveyCount = surveys.filter(s => s.status === 'Active').length || surveys.length

  const phaseColorMap = useMemo(() => {
    const m = {}
    phases.forEach((p, i) => { m[p.id] = PHASE_COLORS[i % PHASE_COLORS.length] })
    return m
  }, [phases])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={28} className="animate-spin" style={{ color: '#5B5CEB' }} />
        <p className="text-sm" style={{ color: '#64748B' }}>Loading responses...</p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="-m-6 mb-0 px-8 py-6 border-b" style={{ background: '#fff', borderColor: '#F1F5F9' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>Responses</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
          View, search and export all completed survey responses.
        </p>
      </div>

      <div className="mt-6 space-y-5">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: MessageSquare, label: 'Total Responses',  value: allResponses.length.toLocaleString(), color: '#5B5CEB', bg: '#EEF2FF' },
            { icon: Activity,      label: 'Responses Today',  value: todayCount.toLocaleString(),          color: '#10B981', bg: '#ECFDF5' },
            { icon: Layers,        label: 'Campaign Phase',   value: activePhaseName,                       color: '#F59E0B', bg: '#FFFBEB', small: true },
            { icon: ClipboardList, label: 'Survey Forms',     value: `${activeSurveyCount} Active`,         color: '#8B5CF6', bg: '#F5F3FF' },
          ].map(({ icon: Icon, label, value, color, bg, small }) => (
            <div key={label} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: '#64748B' }}>{label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={17} style={{ color }} />
                </div>
              </div>
              <p className={`font-bold truncate ${small ? 'text-base' : 'text-2xl'}`} style={{ color: '#0F172A' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Search + Export Row ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by Response ID, EPIC, Voter Name, Booth or Agent..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
            />
          </div>
          <button
            onClick={handleExportFiltered}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-slate-50"
            style={{ borderColor: '#E2E8F0', color: '#334155' }}
          >
            <FileText size={15} style={{ color: '#5B5CEB' }} />
            Export CSV
          </button>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: '#5B5CEB' }}
          >
            <FileSpreadsheet size={15} />
            Export Excel
          </button>
        </div>

        {/* ── Filter Row ── */}
        <div className="flex flex-wrap items-center gap-2.5">
          <SelectFilter value={filterPhase} onChange={v => { setFilterPhase(v); setPage(1) }} placeholder="Campaign Phase">
            {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectFilter>

          <SelectFilter value={filterForm} onChange={v => { setFilterForm(v); setPage(1) }} placeholder="Survey Form">
            {surveys.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </SelectFilter>

          <SelectFilter value={filterStation} onChange={v => { setFilterStation(v); setFilterBooth(''); setPage(1) }} placeholder="Polling Station">
            {uniqueStations.map(s => <option key={s} value={s}>{s}</option>)}
          </SelectFilter>

          <SelectFilter value={filterBooth} onChange={v => { setFilterBooth(v); setPage(1) }} placeholder="Booth">
            {availableBooths.map(b => <option key={b.boothNo} value={b.boothNo}>Booth {b.boothNo}</option>)}
          </SelectFilter>

          <SelectFilter value={filterAgent} onChange={v => { setFilterAgent(v); setPage(1) }} placeholder="Booth Agent">
            {agents.map(a => <option key={a} value={a}>{a}</option>)}
          </SelectFilter>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ borderColor: '#E2E8F0', color: dateFrom ? '#1E293B' : '#94A3B8' }}
            />
            <span className="text-xs" style={{ color: '#94A3B8' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ borderColor: '#E2E8F0', color: dateTo ? '#1E293B' : '#94A3B8' }}
            />
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-red-50"
              style={{ color: '#EF4444', border: '1px solid #FEE2E2' }}
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#F8FAFC' }}>
                <MessageSquare size={26} style={{ color: '#CBD5E1' }} />
              </div>
              <p className="font-semibold text-base mb-1" style={{ color: '#1E293B' }}>No survey responses found.</p>
              <p className="text-sm text-center max-w-xs" style={{ color: '#94A3B8' }}>
                Completed surveys submitted by Booth Agents will appear here.
              </p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-90"
                  style={{ background: '#EEF2FF', color: '#5B5CEB' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    {['Response ID','EPIC Number','Voter Name','Booth','Polling Station','Booth Agent','Campaign Phase','Survey Form','Submitted On','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: '#64748B' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, idx) => (
                    <TableRow key={r.id} r={r} idx={idx} onView={() => setSelected(r)} phaseColorMap={phaseColorMap} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: '#64748B' }}>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} responses
            </p>
            <div className="flex items-center gap-1">
              <PagBtn onClick={() => goPage(1)} disabled={safePage === 1}><ChevronsLeft size={14} /></PagBtn>
              <PagBtn onClick={() => goPage(safePage - 1)} disabled={safePage === 1}><ChevronLeft size={14} /></PagBtn>
              {paginationWindow(safePage, totalPages).map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} className="px-2 text-sm" style={{ color: '#94A3B8' }}>…</span>
                  : <PagBtn key={n} active={n === safePage} onClick={() => goPage(n)}>{n}</PagBtn>
              )}
              <PagBtn onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages}><ChevronRight size={14} /></PagBtn>
              <PagBtn onClick={() => goPage(totalPages)} disabled={safePage === totalPages}><ChevronsRight size={14} /></PagBtn>
            </div>
          </div>
        )}
      </div>

      {/* ── Drawer ── */}
      <Drawer response={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function TableRow({ r, idx, onView, phaseColorMap }) {
  const [hover, setHover] = useState(false)

  const phaseColor = phaseColorMap?.[r.phaseId] ?? '#5B5CEB'

  return (
    <tr
      style={{
        background: hover ? '#F8FAFC' : idx % 2 === 0 ? '#fff' : '#FAFAFA',
        borderBottom: '1px solid #F1F5F9',
        transition: 'background 0.1s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: '#EEF2FF', color: '#5B5CEB' }}>
          {r.id}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-mono text-xs" style={{ color: '#475569' }}>{r.epicNo}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ color: '#1E293B' }}>{r.voterName}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: '#EEF2FF', color: '#5B5CEB' }}>
          {r.boothNumber}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: '#475569', maxWidth: 180 }}>
        <span className="truncate block" title={r.stationName}>{r.stationName}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: '#475569' }}>{r.agentName}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: phaseColor }} />
          <span className="text-sm truncate" style={{ color: '#475569', maxWidth: 140 }}>{r.phaseName}</span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: '#475569' }}>{r.formName}</td>
      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: '#64748B' }}>{r.submittedOn}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-90"
          style={{ background: '#EEF2FF', color: '#5B5CEB' }}
        >
          <Eye size={13} />
          View
        </button>
      </td>
    </tr>
  )
}

// ─── Pagination helpers ───────────────────────────────────────────────────────

function PagBtn({ onClick, disabled, active, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
      style={{
        background: active ? '#5B5CEB' : 'transparent',
        color: active ? '#fff' : disabled ? '#CBD5E1' : '#475569',
        border: active ? 'none' : '1px solid #E2E8F0',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function paginationWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}
