import { useState, useMemo, useEffect } from 'react'
import {
  Search, Plus, Upload, Download, X, Eye, EyeOff, Edit2, Trash2,
  Phone, ChevronLeft, ChevronRight,
  Users, UserCheck, UserX, MapPin, RefreshCw,
  Copy, Check, KeyRound,
} from 'lucide-react'

import { subscribeAgents, createAgent, updateAgent, deleteAgent as deleteAgentSvc } from '../services/agentService'
import { fetchAllBooths } from '../services/voterService'
import { subscribePhases } from '../services/phaseService'

const generatePIN = () => String(Math.floor(1000 + Math.random() * 9000))
const EMPTY_FORM = { name: '', mobile: '', email: '', gender: 'Male', boothNos: [], phaseId: '', status: 'Active', notes: '', pin: generatePIN() }

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = { Male: '#5B5CEB', Female: '#EC4899', Other: '#10B981' }

function Avatar({ name, gender, size = 8 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('')
  const color = AVATAR_COLORS[gender] ?? '#5B5CEB'
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: color, fontSize: size < 9 ? 11 : 13 }}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    Active:   { bg: '#ECFDF5', color: '#059669', dot: '#10B981' },
    Inactive: { bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  }[status] ?? { bg: '#F8FAFC', color: '#64748B', dot: '#94A3B8' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {status}
    </span>
  )
}

function Field({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0 gap-4">
      <span className="text-slate-400 text-[12px] flex-shrink-0">{label}</span>
      <span className="text-slate-700 text-[12px] font-semibold text-right">{value || '—'}</span>
    </div>
  )
}

// ── Agent Drawer ──────────────────────────────────────────────────────────────

