import { useState, useEffect } from 'react'
import { ChevronDown, RefreshCw, Loader2 } from 'lucide-react'
import { supabase } from '../supabase/config'
import KPIGrid from '../components/dashboard/KPIGrid'
import ChartsRow1 from '../components/dashboard/ChartsRow1'
import TablesRow2 from '../components/dashboard/TablesRow2'
import ChartsRow3 from '../components/dashboard/ChartsRow3'
import BottomSection from '../components/dashboard/BottomSection'

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

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [synced, setSynced] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadStats() {
    const [boothsRes, voterRes, agentsRes, surveysRes, phasesRes, assignmentsRes] = await Promise.all([
      supabase.from('booths').select('boothNo, voterCount'),
      supabase.from('voter_imports').select('data').eq('id', 'latest').single(),
      supabase.from('agents').select('data, inserted_at').order('inserted_at', { ascending: false }),
      supabase.from('surveys').select('data, inserted_at').order('inserted_at', { ascending: false }),
      supabase.from('phases').select('data, inserted_at').order('inserted_at', { ascending: false }),
      supabase.from('assignments').select('data, inserted_at').order('inserted_at', { ascending: false }),
    ])

    const booths      = boothsRes.data || []
    const voterMeta   = voterRes.data?.data || null
    const agents      = (agentsRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at }))
    const surveys     = (surveysRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at }))
    const phases      = (phasesRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at }))
    const assignments = (assignmentsRes.data || []).map(r => ({ ...r.data, inserted_at: r.inserted_at }))

    const latestPhase   = phases[0] || null
    const activeAgents  = agents.filter(a => a.status === 'Active').length
    const activeSurveys = surveys.filter(s => s.status === 'Active').length

    setStats({
      totalBooths: booths.length,
      totalVoters: voterMeta?.records || 0,
      totalAgents: agents.length,
      activeAgents,
      totalSurveys: surveys.length,
      activeSurveys,
      totalPhases: phases.length,
      latestPhase,
      booths,
      agents,
      surveys,
      phases,
      assignments,
    })
    setSynced(new Date())
    setLoading(false)
  }

  useEffect(() => { loadStats() }, [])

  const syncLabel = synced
    ? `Synced at ${synced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : 'Loading…'

  const phaseName = stats?.latestPhase?.name || 'No phase yet'

  return (
    <div className="-m-6">
      <div className="px-6 py-3 bg-white border-b border-[#E8ECF4] flex items-center gap-3 flex-wrap">
        <FilterBtn label="Campaign" value="Election 2027" />
        <FilterBtn label="Phase" value={phaseName} />
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
          onClick={loadStats}>
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <RefreshCw size={12} />}
          {syncLabel}
        </div>
      </div>

      <div className="p-6 space-y-6 min-h-screen" style={{ background: '#F5F7FB' }}>
        <KPIGrid stats={stats} />
        <ChartsRow1 stats={stats} />
        <TablesRow2 stats={stats} />
        <ChartsRow3 />
        <BottomSection stats={stats} />
      </div>
    </div>
  )
}
