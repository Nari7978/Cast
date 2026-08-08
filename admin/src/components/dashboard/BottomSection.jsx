import { Link } from 'react-router-dom'
import {
  Upload, FileText, ClipboardList, Users, MapPin,
  AlertTriangle, Clock, AlertCircle,
  Plus, UserPlus, BarChart2,
} from 'lucide-react'

function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E8ECF4] p-5 ${className}`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {title && <h3 className="text-slate-800 font-semibold text-[13px] mb-4">{title}</h3>}
      {children}
    </div>
  )
}

function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function RecentActivity({ stats }) {
  const items = []

  ;(stats?.surveys || []).slice(0, 2).forEach(s => {
    items.push({ icon: ClipboardList, color: '#F59E0B', bg: '#FFFBEB', text: `Survey "${s.name || s.title || 'Untitled'}" created`, time: s.inserted_at })
  })
  ;(stats?.phases || []).slice(0, 2).forEach(p => {
    items.push({ icon: MapPin, color: '#5B5CEB', bg: '#EEF2FF', text: `Phase "${p.name || 'Untitled'}" created`, time: p.inserted_at })
  })
  ;(stats?.assignments || []).slice(0, 2).forEach(a => {
    items.push({ icon: FileText, color: '#8B5CF6', bg: '#F5F3FF', text: `Assignment "${a.name || 'Untitled'}" created`, time: a.inserted_at })
  })
  ;(stats?.agents || []).slice(0, 1).forEach(a => {
    items.push({ icon: Users, color: '#10B981', bg: '#ECFDF5', text: `Agent "${a.name || 'Unknown'}" added`, time: a.inserted_at })
  })

  if (stats && items.length === 0) {
    items.push({ icon: Upload, color: '#06B6D4', bg: '#ECFEFF', text: 'CSV voter data imported', time: null })
  }

  items.sort((a, b) => new Date(b.time) - new Date(a.time))
  const display = items.slice(0, 5)

  return (
    <Card title="Recent Activity">
      {display.length === 0 ? (
        <p className="text-slate-300 text-[12px] text-center py-6">No activity yet</p>
      ) : (
        <div className="space-y-0">
          {display.map((a, i) => {
            const Icon = a.icon
            return (
              <div key={i} className="flex gap-3 pb-4 relative">
                {i < display.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-100" />
                )}
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center z-10" style={{ background: a.bg }}>
                  <Icon size={14} style={{ color: a.color }} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-slate-700 text-[12px] leading-relaxed">{a.text}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{timeAgo(a.time)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function PhaseSummary({ stats }) {
  const phase = stats?.latestPhase
  const pct   = phase?.booths ? Math.round(((phase.completedBooths || 0) / phase.booths) * 100) : 0

  const rows = phase ? [
    ['Phase',            phase.name       || '—'],
    ['Start Date',       phase.createdAt  || '—'],
    ['Total Booths',     String(phase.booths || 0)],
    ['Agents Assigned',  String(phase.agentsAssigned || 0)],
    ['Completed Booths', String(phase.completedBooths || 0)],
    ['Pending Booths',   String(phase.pendingBooths   || 0)],
    ['Responses',        String(phase.responses       || 0)],
  ] : [['Status', 'No phases created yet']]

  return (
    <Card title="Phase Summary">
      <div className="space-y-3 mb-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
            <span className="text-slate-400 text-[12px]">{k}</span>
            <span className="text-slate-700 text-[12px] font-semibold">{v}</span>
          </div>
        ))}
      </div>
      {phase && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 text-[11px]">Completion</span>
            <span className="font-bold text-[13px]" style={{ color: '#5B5CEB' }}>{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #5B5CEB, #818CF8)' }} />
          </div>
        </div>
      )}
    </Card>
  )
}

function PendingWork({ stats }) {
  const pendingWork = [
    { label: 'Total Surveys',    value: stats?.totalSurveys   ?? '—', color: '#5B5CEB', bg: '#EEF2FF' },
    { label: 'Total Phases',     value: stats?.totalPhases    ?? '—', color: '#10B981', bg: '#ECFDF5' },
    { label: 'Total Booths',     value: stats?.totalBooths    ?? '—', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Inactive Agents',  value: stats ? (stats.totalAgents - stats.activeAgents) : '—', color: '#8B5CF6', bg: '#F5F3FF' },
  ]
  return (
    <Card title="Overview">
      <div className="space-y-3">
        {pendingWork.map(({ label, value, color, bg }) => (
          <div key={label} className="flex items-center justify-between p-3 rounded-xl border border-slate-100" style={{ background: bg + '60' }}>
            <span className="text-slate-600 text-[12px] font-medium">{label}</span>
            <span className="text-lg font-bold" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Notifications() {
  const notifications = [
    { icon: AlertTriangle, color: '#EF4444', bg: '#FEF2F2', text: 'No response data collected yet',  tag: 'Info' },
    { icon: Clock,         color: '#F59E0B', bg: '#FFFBEB', text: 'Set up mobile agents to start collecting', tag: 'Notice' },
    { icon: AlertCircle,   color: '#06B6D4', bg: '#ECFEFF', text: 'Add booth agents for assignment', tag: 'Notice' },
  ]
  const tagColors = { Critical: '#EF4444', Warning: '#F59E0B', Info: '#8B5CF6', Notice: '#06B6D4' }
  return (
    <Card title="Notifications">
      <div className="space-y-3">
        {notifications.map((n, i) => {
          const Icon = n.icon
          return (
            <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: n.bg }}>
                <Icon size={14} style={{ color: n.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 text-[12px] leading-snug">{n.text}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                  style={{ color: tagColors[n.tag], background: n.bg }}>
                  {n.tag}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

const quickActions = [
  { icon: ClipboardList, label: 'Create Survey',  link: '/surveys',      color: '#5B5CEB', bg: '#EEF2FF' },
  { icon: Upload,        label: 'Import Voters',  link: '/voters',       color: '#10B981', bg: '#ECFDF5' },
  { icon: MapPin,        label: 'Add Booth',       link: '/booths',       color: '#F59E0B', bg: '#FFFBEB' },
  { icon: UserPlus,      label: 'Add Agent',       link: '/booth-agents', color: '#EC4899', bg: '#FDF2F8' },
  { icon: BarChart2,     label: 'Reports',         link: '/reports',      color: '#8B5CF6', bg: '#F5F3FF' },
]

function QuickActions() {
  return (
    <Card title="Quick Actions">
      <div className="space-y-2">
        {quickActions.map(({ icon: Icon, label, link, color, bg }) => (
          <Link key={label} to={link}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon size={15} style={{ color }} />
            </div>
            <span className="text-slate-700 text-[13px] font-medium group-hover:text-slate-900 transition-colors">{label}</span>
          </Link>
        ))}
      </div>
    </Card>
  )
}

export default function BottomSection({ stats }) {
  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-4"><RecentActivity stats={stats} /></div>
      <div className="col-span-3"><PhaseSummary stats={stats} /></div>
      <div className="col-span-2"><PendingWork stats={stats} /></div>
      <div className="col-span-2"><Notifications /></div>
      <div className="col-span-1"><QuickActions /></div>
    </div>
  )
}
