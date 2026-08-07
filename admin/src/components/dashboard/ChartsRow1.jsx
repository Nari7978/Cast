import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { ArrowRight } from 'lucide-react'

const responseTrend = [
  { date: '01 May', responses: 1240 },
  { date: '05 May', responses: 2890 },
  { date: '10 May', responses: 4520 },
  { date: '15 May', responses: 3890 },
  { date: '20 May', responses: 6240 },
  { date: '25 May', responses: 5820 },
  { date: '31 May', responses: 7650 },
]

const coverageData = [
  { name: 'Completed',   value: 142, color: '#5B5CEB' },
  { name: 'In Progress', value: 89,  color: '#F59E0B' },
  { name: 'Not Started', value: 69,  color: '#E2E8F0' },
]

const healthData = [
  { name: 'Healthy',          value: 68, color: '#10B981' },
  { name: 'Needs Attention',  value: 22, color: '#F59E0B' },
  { name: 'Inactive',         value: 10, color: '#EF4444' },
]

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

function CampaignProgress() {
  const total = 300
  const completed = 142
  const inProgress = 89
  const remaining = 69
  const pct = Math.round((completed / total) * 100)

  const bars = [
    { label: 'Assigned',    value: total,       pct: 100,                     color: '#5B5CEB', bg: '#EEF2FF' },
    { label: 'Completed',   value: completed,   pct: Math.round(completed/total*100),  color: '#10B981', bg: '#ECFDF5' },
    { label: 'In Progress', value: inProgress,  pct: Math.round(inProgress/total*100), color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Remaining',   value: remaining,   pct: Math.round(remaining/total*100),  color: '#94A3B8', bg: '#F8FAFC' },
  ]

  return (
    <Card title="Campaign Progress" subtitle="Phase 2 · Election 2027 – Rishikesh">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-500 text-[12px]">Overall Completion</span>
          <span className="font-bold text-lg" style={{ color: '#5B5CEB' }}>{pct}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #5B5CEB, #818CF8)' }}
          />
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

function ResponseTrend() {
  return (
    <Card title="Response Trend" subtitle="Daily submissions — May 2024" action="View All">
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={responseTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B5CEB" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#5B5CEB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#1A1D2E', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, padding: '8px 12px' }}
            itemStyle={{ color: '#A5B4FC' }}
            cursor={{ stroke: '#5B5CEB', strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={(v) => [v.toLocaleString(), 'Responses']}
          />
          <Line
            type="monotone"
            dataKey="responses"
            stroke="#5B5CEB"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#5B5CEB', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#5B5CEB', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

function BoothCoverage() {
  const total = coverageData.reduce((s, d) => s + d.value, 0)
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
            <p className="font-bold text-xl text-slate-800">47%</p>
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
                <span className="text-slate-400 text-[10px]">{Math.round(value / total * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function BoothHealth() {
  return (
    <Card title="Booth Health" subtitle="Agent activity status">
      <div className="flex flex-col items-center">
        <div className="relative" style={{ height: 96 }}>
          <PieChart width={160} height={96}>
            <Pie
              data={healthData}
              cx={76}
              cy={88}
              startAngle={180}
              endAngle={0}
              innerRadius={44}
              outerRadius={66}
              dataKey="value"
              stroke="none"
            >
              {healthData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-1">
            <p className="font-bold text-lg text-slate-800 leading-tight">68%</p>
            <p className="text-[10px] font-semibold" style={{ color: '#10B981' }}>Healthy</p>
          </div>
        </div>
        <div className="w-full space-y-2 mt-4">
          {healthData.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-slate-500 text-[12px]">{name}</span>
              </div>
              <span className="text-slate-800 text-[12px] font-semibold">{value}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default function ChartsRow1() {
  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-3"><CampaignProgress /></div>
      <div className="col-span-5"><ResponseTrend /></div>
      <div className="col-span-2"><BoothCoverage /></div>
      <div className="col-span-2"><BoothHealth /></div>
    </div>
  )
}
