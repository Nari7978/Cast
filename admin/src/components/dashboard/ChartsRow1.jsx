import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { ArrowRight } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function buildTrend(responses) {
  if (!responses || responses.length === 0) return []
  const counts = {}
  responses.forEach(r => {
    const d = new Date(r.submittedAt || r.inserted_at)
    if (isNaN(d)) return
    const key = `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]}`
    counts[key] = (counts[key] || 0) + 1
  })
  return Object.entries(counts)
    .sort((a, b) => {
      const parse = s => { const [day, mon] = s.split(' '); return MONTHS.indexOf(mon) * 31 + parseInt(day) }
      return parse(a[0]) - parse(b[0])
    })
    .map(([date, count]) => ({ date, responses: count }))
}

function Card({ title, subtitle, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8ECF4] p-5 h-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-slate-800 font-semibold text-[13px]">{title}</h3>
          {subtitle && <p className="text-slate-400 text-[11px] mt-0.5">{subtitle}</p>}
        </div>
        {action && (
          <button className="flex items-center gap-1 text-[11px] font-semibold text-[#5B5CEB] hover:gap-2 transition-all">
            {action} <ArrowRight size={11} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function CampaignProgress({ stats }) {
  const phase        = stats?.latestPhase
  const total        = phase?.booths        || 0
  const completed    = phase?.completedBooths  || 0
  const inProgress   = phase?.pendingBooths    || 0
  const remaining    = Math.max(0, total - completed - inProgress)
  const pct          = total ? Math.round((completed / total) * 100) : 0

  const bars = [
    { label: 'Assigned',    value: total,       pct: 100,                              color: '#5B5CEB', bg: '#EEF2FF' },
    { label: 'Completed',   value: completed,   pct: total ? Math.round(completed/total*100)  : 0, color: '#10B981', bg: '#ECFDF5' },
    { label: 'In Progress', value: inProgress,  pct: total ? Math.round(inProgress/total*100) : 0, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Remaining',   value: remaining,   pct: total ? Math.round(remaining/total*100)  : 0, color: '#94A3B8', bg: '#F8FAFC' },
  ]

  return (
    <Card title="Campaign Progress" subtitle={phase ? phase.name : 'No phase data'}>
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-500 text-[12px]">Overall Completion</span>
          <span className="font-bold text-lg" style={{ color: '#5B5CEB' }}>{pct}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #5B5CEB, #818CF8)' }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {bars.map(({ label, value, pct: p, color, bg }) => (
          <div key={label} className="rounded-xl p-3 border border-slate-100" style={{ background: bg }}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-slate-500 text-[11px]">{label}</span>
            </div>
            <p className="font-bold text-2xl text-slate-800">{value}</p>
            <p className="text-slate-400 text-[10px] mt-0.5">{p}% of total</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ResponseTrend({ stats }) {
  const trendData = buildTrend(stats?.responses)
  const hasData = trendData.length > 0

  return (
    <Card
      title="Response Trend"
      subtitle={hasData ? `${stats.responses.length} total responses` : 'No response data collected yet'}
      action="View All"
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={trendData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12 }}
              itemStyle={{ color: '#5B5CEB' }}
              labelStyle={{ color: '#1E293B', fontWeight: 600 }}
            />
            <Line
              type="monotone" dataKey="responses"
              stroke="#5B5CEB" strokeWidth={2.5}
              dot={{ fill: '#5B5CEB', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#5B5CEB' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[230px]">
          <p className="text-slate-300 text-[13px]">Responses will appear here once collected</p>
        </div>
      )}
    </Card>
  )
}

function BoothCoverage({ stats }) {
  const total     = stats?.totalBooths || 0
  const completed = stats?.latestPhase?.completedBooths || 0
  const inProgress = stats?.latestPhase?.pendingBooths || 0
  const notStarted = Math.max(0, total - completed - inProgress)
  const pct = total ? Math.round((completed / total) * 100) : 0

  const coverageData = [
    { name: 'Completed',   value: completed  || 1, color: '#5B5CEB' },
    { name: 'In Progress', value: inProgress || 0, color: '#F59E0B' },
    { name: 'Not Started', value: notStarted || 0, color: '#E2E8F0' },
  ]
  const displayTotal = total || 1

  return (
    <Card title="Booth Coverage" subtitle="Distribution by status">
      <div className="flex flex-col items-center">
        <div className="relative w-36 h-36">
          <PieChart width={144} height={144}>
            <Pie data={coverageData} cx={68} cy={68} innerRadius={44} outerRadius={64} dataKey="value" stroke="none">
              {coverageData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-bold text-xl text-slate-800">{pct}%</p>
            <p className="text-[10px] text-slate-400">covered</p>
          </div>
        </div>
        <div className="w-full space-y-2 mt-3">
          {coverageData.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-slate-500 text-[12px]">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-800 text-[12px] font-semibold">{value}</span>
                <span className="text-slate-400 text-[10px]">{Math.round(value / displayTotal * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function BoothHealth({ stats }) {
  const total    = stats?.totalAgents || 0
  const active   = stats?.activeAgents || 0
  const inactive = Math.max(0, total - active)
  const pct = total ? Math.round((active / total) * 100) : 0

  const healthData = [
    { name: 'Active',   value: active   || 1, color: '#10B981' },
    { name: 'Inactive', value: inactive || 0, color: '#EF4444' },
  ]

  return (
    <Card title="Agent Health" subtitle="Agent activity status">
      <div className="flex flex-col items-center">
        <div className="relative" style={{ height: 96 }}>
          <PieChart width={160} height={96}>
            <Pie data={healthData} cx={76} cy={88} startAngle={180} endAngle={0}
              innerRadius={44} outerRadius={66} dataKey="value" stroke="none">
              {healthData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-1">
            <p className="font-bold text-lg text-slate-800 leading-tight">{pct}%</p>
            <p className="text-[10px] font-semibold" style={{ color: '#10B981' }}>Active</p>
          </div>
        </div>
        <div className="w-full space-y-2 mt-4">
          {healthData.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-slate-500 text-[12px]">{name}</span>
              </div>
              <span className="text-slate-800 text-[12px] font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default function ChartsRow1({ stats }) {
  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-3"><CampaignProgress stats={stats} /></div>
      <div className="col-span-5"><ResponseTrend stats={stats} /></div>
      <div className="col-span-2"><BoothCoverage stats={stats} /></div>
      <div className="col-span-2"><BoothHealth stats={stats} /></div>
    </div>
  )
}
