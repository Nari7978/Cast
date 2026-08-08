import { ArrowRight } from 'lucide-react'

function RankBadge({ rank, color = '#5B5CEB' }) {
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
      style={{ background: color }}>
      {rank}
    </div>
  )
}

function CompletionBar({ value, color = '#5B5CEB' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold text-slate-700 w-8 text-right">{value}%</span>
    </div>
  )
}

function Card({ title, subtitle, children, link }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8ECF4] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-slate-800 font-semibold text-[13px]">{title}</h3>
          {subtitle && <p className="text-slate-400 text-[11px] mt-0.5">{subtitle}</p>}
        </div>
        {link && (
          <button className="flex items-center gap-1 text-[11px] font-semibold text-[#5B5CEB] hover:gap-2 transition-all">
            View all <ArrowRight size={11} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function TopBoothsTable({ stats }) {
  const booths = [...(stats?.booths || [])]
    .sort((a, b) => (b.voterCount || 0) - (a.voterCount || 0))
    .slice(0, 5)

  return (
    <Card title="Top 5 Booths" subtitle="By voter count" link>
      {booths.length === 0 ? (
        <p className="text-slate-300 text-[12px] text-center py-6">No booth data yet</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              {['#', 'Booth', 'Station', 'Voters'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-2.5 pr-2 first:pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {booths.map((b, i) => (
              <tr key={b.boothNo} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 pr-3">
                  <RankBadge rank={i + 1} color={['#5B5CEB','#10B981','#F59E0B','#94A3B8','#94A3B8'][i]} />
                </td>
                <td className="py-2.5 pr-2">
                  <span className="text-[12px] font-bold text-[#5B5CEB] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md">
                    {b.boothNo}
                  </span>
                </td>
                <td className="py-2.5 pr-2">
                  <p className="text-slate-600 text-[12px] truncate max-w-[120px]">{b.pollingStation || '—'}</p>
                </td>
                <td className="py-2.5">
                  <span className="text-[12px] font-semibold text-slate-700">{(b.voterCount || 0).toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function TopAgentsTable({ stats }) {
  const agents = (stats?.agents || []).slice(0, 5)

  return (
    <Card title="Top 5 Booth Agents" subtitle="By name · All phases" link>
      {agents.length === 0 ? (
        <p className="text-slate-300 text-[12px] text-center py-6">No agents added yet</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              {['#', 'Agent', 'Status', 'Phase'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-2.5 pr-2 first:pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {agents.map((a, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 pr-3">
                  <RankBadge rank={i + 1} color={['#5B5CEB','#10B981','#F59E0B','#94A3B8','#94A3B8'][i]} />
                </td>
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                      {(a.name || '?')[0].toUpperCase()}
                    </div>
                    <p className="text-slate-700 text-[12px] font-medium">{a.name || '—'}</p>
                  </div>
                </td>
                <td className="py-2.5 pr-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    a.status === 'Active' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                  }`}>{a.status || 'Unknown'}</span>
                </td>
                <td className="py-2.5">
                  <span className="text-[12px] text-slate-500">{a.phase || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function AssignmentsTable({ stats }) {
  const assignments = (stats?.assignments || []).slice(0, 5)

  return (
    <Card title="Recent Assignments" subtitle="Latest created" link>
      {assignments.length === 0 ? (
        <p className="text-slate-300 text-[12px] text-center py-6">No assignments yet</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              {['#', 'Name', 'Booths', 'Status'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-2.5 pr-2 first:pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {assignments.map((a, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 pr-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 text-[10px] font-bold">
                    {i + 1}
                  </div>
                </td>
                <td className="py-2.5 pr-2">
                  <p className="text-slate-700 text-[12px] font-medium truncate max-w-[120px]">{a.name || '—'}</p>
                </td>
                <td className="py-2.5 pr-2">
                  <span className="text-[12px] font-semibold text-slate-700">{a.boothCount || 0}</span>
                </td>
                <td className="py-2.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    a.status === 'Active' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                  }`}>{a.status || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

export default function TablesRow2({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-5">
      <TopBoothsTable stats={stats} />
      <TopAgentsTable stats={stats} />
      <AssignmentsTable stats={stats} />
    </div>
  )
}
