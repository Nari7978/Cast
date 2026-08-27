import { Link } from 'react-router-dom'
import { Users, Zap, TrendingUp, Activity, UserCheck, Loader2 } from 'lucide-react'

function fmt(n) {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString()
}

function RingGauge({ pct = 0, color = '#5B5CEB', size = 56, stroke = 6 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  )
}

function KPICard({ icon: Icon, iconColor, iconBg, label, value, sub, delta, deltaLabel, link, gauge, gaugePct, gaugeColor, loading }) {
  const content = (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        {loading && <Loader2 size={13} className="animate-spin text-slate-300" />}
        {gauge && !loading && (
          <div className="relative flex items-center justify-center">
            <RingGauge pct={gaugePct} color={gaugeColor || iconColor} />
            <span className="absolute text-[10px] font-bold" style={{ color: gaugeColor || iconColor }}>
              {gaugePct}%
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-[26px] font-extrabold tracking-tight text-slate-900 leading-none">{value}</p>
        <p className="text-[12px] font-semibold text-slate-500 mt-1">{label}</p>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
        <p className="text-[11px] text-slate-400">{sub}</p>
        {delta !== undefined && (
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
            delta > 0 ? 'text-emerald-600 bg-emerald-50' : delta < 0 ? 'text-rose-500 bg-rose-50' : 'text-slate-400 bg-slate-50'
          }`}>
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '='} {Math.abs(delta)} {deltaLabel}
          </span>
        )}
      </div>
    </div>
  )

  return link ? <Link to={link} className="block no-underline">{content}</Link> : content
}

export default function KPIGrid({ stats }) {
  const loading = !stats

  const todayDelta = stats
    ? stats.todayResponses - stats.yesterdayTotal
    : undefined

  const cards = [
    {
      icon: UserCheck,
      iconColor: '#5B5CEB',
      iconBg: '#EEF2FF',
      label: 'Total Voters',
      value: fmt(stats?.totalVoters ?? null),
      sub: stats?.totalBooths ? `Across ${stats.totalBooths} booths` : 'No voter data yet',
      link: '/voters',
    },
    {
      icon: TrendingUp,
      iconColor: '#059669',
      iconBg: '#ECFDF5',
      label: 'Survey Coverage',
      value: stats ? `${stats.coverageRate}%` : '—',
      sub: stats?.boothStats
        ? `${stats.boothStats.filter(b => b.responseCount > 0).length} of ${stats.totalBooths} booths active`
        : 'No responses yet',
      gauge: true,
      gaugePct: stats?.coverageRate ?? 0,
      gaugeColor: '#059669',
      link: '/booths',
    },
    {
      icon: Activity,
      iconColor: '#5B5CEB',
      iconBg: '#EEF2FF',
      label: "Today's Responses",
      value: fmt(stats?.todayResponses ?? null),
      sub: stats?.yesterdayTotal !== undefined ? `Yesterday: ${stats.yesterdayTotal}` : 'No data',
      delta: todayDelta,
      deltaLabel: 'vs yesterday',
      link: '/responses',
    },
    {
      icon: Zap,
      iconColor: '#D97706',
      iconBg: '#FFFBEB',
      label: 'Last Hour',
      value: fmt(stats?.velocity ?? null),
      sub: 'Responses in past 60 min',
      link: '/responses',
    },
    {
      icon: Users,
      iconColor: '#EC4899',
      iconBg: '#FDF2F8',
      label: 'Active Agents',
      value: stats ? String(stats.activeAgents) : '—',
      sub: stats?.totalAgents ? `${stats.totalAgents} agents total` : 'No agents yet',
      link: '/booth-agents',
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((c) => (
        <KPICard key={c.label} {...c} loading={loading} />
      ))}
    </div>
  )
}
