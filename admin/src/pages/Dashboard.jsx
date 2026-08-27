import { useState, useEffect } from 'react'
import { ChevronDown, RefreshCw, Loader2 } from 'lucide-react'
import { supabase } from '../supabase/config'
import KPIGrid from '../components/dashboard/KPIGrid'
import ChartsRow1 from '../components/dashboard/ChartsRow1'
import TablesRow2 from '../components/dashboard/TablesRow2'
import ChartsRow3 from '../components/dashboard/ChartsRow3'

function FilterBtn({ label, value }) {
  return (
    <button className="flex flex-col items-start px-4 py-2.5 bg-white border border-[#E8ECF4] rounded-xl hover:border-[#5B5CEB]/40 hover:shadow-sm transition-all group">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-slate-800 text-[13px] font-semibold">{value}</span>
        <ChevronDown size={13} className="text-slate-400 group-hover:text-[#5B5CEB] transition-colors" />
      </div>
    </button>
  )
}

const isMale   = g => { const t = (g||'').trim(); const u = t.toUpperCase(); return u === 'MALE' || u === 'M' || t === 'पुरुष' }
const isFemale = g => { const t = (g||'').trim(); const u = t.toUpperCase(); return u === 'FEMALE' || u === 'F' || t === 'महिला' }
const isOther  = g => { const t = (g||'').trim(); const u = t.toUpperCase(); return u === 'OTHER' || u === 'O' || t === 'तृतीय लिंग' }
const getGender = d => d?.GENDER || d?.gender || ''
const getAge    = d => parseInt(d?.AGE || d?.age || '0') || 0

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [synced, setSynced] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadStats() {
    setLoading(true)
    const [boothsRes, agentsRes, surveysRes, phasesRes, assignmentsRes, responsesRes, votersRes] = await Promise.all([
      supabase.from('booths').select('boothNo, voterCount, pollingStation'),
      supabase.from('agents').select('data, inserted_at').order('inserted_at', { ascending: false }),
      supabase.from('surveys').select('data, inserted_at').order('inserted_at', { ascending: false }),
      supabase.from('phases').select('data, inserted_at').order('inserted_at', { ascending: false }),
      supabase.from('assignments').select('data, inserted_at').order('inserted_at', { ascending: false }),
      supabase.from('responses').select('data, inserted_at').order('inserted_at', { ascending: true }),
      supabase.from('voters').select('boothNo, data', { count: 'exact' }).limit(100000),
    ])

    const booths      = boothsRes.data || []
    const agents      = (agentsRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at }))
    const surveys     = (surveysRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at }))
    const phases      = (phasesRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at }))
    const assignments = (assignmentsRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at }))
    const responses   = (responsesRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at }))
    const voters      = votersRes.data || []
    const voterCount  = votersRes.count ?? voters.length

    const latestPhase   = phases[0] || null
    const activeAgents  = agents.filter(a => a.status === 'Active').length
    const activeSurveys = surveys.filter(s => s.status === 'Active').length

    // ── Response stats ─────────────────────────────────────────────────────
    const totalResponses = responses.length
    const todayStr = new Date().toDateString()
    const todayResponses = responses.filter(r => r.submittedAt && new Date(r.submittedAt).toDateString() === todayStr).length

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toDateString()
    const yesterdayTotal = responses.filter(r => r.submittedAt && new Date(r.submittedAt).toDateString() === yStr).length

    const sixtyMinAgo = Date.now() - 60 * 60 * 1000
    const velocity = responses.filter(r => r.submittedAt && new Date(r.submittedAt).getTime() >= sixtyMinAgo).length

    // ── Voter demographics ─────────────────────────────────────────────────
    const totalVoters = voterCount || booths.reduce((sum, b) => sum + (b.voterCount || 0), 0)

    let maleCount = 0, femaleCount = 0, otherCount = 0
    const ageBuckets = { '18–25': 0, '26–35': 0, '36–45': 0, '46–60': 0, '60+': 0 }

    voters.forEach(v => {
      const g = getGender(v.data)
      if (isMale(g))        maleCount++
      else if (isFemale(g)) femaleCount++
      else if (isOther(g))  otherCount++
      const age = getAge(v.data)
      if (age >= 18 && age <= 25)      ageBuckets['18–25']++
      else if (age >= 26 && age <= 35) ageBuckets['26–35']++
      else if (age >= 36 && age <= 45) ageBuckets['36–45']++
      else if (age >= 46 && age <= 60) ageBuckets['46–60']++
      else if (age > 60)               ageBuckets['60+']++
    })

    const genderTotal = maleCount + femaleCount + otherCount || 1
    const genderData = [
      { name: 'Male',   value: Math.round(maleCount / genderTotal * 100),   color: '#5B5CEB' },
      { name: 'Female', value: Math.round(femaleCount / genderTotal * 100), color: '#EC4899' },
      { name: 'Other',  value: Math.round(otherCount / genderTotal * 100),  color: '#94A3B8' },
    ]

    const ageTotal = Object.values(ageBuckets).reduce((s, v) => s + v, 0) || 1
    const ageData = Object.entries(ageBuckets).map(([group, count]) => ({
      group, count, value: Math.round(count / ageTotal * 100),
    }))

    // ── Per-booth stats ────────────────────────────────────────────────────
    const boothResponseCounts = {}
    responses.forEach(r => {
      const b = String(r.boothNo || '')
      if (b) boothResponseCounts[b] = (boothResponseCounts[b] || 0) + 1
    })
    const boothStats = booths
      .map(b => ({
        boothNo: b.boothNo,
        pollingStation: b.pollingStation || '',
        voterCount: b.voterCount || 0,
        responseCount: boothResponseCounts[String(b.boothNo)] || 0,
        rate: b.voterCount
          ? Math.min(100, Math.round((boothResponseCounts[String(b.boothNo)] || 0) / b.voterCount * 100))
          : 0,
      }))
      .sort((a, b) => b.responseCount - a.responseCount)

    // ── Coverage rate ──────────────────────────────────────────────────────
    const boothsWithResponses = new Set(
      responses.map(r => String(r.boothNo || '')).filter(Boolean)
    )
    const coverageRate = booths.length
      ? Math.round(boothsWithResponses.size / booths.length * 100)
      : 0

    // ── Per-agent stats ────────────────────────────────────────────────────
    const agentRespCounts = {}
    responses.forEach(r => {
      const k = String(r.agentId || r.agentName || r.agent || '')
      if (k) agentRespCounts[k] = (agentRespCounts[k] || 0) + 1
    })
    const agentStats = agents
      .map(a => ({
        name: a.name || '—',
        boothNo: a.boothNo || '—',
        status: a.status || '—',
        responseCount: agentRespCounts[String(a.id || a.name || '')] || 0,
      }))
      .sort((a, b) => b.responseCount - a.responseCount)

    // ── Issue / answer distribution from responses ─────────────────────────
    const valueCounts = {}
    responses.forEach(r => {
      const answers = r.answers || {}
      Object.values(answers).forEach(val => {
        const vals = Array.isArray(val) ? val : [val]
        vals.forEach(v => {
          if (v && typeof v === 'string' && v.trim() && v !== '—') {
            const k = v.trim()
            valueCounts[k] = (valueCounts[k] || 0) + 1
          }
        })
      })
    })
    const issueData = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    // ── Response status breakdown ──────────────────────────────────────────
    const submitted = totalResponses
    const pending   = Math.max(0, totalVoters - submitted)
    const responseStatusData = [
      { name: 'Submitted', value: submitted || 0, color: '#10B981' },
      { name: 'Pending',   value: pending   || 0, color: '#F59E0B' },
    ]

    // ── Recent activity feed ───────────────────────────────────────────────
    const recentActivity = [...responses]
      .filter(r => r.submittedAt || r.inserted_at)
      .sort((a, b) => new Date(b.submittedAt || b.inserted_at) - new Date(a.submittedAt || a.inserted_at))
      .slice(0, 10)
      .map(r => ({
        boothNo: r.boothNo || '?',
        agentName: r.agentName || r.agentId || r.agent || 'Agent',
        voterName: r.voterName || r.name || null,
        submittedAt: r.submittedAt || r.inserted_at,
      }))

    setStats({
      totalBooths: booths.length,
      totalVoters,
      totalAgents: agents.length,
      activeAgents,
      totalSurveys: surveys.length,
      activeSurveys,
      totalPhases: phases.length,
      totalResponses,
      todayResponses,
      yesterdayTotal,
      velocity,
      coverageRate,
      latestPhase,
      booths,
      agents,
      surveys,
      phases,
      assignments,
      responses,
      genderData,
      ageData,
      issueData,
      responseStatusData,
      boothStats,
      agentStats,
      recentActivity,
    })
    setSynced(new Date())
    setLoading(false)
  }

  useEffect(() => {
    loadStats()
    const channel = supabase.channel('dashboard_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' },      loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' },   loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' },       loadStats)
      .subscribe()
    const poll = setInterval(loadStats, 10000)
    const onVisible = () => { if (document.visibilityState === 'visible') loadStats() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { supabase.removeChannel(channel); clearInterval(poll); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  const syncLabel = synced
    ? `Synced ${synced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : 'Loading…'

  const phaseName = stats?.latestPhase?.name || 'No phase yet'

  return (
    <div className="-m-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="px-6 py-3 bg-white border-b border-[#E8ECF4] flex items-center gap-3 flex-wrap">
        <FilterBtn label="Phase" value={phaseName} />
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
          onClick={loadStats}>
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <RefreshCw size={12} />}
          {syncLabel}
        </div>
      </div>

      <div className="p-6 space-y-5" style={{ background: '#F0F3FA', minHeight: '100vh' }}>
        <KPIGrid stats={stats} />
        <ChartsRow1 stats={stats} />
        <TablesRow2 stats={stats} />
        <ChartsRow3 stats={stats} />
      </div>
    </div>
  )
}
