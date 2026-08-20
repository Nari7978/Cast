import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, defs, linearGradient, stop,
} from 'recharts'

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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0F172A', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12 }}>
      <p style={{ color: '#94A3B8', marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#fff', fontWeight: 700 }}>{payload[0].value} responses</p>
    </div>
  )
}

function ResponseTrend({ stats }) {
  const trendData = buildTrend(stats?.responses)
  const hasData = trendData.length > 0
  const total = stats?.totalResponses || 0
  const today = stats?.todayResponses || 0

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 h-full"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-slate-900 font-bold text-[15px]">Response Trend</h3>
          <p className="text-slate-400 text-[11px] mt-0.5">Daily submission volume</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-400">Total collected</p>
          <p className="text-[20px] font-extrabold text-slate-900 leading-tight">{total >= 1000 ? (total/1000).toFixed(1)+'K' : total}</p>
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B5CEB" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#5B5CEB" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans' }}
              axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="responses"
              stroke="#5B5CEB" strokeWidth={2.5}
              fill="url(#respGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#5B5CEB', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-[210px] gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
            <span className="text-[20px]">📊</span>
          </div>
          <p className="text-slate-300 text-[13px]">Responses appear once collected</p>
        </div>
      )}
    </div>
  )
}

function CampaignSummary({ stats }) {
  const phase      = stats?.latestPhase
  const coverage   = stats?.coverageRate ?? 0
  const total      = stats?.totalResponses ?? 0
  const today      = stats?.todayResponses ?? 0
  const velocity   = stats?.velocity ?? 0
  const activeA    = stats?.activeAgents ?? 0
  const totalA     = stats?.totalAgents ?? 0

  const rows = [
    { label: 'Phase', value: phase?.name || '—', accent: false },
    { label: 'Total responses', value: total.toLocaleString(), accent: false },
    { label: 'Today', value: today.toLocaleString(), accent: true, color: '#5B5CEB' },
    { label: 'Last hour', value: velocity.toLocaleString(), accent: true, color: '#D97706' },
    { label: 'Active agents', value: `${activeA} / ${totalA}`, accent: false },
  ]

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col h-full"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      <h3 className="text-slate-900 font-bold text-[15px] mb-1">Campaign Summary</h3>
      <p className="text-slate-400 text-[11px] mb-5">Live snapshot</p>

      {/* Big coverage ring */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative" style={{ width: 120, height: 120 }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="#059669" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(coverage / 100) * (2 * Math.PI * 50)} ${2 * Math.PI * 50}`}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[28px] font-extrabold text-slate-900 leading-none">{coverage}%</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">coverage</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Booths with ≥1 response</p>
      </div>

      <div className="space-y-3 flex-1">
        {rows.map(({ label, value, accent, color }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[12px] text-slate-400">{label}</span>
            <span className="text-[13px] font-bold" style={{ color: accent ? color : '#0F172A' }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ChartsRow1({ stats }) {
  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-8"><ResponseTrend stats={stats} /></div>
      <div className="col-span-4"><CampaignSummary stats={stats} /></div>
    </div>
  )
}
