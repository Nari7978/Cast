import { ArrowRight } from 'lucide-react'

const topBooths = [
  { rank: 1, name: 'Booth 42 – Rishikesh',  coverage: 98, responses: 1842, completion: 98 },
  { rank: 2, name: 'Booth 17 – Haridwar',    coverage: 95, responses: 1654, completion: 95 },
  { rank: 3, name: 'Booth 89 – Dehradun',    coverage: 92, responses: 1432, completion: 92 },
  { rank: 4, name: 'Booth 23 – Roorkee',     coverage: 89, responses: 1287, completion: 89 },
  { rank: 5, name: 'Booth 61 – Mussoorie',   coverage: 87, responses: 1124, completion: 87 },
]

const topAgents = [
  { rank: 1, name: 'Rajesh Kumar',  booths: 8, responses: 2840, completion: 96 },
  { rank: 2, name: 'Priya Sharma',  booths: 6, responses: 2320, completion: 94 },
  { rank: 3, name: 'Amit Singh',    booths: 7, responses: 2180, completion: 91 },
  { rank: 4, name: 'Sunita Devi',   booths: 5, responses: 1920, completion: 89 },
  { rank: 5, name: 'Vikram Patel',  booths: 6, responses: 1840, completion: 87 },
]

const lowestBooths = [
  { rank: 1, name: 'Booth 112 – Tehri',       responses: 124, coverage: 12, completion: 12, last: '3d ago' },
  { rank: 2, name: 'Booth 78 – Uttarkashi',   responses: 198, coverage: 18, completion: 18, last: '2d ago' },
  { rank: 3, name: 'Booth 34 – Chamoli',      responses: 241, coverage: 23, completion: 23, last: '1d ago' },
  { rank: 4, name: 'Booth 95 – Pithoragarh',  responses: 287, coverage: 27, completion: 27, last: '4d ago' },
  { rank: 5, name: 'Booth 156 – Bageshwar',   responses: 312, coverage: 29, completion: 29, last: '5d ago' },
]

function RankBadge({ rank }) {
  const colors = ['#5B5CEB', '#10B981', '#F59E0B', '#94A3B8', '#94A3B8']
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
      style={{ background: colors[rank - 1] }}>
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

function TopBoothsTable() {
  return (
    <Card title="Top 5 Performing Booths" subtitle="By completion rate · Phase 2" link>
      <table className="w-full">
        <thead>
          <tr>
            {['#', 'Booth', 'Coverage', 'Responses', 'Completion'].map(h => (
              <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-2.5 pr-2 first:pr-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {topBooths.map(row => (
            <tr key={row.rank} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-2.5 pr-3"><RankBadge rank={row.rank} /></td>
              <td className="py-2.5 pr-2">
                <p className="text-slate-700 text-[12px] font-medium leading-tight">{row.name}</p>
              </td>
              <td className="py-2.5 pr-2">
                <span className="text-[12px] font-semibold text-slate-700">{row.coverage}%</span>
              </td>
              <td className="py-2.5 pr-2">
                <span className="text-[12px] text-slate-600">{row.responses.toLocaleString()}</span>
              </td>
              <td className="py-2.5 w-28">
                <CompletionBar value={row.completion} color="#10B981" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function TopAgentsTable() {
  return (
    <Card title="Top 5 Booth Agents" subtitle="By response count · Phase 2" link>
      <table className="w-full">
        <thead>
          <tr>
            {['#', 'Agent', 'Booths', 'Responses', 'Completion'].map(h => (
              <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-2.5 pr-2 first:pr-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {topAgents.map(row => (
            <tr key={row.rank} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-2.5 pr-3"><RankBadge rank={row.rank} /></td>
              <td className="py-2.5 pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                    {row.name[0]}
                  </div>
                  <p className="text-slate-700 text-[12px] font-medium">{row.name}</p>
                </div>
              </td>
              <td className="py-2.5 pr-2">
                <span className="text-[12px] font-semibold text-slate-700">{row.booths}</span>
              </td>
              <td className="py-2.5 pr-2">
                <span className="text-[12px] text-slate-600">{row.responses.toLocaleString()}</span>
              </td>
              <td className="py-2.5 w-28">
                <CompletionBar value={row.completion} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function LowestBoothsTable() {
  return (
    <Card title="Lowest Performing Booths" subtitle="Needs immediate attention" link>
      <table className="w-full">
        <thead>
          <tr>
            {['#', 'Booth', 'Responses', 'Coverage', 'Completion', 'Last Active'].map(h => (
              <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-2.5 pr-2 first:pr-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {lowestBooths.map((row, i) => (
            <tr key={row.rank} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-2.5 pr-3">
                <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-400 text-[10px] font-bold">
                  {row.rank}
                </div>
              </td>
              <td className="py-2.5 pr-2">
                <p className="text-slate-700 text-[12px] font-medium leading-tight">{row.name}</p>
              </td>
              <td className="py-2.5 pr-2">
                <span className="text-[12px] text-slate-600">{row.responses}</span>
              </td>
              <td className="py-2.5 pr-2">
                <span className="text-[12px] font-semibold text-red-500">{row.coverage}%</span>
              </td>
              <td className="py-2.5 pr-2 w-24">
                <CompletionBar value={row.completion} color="#EF4444" />
              </td>
              <td className="py-2.5">
                <span className="text-[11px] text-slate-400">{row.last}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export default function TablesRow2() {
  return (
    <div className="grid grid-cols-3 gap-5">
      <TopBoothsTable />
      <TopAgentsTable />
      <LowestBoothsTable />
    </div>
  )
}
