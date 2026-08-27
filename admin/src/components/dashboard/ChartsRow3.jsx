import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Clock } from 'lucide-react'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function VoterDemographics({ stats }) {
  const genderData = stats?.genderData || []
  const ageData    = stats?.ageData    || []
  const hasVoters  = (stats?.totalVoters || 0) > 0
  const hasData    = genderData.some(g => g.value > 0)

  const genderColors = { Male: '#5B5CEB', Female: '#EC4899', Other: '#94A3B8' }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      <h3 className="text-slate-900 font-bold text-[15px] mb-1">Voter Demographics</h3>
      <p className="text-slate-400 text-[11px] mb-5">Gender & age distribution</p>

      {!hasData ? (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-slate-300 text-[13px]">
            {hasVoters ? 'Collect responses to see demographics' : 'Upload voters to see demographics'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Gender bars */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Gender</p>
            <div className="space-y-2.5">
              {genderData.map(({ name, value, color }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-[12px] text-slate-600">{name}</span>
                    </div>
                    <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${value}%`, background: color, opacity: 0.85 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Age bars */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Age Groups</p>
            <div className="space-y-2">
              {ageData.map(({ group, value }) => (
                <div key={group} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 w-12 flex-shrink-0">{group}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${value}%`, background: 'linear-gradient(90deg, #5B5CEB, #818CF8)' }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 tabular-nums w-8 text-right">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TopAnswers({ stats }) {
  const issueData = stats?.issueData || []
  const hasData   = issueData.length > 0
  const maxVal    = issueData[0]?.value || 1

  const barColors = ['#5B5CEB','#059669','#D97706','#EC4899','#8B5CF6']

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      <h3 className="text-slate-900 font-bold text-[15px] mb-1">Top Survey Answers</h3>
      <p className="text-slate-400 text-[11px] mb-5">Most common responses across all surveys</p>

      {!hasData ? (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-slate-300 text-[13px]">Submit responses to see distribution</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issueData.map(({ name, value }, i) => {
            const pct = Math.round(value / maxVal * 100)
            const color = barColors[i % barColors.length]
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-slate-700 font-medium truncate max-w-[160px]">{name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-400">{value}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ color, background: color + '18' }}>{pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function LiveActivity({ stats }) {
  const activity = stats?.recentActivity || []
  const hasData  = activity.length > 0

  const boothHues = ['#5B5CEB','#059669','#D97706','#EC4899','#8B5CF6','#06B6D4','#F43F5E','#10B981']
  const boothColor = (boothNo) => {
    const n = parseInt(String(boothNo).replace(/\D/g, '')) || 0
    return boothHues[n % boothHues.length]
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-slate-900 font-bold text-[15px]">Live Activity</h3>
        {hasData && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-500 font-semibold">LIVE</span>
          </span>
        )}
      </div>
      <p className="text-slate-400 text-[11px] mb-5">Recent survey submissions</p>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8">
          <Clock size={24} className="text-slate-200" />
          <p className="text-slate-300 text-[12px]">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activity.map((a, i) => {
            const color = boothColor(a.boothNo)
            return (
              <div key={i} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: color }}>
                  {String(a.boothNo).slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-slate-700">
                    <span className="font-semibold">Booth {a.boothNo}</span>
                    {a.voterName && <span className="text-slate-400"> · {a.voterName}</span>}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {a.agentName !== 'Agent' ? `via ${a.agentName}` : 'Response submitted'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-300 flex-shrink-0 mt-0.5">{timeAgo(a.submittedAt)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ChartsRow3({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-5">
      <VoterDemographics stats={stats} />
      <TopAnswers stats={stats} />
      <LiveActivity stats={stats} />
    </div>
  )
}
