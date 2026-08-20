import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Upload, Download, MapPin, Users, UserCheck,
  AlertCircle, Eye, X, ChevronLeft, ChevronRight, Loader2,
  Building2, Phone, LayoutGrid, Table2,
} from 'lucide-react'
import { fetchAllBooths } from '../services/voterService'
import { subscribeAgents } from '../services/agentService'
import { supabase } from '../supabase/config'

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    Active:   { bg: '#ECFDF5', color: '#059669', dot: '#10B981' },
    Pending:  { bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
    Inactive: { bg: '#F8FAFC', color: '#64748B', dot: '#94A3B8' },
  }[status] ?? { bg: '#F8FAFC', color: '#64748B', dot: '#94A3B8' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  )
}

function AgentCell({ agent }) {
  if (!agent) return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
      <AlertCircle size={11} /> Unassigned
    </span>
  )
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
        style={{ background: '#5B5CEB' }}>
        {agent.name?.[0] ?? '?'}
      </div>
      <span className="text-slate-700 text-[12px] font-medium">{agent.name}</span>
    </div>
  )
}

// ── Rate helpers ──────────────────────────────────────────────────────────────

function rateColor(rate) {
  if (rate >= 70) return { bg: '#ECFDF5', border: '#6EE7B7', text: '#059669', fill: '#10B981' }
  if (rate >= 40) return { bg: '#FFFBEB', border: '#FCD34D', text: '#D97706', fill: '#F59E0B' }
  if (rate > 0)   return { bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626', fill: '#EF4444' }
  return           { bg: '#F8FAFC', border: '#E2E8F0', text: '#94A3B8', fill: '#CBD5E1' }
}

// ── Booth Drawer ──────────────────────────────────────────────────────────────

function BoothDrawer({ booth, agent, stationName, responseCount, onClose }) {
  const rate = booth.voterCount ? Math.min(100, Math.round(responseCount / booth.voterCount * 100)) : 0
  const rc = rateColor(rate)

  const fields = [
    { label: 'Booth Number',    value: `#${booth.boothNo}` },
    { label: 'Polling Station', value: stationName },
    { label: 'Total Voters',    value: (booth.voterCount || 0).toLocaleString() },
    { label: 'Responses',       value: responseCount.toLocaleString() },
    { label: 'Response Rate',   value: `${rate}%` },
    { label: 'Phase',           value: agent?.phase || '—' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-white z-50 flex flex-col shadow-2xl">
        <div className="flex items-start justify-between p-5 border-b border-[#E8ECF4]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Booth Details</p>
            <h2 className="text-slate-800 font-bold text-lg leading-tight">Booth #{booth.boothNo}</h2>
            <p className="text-slate-400 text-[12px] mt-0.5">{stationName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Rate bar */}
        <div className="px-5 py-4 border-b border-[#E8ECF4]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-slate-500">Response Rate</span>
            <span className="text-[13px] font-bold" style={{ color: rc.text }}>{rate}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${rate}%`, background: rc.fill }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-400">{responseCount} responded</span>
            <span className="text-[10px] text-slate-400">{Math.max(0, (booth.voterCount || 0) - responseCount)} pending</span>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-[#E8ECF4] flex items-center justify-between">
          <span className="text-[12px] text-slate-500">Agent Status</span>
          <StatusBadge status={agent ? 'Active' : 'Pending'} />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            {fields.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-slate-400 text-[12px] flex-shrink-0">{label}</span>
                <span className="text-slate-700 text-[12px] font-semibold text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Assigned Agent</p>
            {agent ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: '#5B5CEB' }}>
                  {agent.name?.[0] ?? '?'}
                </div>
                <div>
                  <p className="text-slate-800 font-semibold text-[13px]">{agent.name}</p>
                  {agent.mobile && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                      <Phone size={11} />{agent.mobile}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                <p className="text-amber-700 text-[12px] font-medium">No agent assigned to this booth</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[#E8ECF4] space-y-2">
          <button className="w-full py-2.5 rounded-xl text-white font-semibold text-[13px] transition-opacity hover:opacity-90"
            style={{ background: '#5B5CEB' }}>
            Edit Booth
          </button>
          <button className="w-full py-2.5 rounded-xl font-semibold text-[13px] text-slate-700 border border-[#E8ECF4] hover:bg-slate-50 transition-colors">
            View Responses
          </button>
        </div>
      </div>
    </>
  )
}

// ── Heat Map ──────────────────────────────────────────────────────────────────

function BoothTile({ booth, agent, responseCount, onClick }) {
  const voterCount = booth.voterCount || 0
  const rate = voterCount ? Math.min(100, Math.round(responseCount / voterCount * 100)) : 0
  const rc = rateColor(rate)
  const [hovered, setHovered] = useState(false)
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    setTipPos({ x: e.clientX, y: e.clientY })
  }

  return (
    <div className="relative" onMouseMove={handleMouseMove}>
      <button
        onClick={() => onClick(booth)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all hover:scale-105 hover:shadow-md"
        style={{
          background: rc.bg,
          borderColor: hovered ? rc.fill : rc.border,
          boxShadow: hovered ? `0 4px 12px ${rc.fill}40` : 'none',
        }}
      >
        <span className="text-[13px] font-extrabold" style={{ color: rc.text }}>
          {booth.boothNo}
        </span>
        <span className="text-[10px] font-semibold mt-0.5" style={{ color: rc.text }}>
          {rate}%
        </span>
      </button>

      {/* Tooltip */}
      {hovered && (
        <div className="pointer-events-none fixed z-50 w-[180px]"
          style={{ left: tipPos.x + 14, top: tipPos.y - 60 }}>
          <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xl text-left"
            style={{ fontSize: 11 }}>
            <p className="font-bold text-[13px] mb-2">Booth #{booth.boothNo}</p>
            <div className="space-y-1">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Voters</span>
                <span className="font-semibold">{voterCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Responses</span>
                <span className="font-semibold">{responseCount}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Rate</span>
                <span className="font-bold" style={{ color: rc.fill }}>{rate}%</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Agent</span>
                <span className="font-semibold truncate max-w-[80px]">{agent?.name || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeatMap({ booths, agents, agentByBooth, boothResponseCounts, onBoothClick }) {
  const [search, setSearch] = useState('')

  // Group booths by polling station
  const grouped = useMemo(() => {
    const map = {}
    booths.forEach(b => {
      const station = b.pollingStation || 'Unknown Station'
      if (!map[station]) map[station] = []
      map[station].push(b)
    })
    // Sort booths within each station by boothNo
    Object.values(map).forEach(arr => arr.sort((a, b) => Number(a.boothNo) - Number(b.boothNo)))
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [booths])

  const filtered = useMemo(() => {
    if (!search) return grouped
    const q = search.toLowerCase()
    return grouped
      .map(([station, bs]) => [
        station,
        bs.filter(b =>
          String(b.boothNo).includes(q) ||
          station.toLowerCase().includes(q) ||
          (agentByBooth[b.boothNo]?.name || '').toLowerCase().includes(q)
        )
      ])
      .filter(([, bs]) => bs.length > 0)
  }, [grouped, search, agentByBooth])

  // Summary stats
  const totalBooths = booths.length
  const responded = booths.filter(b => (boothResponseCounts[String(b.boothNo)] || 0) > 0).length
  const highRate  = booths.filter(b => {
    const r = b.voterCount ? (boothResponseCounts[String(b.boothNo)] || 0) / b.voterCount * 100 : 0
    return r >= 70
  }).length
  const lowRate = booths.filter(b => {
    const r = b.voterCount ? (boothResponseCounts[String(b.boothNo)] || 0) / b.voterCount * 100 : 0
    return r > 0 && r < 40
  }).length

  return (
    <div>
      {/* Legend + search bar */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: '≥70%  Strong', bg: '#ECFDF5', border: '#6EE7B7', text: '#059669' },
            { label: '40–70%  Mid',  bg: '#FFFBEB', border: '#FCD34D', text: '#D97706' },
            { label: '<40%  Low',    bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626' },
            { label: 'No data',      bg: '#F8FAFC', border: '#E2E8F0', text: '#94A3B8' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md border-2" style={{ background: l.bg, borderColor: l.border }} />
              <span className="text-[11px] font-medium" style={{ color: l.text }}>{l.label}</span>
            </div>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter booths or stations..."
            className="pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5CEB]/20 focus:border-[#5B5CEB]/50 transition-all w-56"
          />
        </div>
      </div>

      {/* Mini stat row */}
      <div className="flex gap-4 mb-5">
        {[
          { label: 'Total Booths',  value: totalBooths, color: '#5B5CEB' },
          { label: 'Active Booths', value: responded,   color: '#059669' },
          { label: 'Strong (≥70%)', value: highRate,    color: '#10B981' },
          { label: 'Low (<40%)',    value: lowRate,      color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-2.5 flex items-center gap-3"
            style={{ boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <span className="text-[20px] font-extrabold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[11px] text-slate-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Grouped grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] py-16 flex flex-col items-center gap-2">
          <MapPin size={28} className="text-slate-200" />
          <p className="text-slate-400 text-[13px]">No booths match your search</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map(([station, stationBooths]) => {
            const stationResponses = stationBooths.reduce((sum, b) =>
              sum + (boothResponseCounts[String(b.boothNo)] || 0), 0)
            const stationVoters = stationBooths.reduce((sum, b) => sum + (b.voterCount || 0), 0)
            const stationRate = stationVoters ? Math.round(stationResponses / stationVoters * 100) : 0
            const src = rateColor(stationRate)

            return (
              <div key={station} className="bg-white rounded-2xl border border-[#E2E8F0] p-5"
                style={{ boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <MapPin size={14} className="text-slate-400" />
                    <h4 className="text-slate-800 font-bold text-[14px]">{station}</h4>
                    <span className="text-[11px] text-slate-400">{stationBooths.length} booths</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {stationResponses}/{stationVoters.toLocaleString()} voters
                    </span>
                    <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-lg"
                      style={{ color: src.text, background: src.bg, border: `1px solid ${src.border}` }}>
                      {stationRate}% avg
                    </span>
                  </div>
                </div>
                <div className="grid gap-2.5" style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))'
                }}>
                  {stationBooths.map(b => (
                    <BoothTile
                      key={b.boothNo}
                      booth={b}
                      agent={agentByBooth[b.boothNo]}
                      responseCount={boothResponseCounts[String(b.boothNo)] || 0}
                      onClick={onBoothClick}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Empty States ──────────────────────────────────────────────────────────────

function NoStationSelected() {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-[#E8ECF4] flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
        <Building2 size={28} className="text-indigo-300" />
      </div>
      <h3 className="text-slate-700 font-semibold text-base mb-1">Select a Polling Station</h3>
      <p className="text-slate-400 text-[13px]">Choose a polling station from the left to view its booths.</p>
    </div>
  )
}

function NoBoothsFound() {
  return (
    <tr>
      <td colSpan={7} className="py-16 text-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
            <MapPin size={22} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-medium text-[13px]">No booths found</p>
          <p className="text-slate-400 text-[12px] mt-1">Import a voter CSV to populate booth data.</p>
        </div>
      </td>
    </tr>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function Booths() {
  const navigate = useNavigate()
  const [booths,              setBooths]             = useState([])
  const [agents,              setAgents]             = useState([])
  const [boothResponseCounts, setBoothResponseCounts] = useState({})
  const [loading,             setLoading]            = useState(true)
  const [viewMode,            setViewMode]           = useState('heatmap') // 'heatmap' | 'table'

  const [selectedStation, setSelectedStation] = useState(null)
  const [selectedBooth,   setSelectedBooth]   = useState(null)
  const [stationSearch,   setStationSearch]   = useState('')
  const [boothSearch,     setBoothSearch]     = useState('')
  const [statusFilter,    setStatusFilter]    = useState('All')
  const [page,            setPage]            = useState(1)

  useEffect(() => {
    async function load() {
      const [boothData, responsesRes] = await Promise.all([
        fetchAllBooths(),
        supabase.from('responses').select('data').order('inserted_at', { ascending: true }),
      ])
      setBooths(boothData)

      // Build boothNo → count map from responses
      const counts = {}
      ;(responsesRes.data || []).forEach(r => {
        const bn = String(r.data?.boothNo || '')
        if (bn) counts[bn] = (counts[bn] || 0) + 1
      })
      setBoothResponseCounts(counts)
      setLoading(false)
    }
    load()

    const unsub = subscribeAgents(data => setAgents(data))

    // Live response updates
    const channel = supabase.channel('booths_responses_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, async () => {
        const { data } = await supabase.from('responses').select('data')
        const counts = {}
        ;(data || []).forEach(r => {
          const bn = String(r.data?.boothNo || '')
          if (bn) counts[bn] = (counts[bn] || 0) + 1
        })
        setBoothResponseCounts(counts)
      })
      .subscribe()

    return () => { unsub(); supabase.removeChannel(channel) }
  }, [])

  // ── Agent lookup by boothNo ────
  const agentByBooth = useMemo(() => {
    const map = {}
    agents.forEach(a => {
      if (a.boothId) map[String(a.boothId)] = a
    })
    return map
  }, [agents])

  // ── Derive stations from booths ────
  const allStations = useMemo(() => {
    const map = {}
    booths.forEach(b => {
      if (!b.pollingStation) return
      if (!map[b.pollingStation]) {
        map[b.pollingStation] = { name: b.pollingStation, boothCount: 0, voterCount: 0 }
      }
      map[b.pollingStation].boothCount++
      map[b.pollingStation].voterCount += b.voterCount || 0
    })
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
  }, [booths])

  const totalBooths     = booths.length
  const totalStations   = allStations.length
  const assignedCount   = booths.filter(b => agentByBooth[b.boothNo]).length
  const unassignedCount = totalBooths - assignedCount

  const filteredStations = useMemo(() =>
    allStations.filter(s => s.name.toLowerCase().includes(stationSearch.toLowerCase()))
  , [allStations, stationSearch])

  const stationBooths = useMemo(() =>
    selectedStation
      ? booths.filter(b => b.pollingStation === selectedStation.name)
              .sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
      : []
  , [booths, selectedStation])

  const filteredBooths = useMemo(() => {
    let list = stationBooths
    if (boothSearch) {
      const q = boothSearch.toLowerCase()
      list = list.filter(b =>
        String(b.boothNo).includes(q) ||
        (agentByBooth[b.boothNo]?.name ?? '').toLowerCase().includes(q)
      )
    }
    if (statusFilter === 'Active')  list = list.filter(b => agentByBooth[b.boothNo])
    if (statusFilter === 'Pending') list = list.filter(b => !agentByBooth[b.boothNo])
    return list
  }, [stationBooths, boothSearch, statusFilter, agentByBooth])

  const totalPages      = Math.max(1, Math.ceil(filteredBooths.length / PAGE_SIZE))
  const paginatedBooths = filteredBooths.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleStationSelect = station => {
    setSelectedStation(station)
    setPage(1)
    setBoothSearch('')
    setStatusFilter('All')
    setSelectedBooth(null)
  }

  const summaryCards = [
    { label: 'Total Booths',         value: totalBooths,     icon: MapPin,      color: '#5B5CEB', bg: '#EEF2FF' },
    { label: 'Polling Stations',      value: totalStations,   icon: Building2,   color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Assigned Booth Agents', value: assignedCount,   icon: UserCheck,   color: '#10B981', bg: '#ECFDF5' },
    { label: 'Unassigned Booths',     value: unassignedCount, icon: AlertCircle, color: '#F59E0B', bg: '#FFFBEB' },
  ]

  if (loading) {
    return (
      <div className="-m-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)', background: '#F0F3FA' }}>
        <div className="text-center">
          <Loader2 size={36} className="animate-spin mx-auto mb-4" style={{ color: '#5B5CEB' }} />
          <p className="text-slate-700 font-semibold text-[15px]">Loading booth data…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6">

      {/* ── Action Bar ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white border-b border-[#E8ECF4]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-slate-800 font-bold text-xl">Booths</h2>
            <p className="text-slate-400 text-[13px] mt-0.5">Manage polling stations and booths</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
              <button onClick={() => setViewMode('heatmap')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={viewMode === 'heatmap'
                  ? { background: '#fff', color: '#5B5CEB', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }
                  : { color: '#94A3B8' }}>
                <LayoutGrid size={13} /> Heat Map
              </button>
              <button onClick={() => setViewMode('table')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={viewMode === 'table'
                  ? { background: '#fff', color: '#5B5CEB', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }
                  : { color: '#94A3B8' }}>
                <Table2 size={13} /> Table
              </button>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-[#E8ECF4] rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {viewMode === 'table' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={boothSearch}
                onChange={e => { setBoothSearch(e.target.value); setPage(1) }}
                placeholder="Search booth number or agent name..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5CEB]/20 focus:border-[#5B5CEB]/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-1">
              {['All', 'Active', 'Pending'].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                  style={statusFilter === s
                    ? { background: '#5B5CEB', color: '#fff' }
                    : { background: '#F8FAFC', color: '#64748B' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 bg-[#F0F3FA] pt-5 pb-6">

        {/* ── Summary Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
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

        {/* ── Heat Map View ────────────────────────────────────────────────── */}
        {viewMode === 'heatmap' && (
          booths.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] py-20 flex flex-col items-center gap-3">
              <MapPin size={32} className="text-slate-200" />
              <p className="text-slate-500 font-medium text-[14px]">No booth data yet</p>
              <p className="text-slate-300 text-[12px]">Import a voter CSV first.</p>
              <button onClick={() => navigate('/voters')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-opacity mt-1"
                style={{ background: '#5B5CEB' }}>
                <Upload size={12} /> Go to Voters
              </button>
            </div>
          ) : (
            <HeatMap
              booths={booths}
              agents={agents}
              agentByBooth={agentByBooth}
              boothResponseCounts={boothResponseCounts}
              onBoothClick={b => {
                setSelectedBooth(b)
                setSelectedStation(allStations.find(s => s.name === b.pollingStation) || null)
              }}
            />
          )
        )}

        {/* ── Table View ───────────────────────────────────────────────────── */}
        {viewMode === 'table' && (
          <div className="flex gap-5" style={{ minHeight: 560 }}>

            {/* Left: Station List */}
            <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-[#E8ECF4] flex flex-col overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="p-4 border-b border-[#E8ECF4]">
                <h3 className="text-slate-800 font-semibold text-[13px] mb-3">Polling Stations</h3>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={stationSearch}
                    onChange={e => setStationSearch(e.target.value)}
                    placeholder="Search polling station..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5CEB]/20 focus:border-[#5B5CEB]/50 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {booths.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <MapPin size={24} className="text-slate-200 mb-2" />
                    <p className="text-slate-500 text-[12px] font-medium">No booth data yet.</p>
                    <p className="text-slate-300 text-[11px] mt-1 mb-3">Import a voter CSV first.</p>
                    <button onClick={() => navigate('/voters')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 transition-opacity"
                      style={{ background: '#5B5CEB' }}>
                      <Upload size={11} /> Go to Voters
                    </button>
                  </div>
                ) : filteredStations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <MapPin size={24} className="text-slate-200 mb-2" />
                    <p className="text-slate-400 text-[12px]">No stations found</p>
                  </div>
                ) : (
                  filteredStations.map((station, idx) => {
                    const isActive = selectedStation?.name === station.name
                    // Station response rate
                    const stBoohs = booths.filter(b => b.pollingStation === station.name)
                    const stResp = stBoohs.reduce((s, b) => s + (boothResponseCounts[String(b.boothNo)] || 0), 0)
                    const stVoters = stBoohs.reduce((s, b) => s + (b.voterCount || 0), 0)
                    const stRate = stVoters ? Math.round(stResp / stVoters * 100) : 0
                    const src = rateColor(stRate)
                    return (
                      <button key={station.name} onClick={() => handleStationSelect(station)}
                        className="w-full text-left px-4 py-3.5 transition-all"
                        style={{
                          background: isActive ? '#EEF2FF' : 'transparent',
                          borderLeft: isActive ? '3px solid #5B5CEB' : '3px solid transparent',
                          borderBottom: idx < filteredStations.length - 1 ? '1px solid #F1F5F9' : 'none',
                        }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color: isActive ? '#5B5CEB' : '#94A3B8' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold leading-snug truncate"
                                style={{ color: isActive ? '#5B5CEB' : '#334155' }}>
                                {station.name}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-slate-400">{station.boothCount} Booths</span>
                                <span className="text-[10px] text-slate-400">{station.voterCount.toLocaleString()} Voters</span>
                              </div>
                            </div>
                          </div>
                          {stRate > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                              style={{ color: src.text, background: src.bg }}>
                              {stRate}%
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right: Booth Table */}
            {!selectedStation ? <NoStationSelected /> : (
              <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white rounded-2xl border border-[#E8ECF4] p-5 mb-4 flex items-center justify-between"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div>
                    <h3 className="text-slate-800 font-bold text-[15px] mb-1">{selectedStation.name}</h3>
                    <div className="flex items-center gap-4 text-[12px] text-slate-400">
                      <span className="flex items-center gap-1.5"><Building2 size={12} />{selectedStation.boothCount} Booths</span>
                      <span className="flex items-center gap-1.5"><Users size={12} />{selectedStation.voterCount.toLocaleString()} Voters</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8ECF4] flex-1 flex flex-col overflow-hidden"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div className="px-5 py-3.5 border-b border-[#E8ECF4]">
                    <p className="text-slate-600 text-[12px] font-medium">
                      Booths in this station
                      <span className="ml-2 text-slate-400">({filteredBooths.length})</span>
                    </p>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E8ECF4' }}>
                          {['Booth No', 'Total Voters', 'Responses', 'Rate', 'Assigned Agent', 'Phone', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {paginatedBooths.length === 0
                          ? <NoBoothsFound />
                          : paginatedBooths.map(booth => {
                            const agent = agentByBooth[booth.boothNo]
                            const rc = boothResponseCounts[String(booth.boothNo)] || 0
                            const rate = booth.voterCount ? Math.min(100, Math.round(rc / booth.voterCount * 100)) : 0
                            const rcc = rateColor(rate)
                            return (
                              <tr key={booth.boothNo} onClick={() => setSelectedBooth(booth)}
                                className="hover:bg-indigo-50/30 cursor-pointer transition-colors">
                                <td className="px-4 py-3.5">
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold"
                                    style={{ background: '#EEF2FF', color: '#5B5CEB' }}>
                                    {booth.boothNo}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-slate-600 text-[12px]">{(booth.voterCount || 0).toLocaleString()}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-slate-700 text-[12px] font-semibold">{rc}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${rate}%`, background: rcc.fill }} />
                                    </div>
                                    <span className="text-[11px] font-bold" style={{ color: rcc.text }}>{rate}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <AgentCell agent={agent} />
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-slate-400 text-[12px]">{agent?.mobile || '—'}</span>
                                </td>
                                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => setSelectedBooth(booth)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#5B5CEB] hover:bg-indigo-50 transition-colors">
                                      <Eye size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        }
                      </tbody>
                    </table>
                  </div>

                  {filteredBooths.length > PAGE_SIZE && (
                    <div className="px-5 py-3.5 border-t border-[#E8ECF4] flex items-center justify-between">
                      <p className="text-[12px] text-slate-400">
                        Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredBooths.length)}–{Math.min(page * PAGE_SIZE, filteredBooths.length)} of {filteredBooths.length} booths
                      </p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <button key={p} onClick={() => setPage(p)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-medium transition-all"
                            style={page === p
                              ? { background: '#5B5CEB', color: '#fff' }
                              : { border: '1px solid #E8ECF4', color: '#64748B' }}>
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
            )}
          </div>
        )}
      </div>

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      {selectedBooth && (
        <BoothDrawer
          booth={selectedBooth}
          agent={agentByBooth[selectedBooth.boothNo]}
          stationName={selectedStation?.name}
          responseCount={boothResponseCounts[String(selectedBooth.boothNo)] || 0}
          onClose={() => setSelectedBooth(null)}
        />
      )}
    </div>
  )
}