function PINCell({ pin }) {
  const [copied, setCopied] = useState(false)
  const copy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(pin || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  if (!pin) return <span className="text-slate-300 text-[12px]">—</span>
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono font-bold text-[13px] text-[#5B5CEB] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg tracking-widest">
        {pin}
      </span>
      <button onClick={copy} className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-[#5B5CEB] transition-colors">
        {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
      </button>
    </div>
  )
}

function PINDisplay({ pin }) {
  const [visible, setVisible] = useState(false)
  const [copied,  setCopied]  = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(pin || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
      <span className="text-slate-400 text-[12px]">Login PIN</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-700 text-[13px] font-bold font-mono tracking-widest">
          {pin ? (visible ? pin : '••••') : '—'}
        </span>
        {pin && (
          <>
            <button onClick={() => setVisible(v => !v)}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 transition-colors">
              {visible ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button onClick={copy}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-[#5B5CEB] transition-colors">
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AgentDrawer({ agent, phases, onClose, onEdit }) {
  const phaseName = phases?.find(p => p.id === agent.phaseId)?.name || agent.phaseId || '—'
  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-white z-50 flex flex-col shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-[#E8ECF4]">
          <div className="flex items-center gap-3">
            <Avatar name={agent.name} gender={agent.gender} size={10} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Agent Details</p>
              <h2 className="text-slate-800 font-bold text-[15px] leading-tight">{agent.name}</h2>
              <p className="text-slate-400 text-[11px] mt-0.5">{agent.mobile}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[#E8ECF4] flex items-center justify-between">
          <span className="text-[12px] text-slate-500">Status</span>
          <StatusBadge status={agent.status} />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Contact Information</p>
            <div className="space-y-0">
              <Field label="Full Name"  value={agent.name}   />
              <Field label="Mobile"     value={agent.mobile} />
              <Field label="Email"      value={agent.email}  />
              <Field label="Gender"     value={agent.gender} />
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound size={13} className="text-[#5B5CEB]" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5B5CEB]">Login Credentials</p>
            </div>
            <Field label="Phone (Login ID)" value={agent.mobile} />
            <PINDisplay pin={agent.pin} />
            <p className="text-[11px] text-indigo-400 mt-2">Share these credentials with the agent to log in to the mobile app.</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Assignment</p>
            <div className="space-y-0">
              <Field label="Phase"           value={phaseName} />
              <Field label="Booth(s)" value={
                agent.boothNos?.length
                  ? agent.boothNos.map(b => `Booth ${b}`).join(', ')
                  : `Booth ${agent.boothNo}`
              } />
              <Field label="Polling Station" value={agent.station} />
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Record Info</p>
            <div className="space-y-0">
              <Field label="Created Date" value={agent.created} />
              <Field label="Last Updated" value={agent.updated} />
              {agent.notes && <Field label="Notes" value={agent.notes} />}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[#E8ECF4] space-y-2">
          <button onClick={() => { onClose(); onEdit(agent) }}
            className="w-full py-2.5 rounded-xl text-white font-semibold text-[13px] hover:opacity-90 transition-opacity"
            style={{ background: '#5B5CEB' }}>
            Edit Agent
          </button>
          <button className="w-full py-2.5 rounded-xl font-semibold text-[13px] text-slate-700 border border-[#E8ECF4] hover:bg-slate-50 transition-colors">
            Change Booth Assignment
          </button>
          <button className="w-full py-2.5 rounded-xl font-semibold text-[13px] text-slate-700 border border-[#E8ECF4] hover:bg-slate-50 transition-colors">
            View Booth
          </button>
        </div>
      </div>
    </>
  )
}

// ── Agent Form Modal ──────────────────────────────────────────────────────────

function AgentForm({ editingAgent, agents, booths, phases, onClose, onSave }) {
  const initBoothNos = editingAgent
    ? (editingAgent.boothNos?.length ? editingAgent.boothNos : (editingAgent.boothNo ? [editingAgent.boothNo] : []))
    : []
  const [form, setForm] = useState(editingAgent
    ? { name: editingAgent.name, mobile: editingAgent.mobile, email: editingAgent.email,
        gender: editingAgent.gender,
        boothNos: initBoothNos,
        phaseId: editingAgent.phaseId || '',
        status: editingAgent.status, notes: editingAgent.notes || '',
        pin: editingAgent.pin || generatePIN() }
    : { ...EMPTY_FORM, pin: generatePIN() })
  const [errors, setErrors] = useState({})

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleBooth = (boothNo) => setForm(f => {
    const already = f.boothNos.includes(boothNo)
    return { ...f, boothNos: already ? f.boothNos.filter(b => b !== boothNo) : [...f.boothNos, boothNo] }
  })

  const selectedBooths = booths.filter(b => form.boothNos.includes(b.boothNo))
  const primaryBooth = selectedBooths[0]

  const validate = () => {
    const e = {}
    if (!form.name.trim())        e.name  = 'Full name is required'
    if (!form.mobile.trim())      e.mobile = 'Mobile number is required'
    if (!/^\d{10}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit mobile number'
    if (!form.boothNos.length)    e.booth  = 'Select at least one booth'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const data = {
      ...form,
      boothNos: form.boothNos,
      boothNo: form.boothNos[0] || '',
      boothNames: selectedBooths.map(b => b.pollingStation || ''),
      station: primaryBooth?.pollingStation || '',
    }
    onSave(editingAgent ? { id: editingAgent.id, ...data } : data)
  }

  const inputCls = (err) =>
    `w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${err ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-[#5B5CEB]/20 focus:border-[#5B5CEB]/60'}`

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8ECF4]">
            <div>
              <h2 className="text-slate-800 font-bold text-[15px]">{editingAgent ? 'Edit Agent' : 'Add Booth Agent'}</h2>
              <p className="text-slate-400 text-[11px] mt-0.5">{editingAgent ? 'Update agent information' : 'Add a new field agent to a booth'}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Full Name <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter agent full name" className={inputCls(errors.name)} />
              {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
            </div>

            {/* Mobile + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Mobile Number <span className="text-red-400">*</span></label>
                <input value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="10-digit number" className={inputCls(errors.mobile)} />
                {errors.mobile && <p className="text-red-500 text-[11px] mt-1">{errors.mobile}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" className={inputCls(false)} />
              </div>
            </div>

            {/* Gender + Phase */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls(false)}>
                  {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Phase</label>
                <select value={form.phaseId} onChange={e => set('phaseId', e.target.value)} className={inputCls(false)}>
                  <option value="">Select phase...</option>
                  {phases.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Booths (multi-select checkboxes) */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                Booth(s) <span className="text-red-400">*</span>
                {form.boothNos.length > 0 && (
                  <span className="ml-2 text-[#5B5CEB] font-normal">{form.boothNos.length} selected</span>
                )}
              </label>
              <div className={`rounded-xl border overflow-hidden ${errors.booth ? 'border-red-300' : 'border-slate-200'}`}>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {booths.map(b => (
                    <label key={b.boothNo}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-indigo-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.boothNos.includes(b.boothNo)}
                        onChange={() => toggleBooth(b.boothNo)}
                        className="accent-[#5B5CEB] w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-[12px] text-slate-700">
                        <span className="font-semibold">Booth {b.boothNo}</span>
                        {b.pollingStation ? <span className="text-slate-400"> – {b.pollingStation}</span> : ''}
                      </span>
                    </label>
                  ))}
                  {booths.length === 0 && (
                    <div className="px-3 py-4 text-[12px] text-slate-400 text-center">No booths available</div>
                  )}
                </div>
              </div>
              {errors.booth && <p className="text-red-500 text-[11px] mt-1">{errors.booth}</p>}
            </div>

            {/* Polling Station (auto-filled from first selected booth) */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Polling Station</label>
              <div className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border text-[13px] ${primaryBooth ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <MapPin size={13} className={primaryBooth ? 'text-indigo-400' : 'text-slate-300'} />
                <span>{primaryBooth ? primaryBooth.pollingStation : 'Auto-filled from first selected booth'}</span>
              </div>
            </div>

            {/* Status + PIN */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls(false)}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                  Login PIN <span className="text-slate-400 font-normal">(4-digit)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={form.pin}
                    onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Auto-generated"
                    maxLength={4}
                    className={`${inputCls(false)} font-mono tracking-widest text-center text-lg font-bold`}
                  />
                  <button type="button" onClick={() => set('pin', generatePIN())}
                    className="px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-[#5B5CEB] hover:border-indigo-200 transition-colors flex-shrink-0"
                    title="Generate new PIN">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Notes <span className="text-slate-400 font-normal">(Optional)</span></label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." rows={3}
                className={`${inputCls(false)} resize-none`} />
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-4 border-t border-[#E8ECF4]">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#E8ECF4] text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#5B5CEB' }}>
              {editingAgent ? 'Save Changes' : 'Add Agent'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function BoothAgents() {
  const [agents,        setAgents]        = useState([])
  const [booths,        setBooths]        = useState([])
  const [phases,        setPhases]        = useState([])
  const [search,        setSearch]        = useState('')
  const [stationFilter, setStationFilter] = useState('All')
  const [statusFilter,  setStatusFilter]  = useState('All')
  const [page,          setPage]          = useState(1)
  const [drawerAgent,   setDrawerAgent]   = useState(null)
  const [showForm,      setShowForm]      = useState(false)
  const [editingAgent,  setEditingAgent]  = useState(null)

  useEffect(() => subscribeAgents(data => {
    setAgents(data)
    setDrawerAgent(prev => prev ? data.find(a => a.id === prev.id) || null : null)
  }), [])

  useEffect(() => {
    fetchAllBooths(setBooths).then(setBooths).catch(() => {})
  }, [])

  useEffect(() => subscribePhases(setPhases, () => {}), [])

  const uniqueStations = useMemo(() =>
    ['All', ...[...new Set(booths.map(b => b.pollingStation).filter(Boolean))].sort()],
  [booths])

  const boothMap = useMemo(() => {
    const m = {}
    booths.forEach(b => { m[b.boothNo] = b.pollingStation || '' })
    return m
  }, [booths])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return agents.filter(a => {
      const matchSearch = !q || a.name.toLowerCase().includes(q) || a.mobile.includes(q) ||
        String(a.boothNo).includes(q) || a.boothName.toLowerCase().includes(q) || a.station.toLowerCase().includes(q)
      const matchStation = stationFilter === 'All' || a.station === stationFilter
      const matchStatus  = statusFilter  === 'All' || a.status  === statusFilter
      return matchSearch && matchStation && matchStatus
    })
  }, [agents, search, stationFilter, statusFilter])

  const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const activeCount   = agents.filter(a => a.status === 'Active').length
  const inactiveCount = agents.filter(a => a.status === 'Inactive').length

  const openAdd  = () => { setEditingAgent(null);    setShowForm(true) }
  const openEdit = (a) => { setEditingAgent(a);      setShowForm(true) }

  const handleSave = async (data) => {
    if (data.id) {
      const { id, ...rest } = data
      await updateAgent(id, rest)
    } else {
      await createAgent(data)
    }
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    await deleteAgentSvc(id)
    setDrawerAgent(null)
  }

  const cards = [
    { label: 'Total Booth Agents', value: agents.length,  icon: Users,      color: '#5B5CEB', bg: '#EEF2FF' },
    { label: 'Assigned Booths',    value: agents.length,  icon: MapPin,     color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Active Agents',      value: activeCount,    icon: UserCheck,  color: '#10B981', bg: '#ECFDF5' },
    { label: 'Inactive Agents',    value: inactiveCount,  icon: UserX,      color: '#EF4444', bg: '#FEF2F2' },
  ]

  return (
    <div className="-m-6">

      {/* ── Action Bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white border-b border-[#E8ECF4]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-slate-800 font-bold text-xl">Booth Agents</h2>
            <p className="text-slate-400 text-[13px] mt-0.5">Manage booth-level field agents</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-[#E8ECF4] rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={14} /> Export
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-[#E8ECF4] rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Upload size={14} /> Import Agents
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#5B5CEB' }}>
              <Plus size={14} /> Add Booth Agent
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by agent name, mobile number or booth..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5CEB]/20 focus:border-[#5B5CEB]/50 transition-all"
            />
          </div>

          {/* Polling Station filter */}
          <select value={stationFilter} onChange={e => { setStationFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white border border-[#E8ECF4] rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5B5CEB]/20">
            {uniqueStations.map(s => <option key={s} value={s}>{s === 'All' ? 'All Polling Stations' : s}</option>)}
          </select>

          {/* Status tabs */}
          <div className="flex items-center gap-1">
            {['All', 'Active', 'Inactive'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                style={statusFilter === s ? { background: '#5B5CEB', color: '#fff' } : { background: '#F8FAFC', color: '#64748B' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 bg-[#F5F7FB] pt-5 pb-6 space-y-5">

        {/* ── Summary Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {cards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E8ECF4] p-4 flex items-center gap-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-slate-800 font-bold text-2xl leading-tight">{value}</p>
                <p className="text-slate-400 text-[11px] font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Table ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E8ECF4]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E8ECF4' }}>
                  {['Agent', 'Mobile', 'PIN', 'Assigned Booth', 'Polling Station', 'Status', 'Last Updated', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                          <Users size={22} className="text-slate-300" />
                        </div>
                        <p className="text-slate-600 font-medium text-[13px]">No booth agents found</p>
                        <p className="text-slate-400 text-[12px] mt-1">Try changing filters or add a new booth agent.</p>
                        <button onClick={openAdd} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[12px] font-semibold" style={{ background: '#5B5CEB' }}>
                          <Plus size={13} /> Add Booth Agent
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginated.map(agent => (
                  <tr key={agent.id} onClick={() => setDrawerAgent(agent)}
                    className="hover:bg-indigo-50/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={agent.name} gender={agent.gender} size={8} />
                        <div>
                          <p className="text-slate-700 text-[13px] font-semibold">{agent.name}</p>
                          <p className="text-slate-400 text-[11px]">{agent.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-600 text-[12px]">
                        <Phone size={12} className="text-slate-400" />
                        {agent.mobile}
                      </div>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <PINCell pin={agent.pin} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        {(agent.boothNos?.length ? agent.boothNos : (agent.boothNo ? [agent.boothNo] : [])).map(bn => (
                          <div key={bn} className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{ background: '#EEF2FF', color: '#5B5CEB' }}>
                              {bn}
                            </span>
                            <span className="text-[12px] text-slate-600 truncate max-w-[140px]">
                              {boothMap[bn] || '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-500 text-[12px] max-w-[180px] truncate">{agent.station}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-slate-400 text-[11px]">{agent.updated}</span>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDrawerAgent(agent)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#5B5CEB] hover:bg-indigo-50 transition-colors">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(agent)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                          <RefreshCw size={13} />
                        </button>
                        <button onClick={() => handleDelete(agent.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="px-5 py-3.5 border-t border-[#E8ECF4] flex items-center justify-between">
              <p className="text-[12px] text-slate-400">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} booth agents
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-medium transition-all"
                    style={page === p ? { background: '#5B5CEB', color: '#fff' } : { border: '1px solid #E8ECF4', color: '#64748B' }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      {drawerAgent && (
        <AgentDrawer agent={drawerAgent} phases={phases} onClose={() => setDrawerAgent(null)} onEdit={openEdit} />
      )}

      {/* ── Form Modal ──────────────────────────────────────────────────────── */}
      {showForm && (
        <AgentForm editingAgent={editingAgent} agents={agents} booths={booths} phases={phases} onClose={() => setShowForm(false)} onSave={handleSave} />
      )}
    </div>
  )
}
