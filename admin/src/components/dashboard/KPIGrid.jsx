import { Link } from 'react-router-dom'
import {
  MapPin, UserCheck, Users, ClipboardList,
  MessageSquare, CheckCircle2, Activity, BarChart2,
  TrendingUp, TrendingDown, ArrowRight, Loader2,
} from 'lucide-react'

function fmt(n) {
  if (n === null || n === undefined) return '—'
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000)   return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString()
}

export default function KPIGrid({ stats }) {
  const totalBooths   = stats?.totalBooths   ?? null
  const totalVoters   = stats?.totalVoters   ?? null
  const activeAgents  = stats?.activeAgents  ?? null
  const totalAgents   = stats?.totalAgents   ?? null
  const activeSurveys = stats?.activeSurveys ?? null
  const totalSurveys  = stats?.totalSurveys  ?? null

  const phase          = stats?.latestPhase
  const completedPct   = phase?.booths ? Math.round((phase.completedBooths || 0) / phase.booths * 100) : null
  const boothCoverage  = totalBooths ? Math.round(((phase?.completedBooths || 0) / totalBooths) * 100) : null

  const kpis = [
    {
      title: 'Total Booths',
      value: fmt(totalBooths),
      desc: totalBooths !== null ? `${totalBooths} booths loaded` : 'No voter data uploaded',
      icon: MapPin, color: '#3B82F6', bg: '#EFF6FF', link: '/booths',
    },
    {
      title: 'Total Voters',
      value: fmt(totalVoters),
      desc: totalVoters ? 'Registered in campaign' : 'Upload a CSV to populate',
      icon: UserCheck, color: '#5B5CEB', bg: '#EEF2FF', link: '/voters',
    },
    {
      title: 'Booth Agents',
      value: totalAgents !== null ? String(totalAgents) : '—',
      desc: totalAgents !== null ? `${activeAgents} active of ${totalAgents}` : 'No agents added yet',
      icon: Users, color: '#10B981', bg: '#ECFDF5', link: '/booth-agents',
    },
    {
      title: 'Surveys',
      value: totalSurveys !== null ? String(totalSurveys) : '—',
      desc: totalSurveys !== null ? `${activeSurveys} active` : 'No surveys created yet',
      icon: ClipboardList, color: '#F59E0B', bg: '#FFFBEB', link: '/surveys',
    },
    {
      title: 'Total Responses',
      value: '—',
      desc: 'No responses collected yet',
      icon: MessageSquare, color: '#8B5CF6', bg: '#F5F3FF', link: '/responses',
    },
    {
      title: 'Phase Completion',
      value: completedPct !== null ? `${completedPct}%` : '—',
      desc: phase ? `${phase.completedBooths || 0} of ${phase.booths || 0} booths` : 'No phase data',
      icon: CheckCircle2, color: '#06B6D4', bg: '#ECFEFF', link: '/reports',
    },
    {
      title: "Today's Responses",
      value: '—',
      desc: 'No response data yet',
      icon: Activity, color: '#EC4899', bg: '#FDF2F8', link: '/responses',
    },
    {
      title: 'Booth Coverage',
      value: boothCoverage !== null ? `${boothCoverage}%` : '—',
      desc: totalBooths ? `${totalBooths} total booths` : 'No booth data',
      icon: BarChart2, color: '#059669', bg: '#ECFDF5', link: '/booths',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((k) => {
        const Icon = k.icon
        return (
          <div key={k.title}
            className="bg-white rounded-2xl border border-[#E8ECF4] p-5 hover:shadow-md transition-shadow"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                <Icon size={18} style={{ color: k.color }} />
              </div>
              {!stats && <Loader2 size={14} className="animate-spin text-slate-300 mt-1" />}
            </div>
            <p className="text-slate-800 font-bold text-2xl mb-0.5 tracking-tight">{k.value}</p>
            <p className="text-slate-500 text-[12px] font-medium mb-3">{k.title}</p>
            <p className="text-slate-400 text-[11px] mb-3">{k.desc}</p>
            <Link to={k.link}
              className="flex items-center gap-1 text-[11px] font-semibold transition-all hover:gap-2"
              style={{ color: k.color }}>
              View Details <ArrowRight size={11} />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
