import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const responseStatus = [
  { name: 'Completed', value: 68450, color: '#10B981' },
  { name: 'Pending',   value: 24320, color: '#F59E0B' },
  { name: 'Rejected',  value: 7230,  color: '#EF4444' },
]

const genderData = [
  { name: 'Male',   value: 54, color: '#5B5CEB' },
  { name: 'Female', value: 43, color: '#EC4899' },
  { name: 'Other',  value: 3,  color: '#94A3B8' },
]

const ageData = [
  { group: '18–25', value: 22 },
  { group: '26–35', value: 31 },
  { group: '36–45', value: 24 },
  { group: '46–60', value: 16 },
  { group: '60+',   value: 7  },
]

const issueData = [
  { name: 'Roads',         value: 4820 },
  { name: 'Water Supply',  value: 3940 },
  { name: 'Employment',    value: 3210 },
  { name: 'Electricity',   value: 2870 },
  { name: 'Others',        value: 1950 },
]

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8ECF4] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="mb-4">
        <h3 className="text-slate-800 font-semibold text-[13px]">{title}</h3>
        {subtitle && <p className="text-slate-400 text-[11px] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function ResponseStatus() {
  const total = responseStatus.reduce((s, d) => s + d.value, 0)
  return (
    <Card title="Response Status" subtitle="All surveys · Phase 2">
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40">
          <PieChart width={160} height={160}>
            <Pie data={responseStatus} cx={76} cy={76} innerRadius={48} outerRadius={70} dataKey="value" stroke="none">
              {responseStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1A1D2E', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
              formatter={(v) => [v.toLocaleString(), '']}
            />
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-bold text-xl text-slate-800">{Math.round(total / 1000)}K</p>
            <p className="text-[10px] text-slate-400">total</p>
          </div>
        </div>
        <div className="w-full space-y-2 mt-3">
          {responseStatus.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-slate-500 text-[12px]">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.round(value / total * 100)}%`, background: color }} />
                </div>
                <span className="text-slate-700 text-[11px] font-semibold w-12 text-right">{value.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function VoterDemographics() {
  return (
    <Card title="Voter Demographics" subtitle="Gender & age distribution">
      <div className="grid grid-cols-2 gap-4">
        {/* Gender donut */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Gender</p>
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
              <PieChart width={112} height={112}>
                <Pie data={genderData} cx={52} cy={52} innerRadius={32} outerRadius={50} dataKey="value" stroke="none">
                  {genderData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </div>
            <div className="w-full space-y-1.5 mt-2">
              {genderData.map(({ name, value, color }) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    <span className="text-slate-500 text-[11px]">{name}</span>
                  </div>
                  <span className="text-slate-700 text-[11px] font-semibold">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Age horizontal bars */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Age Groups</p>
          <div className="space-y-2.5">
            {ageData.map(({ group, value }) => (
              <div key={group}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 text-[11px]">{group}</span>
                  <span className="text-slate-700 text-[11px] font-semibold">{value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${value}%`, background: 'linear-gradient(90deg, #5B5CEB, #818CF8)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function IssueDistribution() {
  return (
    <Card title="Issue Distribution" subtitle="Top voter concerns reported">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={issueData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} width={90} />
          <Tooltip
            contentStyle={{ background: '#1A1D2E', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
            formatter={(v) => [v.toLocaleString(), 'Reports']}
            cursor={{ fill: 'rgba(91,92,235,0.05)' }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#5B5CEB" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export default function ChartsRow3() {
  return (
    <div className="grid grid-cols-3 gap-5">
      <ResponseStatus />
      <VoterDemographics />
      <IssueDistribution />
    </div>
  )
}
