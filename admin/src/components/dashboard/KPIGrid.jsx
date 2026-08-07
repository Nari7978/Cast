import { Link } from 'react-router-dom'
import {
  MapPin, UserCheck, Users, ClipboardList,
  MessageSquare, CheckCircle2, Activity, BarChart2,
  TrendingUp, TrendingDown, ArrowRight,
} from 'lucide-react'

const kpis = [
  {
    title: 'Total Booths',
    value: '300',
    desc: 'Assigned in Phase 2',
    growth: '+12 booths',
    up: true,
    icon: MapPin,
    color: '#3B82F6',
    bg: '#EFF6FF',
    link: '/booths',
  },
  {
    title: 'Total Voters',
    value: '2,00,000',
    desc: 'Registered in campaign',
    growth: '+2.4%',
    up: true,
    icon: UserCheck,
    color: '#5B5CEB',
    bg: '#EEF2FF',
    link: '/voters',
  },
  {
    title: 'Active Booth Agents',
    value: '284',
    desc: 'Out of 300 assigned',
    growth: '-5.3%',
    up: false,
    icon: Users,
    color: '#10B981',
    bg: '#ECFDF5',
    link: '/booth-agents',
  },
  {
    title: 'Active Surveys',
    value: '3',
    desc: 'Running this phase',
    growth: '+1 new',
    up: true,
    icon: ClipboardList,
    color: '#F59E0B',
    bg: '#FFFBEB',
    link: '/surveys',
  },
  {
    title: 'Total Responses',
    value: '1,24,820',
    desc: 'Across all surveys',
    growth: '+18.6%',
    up: true,
    icon: MessageSquare,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    link: '/responses',
  },
  {
    title: 'Phase Completion',
    value: '62.4%',
    desc: 'Target: 80% by May 31',
    growth: '+4.2%',
    up: true,
    icon: CheckCircle2,
    color: '#06B6D4',
    bg: '#ECFEFF',
    link: '/reports',
  },
  {
    title: "Today's Responses",
    value: '4,821',
    desc: 'vs 3,940 yesterday',
    growth: '+22.4%',
    up: true,
    icon: Activity,
    color: '#EC4899',
    bg: '#FDF2F8',
    link: '/responses',
  },
  {
    title: 'Booth Coverage',
    value: '71.2%',
    desc: '142 of 300 booths covered',
    growth: '+8.1%',
    up: true,
    icon: BarChart2,
    color: '#059669',
    bg: '#ECFDF5',
    link: '/booths',
  },
]

export default function KPIGrid() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((k) => {
        const Icon = k.icon
        const Trend = k.up ? TrendingUp : TrendingDown
        return (
          <div
            key={k.title}
            className="bg-white rounded-2xl border border-[#E8ECF4] p-5 hover:shadow-md transition-shadow"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                <Icon size={18} style={{ color: k.color }} />
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${k.up ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                <Trend size={11} />
                {k.growth}
              </div>
            </div>
            <p className="text-slate-800 font-bold text-2xl mb-0.5 tracking-tight">{k.value}</p>
            <p className="text-slate-500 text-[12px] font-medium mb-3">{k.title}</p>
            <p className="text-slate-400 text-[11px] mb-3">{k.desc}</p>
            <Link
              to={k.link}
              className="flex items-center gap-1 text-[11px] font-semibold transition-all hover:gap-2"
              style={{ color: k.color }}
            >
              View Details <ArrowRight size={11} />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
