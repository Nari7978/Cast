import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, User } from 'lucide-react'

function RateBar({ rate, color }) {
  const bg = rate >= 70 ? '#ECFDF5'
           : rate >= 40 ? '#FFFBEB'
           : '#FEF2F2'
  const fill = rate >= 70 ? '#059669'
             : rate >= 40 ? '#D97706'
             : '#EF4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, rate)}%`, background: fill }} />
      </div>
      <span className="text-[11px] font-bold w-9 text-right tabular-nums" style={{ color: fill }}>
        {rate}%
      </span>
    </div>
  )
}

function BoothLeaderboard({ stats }) {
  const boothStats = (stats?.boothStats || []).slice(0, 8)
  const hasData = boothStats.length > 0

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-slate-900 font-bold text-[15px]">Booth Leaderboard</h3>
          <p className="text-slate-400 text-[11px] mt-0.5">Response rate per booth</p>
        </div>
        <Link to="/booths"
          className="flex items-center gap-1 text-[11px] font-semibold text-[#5B5CEB] hover:gap-2 transition-all no-underline">
          All booths <ArrowRight size={11} />
        </Link>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <MapPin size={24} className="text-slate-200" />
          <p className="text-slate-300 text-[12px]">No booth data yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 pb-2 border-b border-slate-50">
            <span className="col-span-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">#</span>
            <span className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Booth</span>
            <span className="col-span-4 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Station</span>
            <span className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300 text-right">Resp.</span>
            <span className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300">Rate</span>
          </div>
          {boothStats.map((b, i) => {
            const medalColor = i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7C4F' : '#E2E8F0'
            const medalText  = i === 0 ? '#92400E' : i === 1 ? '#475569' : i === 2 ? '#7C2D12' : '#94A3B8'
            return (
              <div key={b.boothNo} className="grid grid-cols-12 gap-2 items-center py-2.5 hover:bg-slate-50/60 rounded-lg px-1 transition-colors">
                <div className="col-span-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold"
                    style={{ background: medalColor, color: medalText }}>
                    {i + 1}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] font-bold text-[#5B5CEB] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md">
                    {b.boothNo}
                  </span>
                </div>
                <div className="col-span-4">
                  <p className="text-slate-600 text-[12px] truncate">{b.pollingStation || '—'}</p>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-[12px] font-bold text-slate-800 tabular-nums">{b.responseCount}</span>
                  <span className="text-[10px] text-slate-400 ml-0.5">/{b.voterCount}</span>
                </div>
                <div className="col-span-3">
                  <RateBar rate={b.rate} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AgentLeaderboard({ stats }) {
  const agentStats = (stats?.agentStats || []).slice(0, 6)
  const hasData = agentStats.length > 0
  const maxCount = agentStats[0]?.responseCount || 1

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-slate-900 font-bold text-[15px]">Agent Performance</h3>
          <p className="text-slate-400 text-[11px] mt-0.5">Responses collected per agent</p>
        </div>
        <Link to="/booth-agents"
          className="flex items-center gap-1 text-[11px] font-semibold text-[#5B5CEB] hover:gap-2 transition-all no-underline">
          All agents <ArrowRight size={11} />
        </Link>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <User size={24} className="text-slate-200" />
          <p className="text-slate-300 text-[12px]">No agents yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agentStats.map((a, i) => {
            const barPct = maxCount ? Math.round(a.responseCount / maxCount * 100) : 0
            const initials = (a.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            const hues = ['#5B5CEB','#059669','#D97706','#EC4899','#8B5CF6','#06B6D4']
            const hue = hues[i % hues.length]
            return (
              <div key={i} className="group">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: hue }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-slate-700 truncate">{a.name}</p>
                      <span className="text-[12px] font-bold text-slate-900 tabular-nums ml-2">{a.responseCount}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400">Booth {a.boothNo}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        a.status === 'Active' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                      }`}>{a.status}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden ml-10">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barPct}%`, background: hue }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TablesRow2({ stats }) {
  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-7"><BoothLeaderboard stats={stats} /></div>
      <div className="col-span-5"><AgentLeaderboard stats={stats} /></div>
    </div>
  )
}
