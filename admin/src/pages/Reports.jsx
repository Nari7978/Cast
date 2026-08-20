import { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  ChevronDown, Users, UserCheck, Loader2, Search,
  TrendingUp, Activity, BarChart2, Clock, Filter, Download,
} from 'lucide-react'
import { supabase } from '../supabase/config'

// ── Gender helpers ────────────────────────────────────────────────────────────
const isMale   = g => { const t = (g||'').trim(); const u = t.toUpperCase(); return u==='MALE'||u==='M'||t==='पुरुष' }
const isFemale = g => { const t = (g||'').trim(); const u = t.toUpperCase(); return u==='FEMALE'||u==='F'||t==='महिला' }
const isOther  = g => { const t = (g||'').trim(); const u = t.toUpperCase(); return u==='OTHER'||u==='O'||t==='तृतीय लिंग' }
const getGender = d => d?.GENDER || d?.gender || ''
const getAge    = d => parseInt(d?.AGE || d?.age || '0') || 0

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(n) {
  if (n >= 100000) return (n/100000).toFixed(1)+'L'
  if (n >= 1000)   return (n/1000).toFixed(1)+'K'
  return String(n)
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff/60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins/60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs/24)}d ago`
}

// ── UI atoms ──────────────────────────────────────────────────────────────────

function KPITile({ label, value, sub, color = '#5B5CEB', bg = '#EEF2FF', icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-[28px] font-extrabold tracking-tight text-slate-900 leading-none">{value}</p>
      <p className="text-[12px] font-semibold text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-slate-900 font-bold text-[15px]">{title}</h3>
          {subtitle && <p className="text-slate-400 text-[11px] mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function HBar({ label, value, pct, color, max }) {
  const w = max ? Math.round(value/max*100) : pct
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-slate-600 font-medium truncate max-w-[55%]">{label}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-slate-400">{value}</span>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ color, background: color+'1A' }}>{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100,w)}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Booth selector dropdown ───────────────────────────────────────────────────

function BoothSelector({ booths, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const [q, setQ]       = useState('')

  const filtered = booths.filter(b =>
    String(b.boothNo).includes(q) ||
    (b.pollingStation||'').toLowerCase().includes(q.toLowerCase())
  )

  const label = selected
    ? `Booth ${selected.boothNo} — ${selected.pollingStation || 'Unknown'}`
    : 'All Booths (Aggregate)'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[13px] font-semibold text-slate-700 hover:border-[#5B5CEB]/40 transition-colors min-w-[240px] justify-between"
        style={{ boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
        <span className="truncate">{label}</span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-50">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Search booth or station..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-[12px] text-slate-600 placeholder-slate-400 focus:outline-none" />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <button
                onClick={() => { onChange(null); setOpen(false); setQ('') }}
                className="w-full text-left px-4 py-3 text-[12px] font-semibold hover:bg-slate-50 transition-colors border-b border-slate-50"
                style={{ color: !selected ? '#5B5CEB' : '#64748B' }}>
                All Booths (Aggregate view)
              </button>
              {filtered.map(b => (
                <button key={b.boothNo}
                  onClick={() => { onChange(b); setOpen(false); setQ('') }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  style={{ color: selected?.boothNo === b.boothNo ? '#5B5CEB' : '#334155' }}>
                  <p className="text-[12px] font-semibold">Booth {b.boothNo}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{b.pollingStation || 'Unknown station'} · {(b.voterCount||0).toLocaleString()} voters</p>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-slate-300 text-[12px] text-center py-6">No booths match</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Demographics panel ────────────────────────────────────────────────────────

function Demographics({ voters, responses }) {
  const stats = useMemo(() => {
    let male = 0, female = 0, other = 0
    const ages = { '18–25': 0, '26–35': 0, '36–45': 0, '46–60': 0, '60+': 0 }

    // Gender + age of ALL voters in booth
    voters.forEach(v => {
      const g = getGender(v.data)
      if (isMale(g)) male++
      else if (isFemale(g)) female++
      else if (isOther(g)) other++
      const age = getAge(v.data)
      if (age >= 18 && age <= 25) ages['18–25']++
      else if (age >= 26 && age <= 35) ages['26–35']++
      else if (age >= 36 && age <= 45) ages['36–45']++
      else if (age >= 46 && age <= 60) ages['46–60']++
      else if (age > 60) ages['60+']++
    })

    // Gender of SURVEYED voters (who submitted a response)
    let rMale = 0, rFemale = 0, rOther = 0
    responses.forEach(r => {
      const g = getGender(r.voterData || {})
      if (isMale(g)) rMale++
      else if (isFemale(g)) rFemale++
      else if (isOther(g)) rOther++
    })

    const total = male + female + other || 1
    return { male, female, other, total, ages, rMale, rFemale, rOther }
  }, [voters, responses])

  const genderRows = [
    { label: 'Male',   count: stats.male,   color: '#5B5CEB' },
    { label: 'Female', count: stats.female, color: '#EC4899' },
    { label: 'Other',  count: stats.other,  color: '#94A3B8' },
  ]
  const maxAge = Math.max(...Object.values(stats.ages), 1)

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Gender */}
      <SectionCard title="Gender Breakdown" subtitle="All registered voters in this booth">
        <div className="space-y-3">
          {genderRows.map(({ label, count, color }) => (
            <HBar key={label} label={label} value={count}
              pct={Math.round(count/stats.total*100)} color={color} />
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-50 grid grid-cols-3 gap-3">
          {genderRows.map(({ label, count, color }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: color+'12' }}>
              <p className="text-[20px] font-extrabold" style={{ color }}>{fmt(count)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Age */}
      <SectionCard title="Age Distribution" subtitle="Registered voters by age group">
        <div className="space-y-3">
          {Object.entries(stats.ages).map(([group, count]) => (
            <HBar key={group} label={group} value={count}
              pct={Math.round(count/stats.total*100)} color="#5B5CEB"
              max={maxAge} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ── Survey Q&A breakdown ──────────────────────────────────────────────────────

function SurveyBreakdown({ responses, surveys }) {
  const [activeSurveyId, setActiveSurveyId] = useState(null)

  // Find which surveys are represented in these responses
  const surveyIds = useMemo(() => [...new Set(responses.map(r => r.surveyId).filter(Boolean))], [responses])

  useEffect(() => {
    if (surveyIds.length > 0 && !activeSurveyId) setActiveSurveyId(surveyIds[0])
  }, [surveyIds])

  const activeSurvey = surveys.find(s => s.id === activeSurveyId)
  const questions = activeSurvey?.data?.questions || []

  // Filter responses to active survey
  const surveyResponses = responses.filter(r => r.surveyId === activeSurveyId)

  // Build answer distribution per question
  const qStats = useMemo(() => {
    return questions.map(q => {
      const counts = {}
      surveyResponses.forEach(r => {
        const ans = r.answers?.[q.id]
        const vals = Array.isArray(ans) ? ans : ans ? [ans] : []
        vals.forEach(v => {
          if (v && String(v).trim() && v !== '—') {
            const k = String(v).trim()
            counts[k] = (counts[k] || 0) + 1
          }
        })
      })
      const entries = Object.entries(counts).sort((a,b) => b[1]-a[1])
      const maxV = entries[0]?.[1] || 1
      return { q, entries, maxV, total: surveyResponses.length }
    }).filter(s => s.entries.length > 0)
  }, [questions, surveyResponses])

  const colors = ['#5B5CEB','#059669','#D97706','#EC4899','#8B5CF6','#06B6D4','#F43F5E','#10B981']

  if (surveyIds.length === 0) {
    return (
      <SectionCard title="Survey Responses" subtitle="Question-by-question breakdown">
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-300 text-[13px]">No survey responses in this booth yet</p>
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title="Survey Responses"
      subtitle={`${surveyResponses.length} submissions · ${questions.length} questions`}
      right={
        surveyIds.length > 1 ? (
          <select
            value={activeSurveyId || ''}
            onChange={e => setActiveSurveyId(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none">
            {surveyIds.map(id => {
              const s = surveys.find(sv => sv.id === id)
              return <option key={id} value={id}>{s?.data?.title || id}</option>
            })}
          </select>
        ) : null
      }
    >
      {qStats.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-slate-300 text-[13px]">No answers recorded yet</p>
        </div>
      ) : (
        <div className="space-y-7">
          {qStats.map(({ q, entries, maxV, total }, qi) => (
            <div key={q.id}>
              <div className="flex items-start gap-2 mb-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center mt-0.5"
                  style={{ background: '#5B5CEB' }}>
                  {qi + 1}
                </span>
                <p className="text-[13px] font-semibold text-slate-800">
                  {q.question || q.text || q.label || q.id}
                </p>
              </div>
              <div className="space-y-2 ml-7">
                {entries.slice(0, 8).map(([ans, count], i) => {
                  const pct = Math.round(count/total*100)
                  const color = colors[i % colors.length]
                  return (
                    <div key={ans}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-slate-600 truncate max-w-[55%]">{ans}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-slate-400">{count}</span>
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ color, background: color+'18' }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(count/maxV*100)}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
                {entries.length > 8 && (
                  <p className="text-[11px] text-slate-400">+{entries.length - 8} more answers</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function Timeline({ responses }) {
  const trendData = useMemo(() => {
    const counts = {}
    responses.forEach(r => {
      const d = new Date(r.submittedAt || r.inserted_at)
      if (isNaN(d)) return
      const key = `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]}`
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a,b) => {
        const parse = s => { const [day,mon] = s.split(' '); return MONTHS.indexOf(mon)*31+parseInt(day) }
        return parse(a[0]) - parse(b[0])
      })
      .map(([date, count]) => ({ date, responses: count }))
  }, [responses])

  const CustomTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-900 text-white rounded-xl px-3 py-2 text-[11px]">
        <p className="text-slate-400">{label}</p>
        <p className="font-bold">{payload[0].value} responses</p>
      </div>
    )
  }

  return (
    <SectionCard title="Submission Timeline" subtitle="Daily response volume">
      {trendData.length === 0 ? (
        <div className="flex items-center justify-center h-[160px]">
          <p className="text-slate-300 text-[13px]">No submissions yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5B5CEB" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#5B5CEB" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTip />} />
            <Area type="monotone" dataKey="responses"
              stroke="#5B5CEB" strokeWidth={2.5}
              fill="url(#rptGrad)" dot={false}
              activeDot={{ r: 5, fill: '#5B5CEB', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  )
}

// ── Response list ─────────────────────────────────────────────────────────────

const PAGE = 10
function ResponseList({ responses, surveys }) {
  const [page, setPage] = useState(1)
  const [q, setQ]       = useState('')

  const filtered = responses.filter(r =>
    !q ||
    (r.voterName||'').toLowerCase().includes(q.toLowerCase()) ||
    String(r.boothNo||'').includes(q) ||
    (r.agentName||'').toLowerCase().includes(q.toLowerCase())
  )
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total/PAGE))
  const rows  = filtered.slice((page-1)*PAGE, page*PAGE)

  // Build qMap from surveys
  const qMap = useMemo(() => {
    const map = {}
    surveys.forEach(s => {
      ;(s.data?.questions || []).forEach(q => {
        map[q.id] = q.question || q.text || q.label || q.id
      })
    })
    return map
  }, [surveys])

  return (
    <SectionCard
      title="Individual Responses"
      subtitle={`${total} records`}
      right={
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="Search voter / agent..."
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-600 placeholder-slate-400 focus:outline-none w-44" />
        </div>
      }
    >
      {rows.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-slate-300 text-[13px]">No responses found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const answers = r.answers || {}
            const preview = Object.entries(answers).slice(0, 2).map(([qid, ans]) => {
              const text = qMap[qid] || qid
              const val  = Array.isArray(ans) ? ans.join(', ') : String(ans||'')
              return `${text}: ${val}`
            }).join(' · ')
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50/70 transition-colors group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: '#5B5CEB' }}>
                  {String(r.boothNo||'?').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">
                        {r.voterName || 'Voter'} · Booth {r.boothNo}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {r.agentName ? `via ${r.agentName}` : 'Direct submission'}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-300 flex-shrink-0">{timeAgo(r.submittedAt||r.inserted_at)}</span>
                  </div>
                  {preview && (
                    <p className="text-[11px] text-slate-500 mt-1.5 truncate">{preview}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
          <p className="text-[11px] text-slate-400">
            {Math.min((page-1)*PAGE+1, total)}–{Math.min(page*PAGE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            {[...Array(Math.min(pages,5))].map((_,i) => {
              const p = i + 1
              return (
                <button key={p} onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-[11px] font-medium transition-all"
                  style={page===p ? { background:'#5B5CEB', color:'#fff' } : { color:'#64748B', border:'1px solid #E2E8F0' }}>
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Reports() {
  const [booths,    setBooths]    = useState([])
  const [surveys,   setSurveys]   = useState([])
  const [selected,  setSelected]  = useState(null) // selected booth object or null = all
  const [voters,    setVoters]    = useState([])
  const [responses, setResponses] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [booting,   setBooting]   = useState(true)

  // Load booths + surveys once
  useEffect(() => {
    Promise.all([
      supabase.from('booths').select('boothNo, voterCount, pollingStation').order('boothNo'),
      supabase.from('surveys').select('id, data'),
    ]).then(([bRes, sRes]) => {
      setBooths(bRes.data || [])
      setSurveys(sRes.data || [])
      setBooting(false)
    })
  }, [])

  // Load data whenever selection changes
  useEffect(() => {
    async function load() {
      setLoading(true)
      if (selected) {
        // Booth-specific
        const [vRes, rRes] = await Promise.all([
          supabase.from('voters').select('data').eq('boothNo', String(selected.boothNo)),
          supabase.from('responses').select('data, inserted_at')
            .filter('data->>boothNo', 'eq', String(selected.boothNo))
            .order('inserted_at', { ascending: false }),
        ])
        setVoters(vRes.data || [])
        setResponses((rRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at })))
      } else {
        // All booths aggregate
        const [vRes, rRes] = await Promise.all([
          supabase.from('voters').select('data').limit(100000),
          supabase.from('responses').select('data, inserted_at').order('inserted_at', { ascending: false }),
        ])
        setVoters(vRes.data || [])
        setResponses((rRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at })))
      }
      setLoading(false)
    }
    if (!booting) load()
  }, [selected, booting])

  // ── Computed KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    let male = 0, female = 0, other = 0
    voters.forEach(v => {
      const g = getGender(v.data)
      if (isMale(g)) male++
      else if (isFemale(g)) female++
      else if (isOther(g)) other++
    })

    const totalVoters = selected
      ? selected.voterCount || voters.length
      : booths.reduce((s, b) => s + (b.voterCount||0), 0) || voters.length
    const surveyed = responses.length
    const rate = totalVoters ? Math.min(100, Math.round(surveyed / totalVoters * 100)) : 0

    const todayStr = new Date().toDateString()
    const today = responses.filter(r => r.submittedAt && new Date(r.submittedAt).toDateString() === todayStr).length

    return { totalVoters, surveyed, rate, male, female, other, today }
  }, [voters, responses, selected, booths])

  const boothLabel = selected
    ? `Booth ${selected.boothNo} — ${selected.pollingStation || ''}`
    : 'All Booths'

  if (booting) {
    return (
      <div className="-m-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)', background: '#F0F3FA' }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: '#5B5CEB' }} />
          <p className="text-slate-500 text-[14px]">Loading reports…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white border-b border-[#E8ECF4]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-slate-800 font-bold text-xl">Reports</h2>
            <p className="text-slate-400 text-[13px] mt-0.5">Detailed analytics per booth</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-[#E8ECF4] rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <BoothSelector booths={booths} selected={selected} onChange={setSelected} />
          {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
          {selected && (
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[12px] font-medium text-indigo-600">
              {selected.pollingStation || 'Unknown station'}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-5" style={{ background: '#F0F3FA', minHeight: 'calc(100vh - 140px)' }}>

        {/* ── KPI Strip ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-7 gap-4">
          <KPITile icon={Users}     label="Total Voters"   value={fmt(kpis.totalVoters)} sub={boothLabel}     color="#5B5CEB" bg="#EEF2FF" />
          <KPITile icon={UserCheck} label="Surveyed"       value={fmt(kpis.surveyed)}    sub="Responses collected" color="#059669" bg="#ECFDF5" />
          <KPITile icon={TrendingUp} label="Response Rate" value={`${kpis.rate}%`}       sub="Of registered voters" color={kpis.rate>=70?'#059669':kpis.rate>=40?'#D97706':'#EF4444'} bg={kpis.rate>=70?'#ECFDF5':kpis.rate>=40?'#FFFBEB':'#FEF2F2'} />
          <KPITile icon={Activity}  label="Today"         value={fmt(kpis.today)}       sub="Submitted today"  color="#D97706" bg="#FFFBEB" />
          <KPITile icon={BarChart2} label="Male"          value={fmt(kpis.male)}        sub="Registered voters" color="#5B5CEB" bg="#EEF2FF" />
          <KPITile icon={BarChart2} label="Female"        value={fmt(kpis.female)}      sub="Registered voters" color="#EC4899" bg="#FDF2F8" />
          <KPITile icon={BarChart2} label="Other"         value={fmt(kpis.other)}       sub="Registered voters" color="#94A3B8" bg="#F8FAFC" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin" style={{ color: '#5B5CEB' }} />
          </div>
        ) : (
          <>
            {/* ── Timeline ───────────────────────────────────────────────────── */}
            <Timeline responses={responses} />

            {/* ── Demographics ───────────────────────────────────────────────── */}
            <Demographics voters={voters} responses={responses} />

            {/* ── Survey breakdown ───────────────────────────────────────────── */}
            <SurveyBreakdown responses={responses} surveys={surveys} />

            {/* ── Response list ──────────────────────────────────────────────── */}
            <ResponseList responses={responses} surveys={surveys} />
          </>
        )}
      </div>
    </div>
  )
}
