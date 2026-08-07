import { useState, useMemo, useEffect } from 'react'
import {
  Search, Plus, Upload, Download, MapPin, Users, UserCheck,
  AlertCircle, Eye, Edit2, Trash2, X, ChevronDown,
  Building2, Phone, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react'
import { fetchAllBooths } from '../firebase/voterService'
import { subscribeAgents } from '../firebase/agentService'

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

// ── Booth Drawer ──────────────────────────────────────────────────────────────

function BoothDrawer({ booth, agent, stationName, onClose }) {
  const fields = [
    { label: 'Booth Number',    value: `#${booth.boothNo}` },
    { label: 'Polling Station', value: stationName },
    { label: 'Total Voters',    value: (booth.voterCount || 0).toLocaleString() },
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

        <div className="px-5 py-3 border-b border-[#E8ECF4] flex items-center justify-between">
          <span className="text-[12px] text-slate-500">Status</span>
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

const PAGE_SIZE  = 10
const CACHE_KEY  = 'cast_booths_cache'

function readBoothCache() {
  try { const v = localStorage.getItem(CACHE_KEY); return v ? JSON.parse(v) : null } catch { return null }
}
function writeBoothCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

export default function Booths() {
  const [booths,   setBooths]   = useState(() => readBoothCache() ?? [])
  const [agents,   setAgents]   = useState([])
  const [loading,  setLoading]  = useState(() => !readBoothCache())

  const [selectedStation, setSelectedStation] = useState(null)
  const [selectedBooth,   setSelectedBooth]   = useState(null)
  const [stationSearch,   setStationSearch]   = useState('')
  const [boothSearch,     setBoothSearch]     = useState('')
  const [statusFilter,    setStatusFilter]    = useState('All')
  const [page,            setPage]            = useState(1)

  // ── Load booths: serve cache instantly, refresh from Firestore in background ─
  useEffect(() => {
    fetchAllBooths()
      .then(data => { setBooths(data); writeBoothCache(data); setLoading(false) })
      .catch(() => setLoading(false))

    const unsub = subscribeAgents(data => setAgents(data))
    return unsub
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

  // ── Stats ────
  const totalBooths      = booths.length
  const totalStations    = allStations.length
  const assignedCount    = booths.filter(b => agentByBooth[b.boothNo]).length
  const unassignedCount  = totalBooths - assignedCount

  // ── Filter stations list ────
  const filteredStations = useMemo(() =>
    allStations.filter(s => s.name.toLowerCase().includes(stationSearch.toLowerCase()))
  , [allStations, stationSearch])

  // ── Booths for selected station ────
  const stationBooths = useMemo(() =>
    selectedStation
      ? booths.filter(b => b.pollingStation === selectedStation.name)
              .sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
      : []
  , [booths, selectedStation])

  // ── Filter booths ────
  const filteredBooths = useMemo(() => {
    let list = stationBooths
    if (boothSearch) {
      const q = boothSearch.toLowerCase()
      list = list.filter(b =>
        String(b.boothNo).includes(q) ||
        (agentByBooth[b.boothNo]?.name ?? '').toLowerCase().includes(q)
      )
    }
    if (statusFilter === 'Active')   list = list.filter(b => agentByBooth[b.boothNo])
    if (statusFilter === 'Pending')  list = list.filter(b => !agentByBooth[b.boothNo])
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
    { label: 'Total Booths',          value: totalBooths,     icon: MapPin,      color: '#5B5CEB', bg: '#EEF2FF' },
    { label: 'Polling Stations',       value: totalStations,   icon: Building2,   color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Assigned Booth Agents',  value: assignedCount,   icon: UserCheck,   color: '#10B981', bg: '#ECFDF5' },
    { label: 'Unassigned Booths',      value: unassignedCount, icon: AlertCircle, color: '#F59E0B', bg: '#FFFBEB' },
  ]

  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="-m-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)', background: '#F5F7FB' }}>
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
            <button className="flex items-center gap-2 px-3 py-2 border border-[#E8ECF4] rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={14} /> Export
            </button>
          </div>
        </div>
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
      </div>

      <div className="px-6 bg-[#F5F7FB] pt-5">

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

        {/* ── Two Column Layout ─────────────────────────────────────────────── */}
        <div className="flex gap-5 pb-6" style={{ minHeight: 560 }}>

          {/* ── Left: Station List ───────────────────────────────────────── */}
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
                  <p className="text-slate-400 text-[12px]">No booth data yet.</p>
                  <p className="text-slate-300 text-[11px] mt-1">Import a voter CSV first.</p>
                </div>
              ) : filteredStations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MapPin size={24} className="text-slate-200 mb-2" />
                  <p className="text-slate-400 text-[12px]">No stations found</p>
                </div>
              ) : (
                filteredStations.map((station, idx) => {
                  const isActive = selectedStation?.name === station.name
                  return (
                    <button key={station.name} onClick={() => handleStationSelect(station)}
                      className="w-full text-left px-4 py-3.5 transition-all"
                      style={{
                        background: isActive ? '#EEF2FF' : 'transparent',
                        borderLeft: isActive ? '3px solid #5B5CEB' : '3px solid transparent',
                        borderBottom: idx < filteredStations.length - 1 ? '1px solid #F1F5F9' : 'none',
                      }}>
                      <div className="flex items-start gap-2.5">
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
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Right: Booth Table ────────────────────────────────────────── */}
          {!selectedStation ? <NoStationSelected /> : (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Station Header */}
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

              {/* Table */}
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
                        {['Booth No', 'Total Voters', 'Assigned Agent', 'Phone', 'Status', 'Actions'].map(h => (
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
                                <AgentCell agent={agent} />
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-slate-400 text-[12px]">{agent?.mobile || '—'}</span>
                              </td>
                              <td className="px-4 py-3.5">
                                <StatusBadge status={agent ? 'Active' : 'Pending'} />
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
      </div>

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      {selectedBooth && (
        <BoothDrawer
          booth={selectedBooth}
          agent={agentByBooth[selectedBooth.boothNo]}
          stationName={selectedStation?.name}
          onClose={() => setSelectedBooth(null)}
        />
      )}
    </div>
  )
}
