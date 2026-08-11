import NetInfo from '@react-native-community/netinfo'
import { supabase } from '../supabase/config'
import { useStore } from '../store/useStore'

let unsubscribe = null
let syncing = false

// ── Survey data cache (5 min TTL) ─────────────────────────────────────────────
let _surveyCache = null
let _surveyCacheAt = 0
const SURVEY_TTL = 5 * 60 * 1000

export function invalidateSurveyCache() { _surveyCacheAt = 0 }

let realtimeChannel = null

export function startSyncListener() {
  if (unsubscribe) return
  unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      syncPending()
      syncPendingPolls()
    }
  })
}

export function stopSyncListener() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}

export function startRealtimeSync(boothNo) {
  if (realtimeChannel) return

  realtimeChannel = supabase
    .channel('cast-live')

    // Phase activated/changed by admin
    .on('postgres_changes', { event: '*', schema: 'public', table: 'phases' }, () => {
      invalidateSurveyCache()
      fetchActiveSurveyData(boothNo).then(res => {
        const { setActiveSurvey, setActivePhase } = useStore.getState()
        setActiveSurvey(res.activeSurvey)
        setActivePhase(res.activePhase)
      }).catch(() => {})
    })

    // Survey updated by admin
    .on('postgres_changes', { event: '*', schema: 'public', table: 'surveys' }, () => {
      invalidateSurveyCache()
      fetchActiveSurveyData(boothNo).then(res => {
        const { setActiveSurvey, setActivePhase } = useStore.getState()
        setActiveSurvey(res.activeSurvey)
        setActivePhase(res.activePhase)
      }).catch(() => {})
    })

    // Voters added/updated for this booth
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'voters',
      filter: `boothNo=eq.${boothNo}`,
    }, () => {
      fetchVotersForBooth(boothNo).then(voters => {
        useStore.getState().setVoters(voters)
      }).catch(() => {})
    })

    // Voting Day Poll activated/changed by admin
    .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => {
      fetchActivePoll(boothNo).then(poll => {
        useStore.getState().setActivePoll(poll)
      }).catch(() => {})
    })

    .subscribe()
}

export function stopRealtimeSync() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}

export async function syncPending() {
  if (syncing) return
  syncing = true
  try {
    const { pendingResponses, markSynced } = useStore.getState()
    const unsynced = pendingResponses.filter(r => !r.synced)
    for (const response of unsynced) {
      const { error } = await supabase.from('responses').upsert({
        id:   response.localId,
        data: response,
      })
      if (!error) await markSynced(response.voterId)
    }
  } catch (_) {}
  syncing = false
}

export async function syncPendingPolls() {
  try {
    const { pendingPollResponses, markPollSynced } = useStore.getState()
    const unsynced = pendingPollResponses.filter(r => !r.synced)
    for (const r of unsynced) {
      const { error } = await supabase.from('poll_responses').insert({
        pollId:     r.pollId,
        option:     r.option,
        boothNo:    r.boothNo,
        recordedAt: r.recordedAt,
      })
      if (!error) await markPollSynced(r.localId)
    }
  } catch (_) {}
}

export async function fetchActiveSurveyData(boothNo) {
  if (_surveyCache && Date.now() - _surveyCacheAt < SURVEY_TTL) {
    return _surveyCache
  }

  const [surveysRes, phasesRes] = await Promise.all([
    supabase.from('surveys').select('*').order('inserted_at', { ascending: false }),
    supabase.from('phases').select('*').order('inserted_at', { ascending: false }),
  ])

  const surveys = (surveysRes.data || []).map(r => ({ id: r.id, ...r.data }))
  const phases  = (phasesRes.data  || []).map(r => ({ id: r.id, ...r.data }))

  const activePhase  = phases.find(p => p.status === 'Active') || phases[0] || null
  const activeSurvey = activePhase
    ? surveys.find(s => s.id === activePhase.surveyId) || surveys[0] || null
    : surveys[0] || null

  _surveyCache = { activeSurvey, activePhase, phases, surveys }
  _surveyCacheAt = Date.now()
  return _surveyCache
}

export async function fetchActivePoll(boothNo) {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .order('inserted_at', { ascending: false })
  if (error) throw error
  const rows = (data || []).map(r => ({ id: r.id, ...r.data, inserted_at: r.inserted_at }))
  const active = rows.find(p => p.status === 'Active')
  if (!active) return null
  // If assignedBooths is empty/null → visible to all; otherwise check membership
  const assigned = active.assignedBooths
  if (!assigned || assigned.length === 0) return active
  return assigned.includes(String(boothNo)) ? active : null
}

export async function fetchVotersForBooth(boothNo) {
  const { data, error } = await supabase
    .from('voters')
    .select('*')
    .eq('boothNo', String(boothNo))
    .order('inserted_at', { ascending: true })

  if (error) throw error
  return (data || []).map(r => ({ ...r.data, id: r.id, boothNo: r.boothNo }))
}
