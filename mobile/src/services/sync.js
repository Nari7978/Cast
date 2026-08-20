import NetInfo from '@react-native-community/netinfo'
import { supabase } from '../supabase/config'
import { useStore } from '../store/useStore'

let unsubscribe = null
let syncing = false
let pollSyncing = false

// ── Survey data cache (5 min TTL) ─────────────────────────────────────────────
let _surveyCache = null
let _surveyCacheAt = 0
const SURVEY_TTL = 5 * 60 * 1000

export function invalidateSurveyCache() { _surveyCacheAt = 0 }

// ── Voter cache (5 min TTL per booth) ─────────────────────────────────────────
const _voterCache = {}
const _voterCacheAt = {}
const VOTER_TTL = 5 * 60 * 1000

export function invalidateVoterCache(boothNo) {
  if (boothNo) delete _voterCache[boothNo]
  else Object.keys(_voterCache).forEach(k => delete _voterCache[k])
}

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
  // Tear down any existing (possibly dead) channel before resubscribing
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

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

    // Assignment created/changed by admin (new survey deployed to booths)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
      invalidateSurveyCache()
      fetchActiveSurveyData(boothNo).then(res => {
        const { setActiveSurvey, setActivePhase } = useStore.getState()
        setActiveSurvey(res.activeSurvey)
        setActivePhase(res.activePhase)
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
      if (!error) await markSynced(response.localId)
    }
  } catch (_) {}
  syncing = false
}

// Remove local responses that were deleted from the server (e.g. admin deleted a survey)
export async function reconcileResponses() {
  const { pendingResponses, removeResponses } = useStore.getState()
  const synced = pendingResponses.filter(r => r.synced && r.localId)
  if (synced.length === 0) return
  try {
    const ids = synced.map(r => r.localId)
    const { data } = await supabase.from('responses').select('id').in('id', ids)
    const existing = new Set((data || []).map(r => r.id))
    const deletedIds = ids.filter(id => !existing.has(id))
    if (deletedIds.length > 0) await removeResponses(deletedIds)
  } catch (_) {}
}

export async function syncPendingPolls() {
  if (pollSyncing) return
  pollSyncing = true
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
  pollSyncing = false
}

export async function fetchActiveSurveyData(boothNo) {
  if (_surveyCache && Date.now() - _surveyCacheAt < SURVEY_TTL) {
    return _surveyCache
  }

  const [surveysRes, phasesRes, assignmentsRes] = await Promise.all([
    supabase.from('surveys').select('*').order('inserted_at', { ascending: false }),
    supabase.from('phases').select('*').order('inserted_at', { ascending: false }),
    supabase.from('assignments').select('*').order('inserted_at', { ascending: false }),
  ])

  const surveys     = (surveysRes.data     || []).map(r => ({ id: r.id, ...r.data }))
  const phases      = (phasesRes.data      || []).map(r => ({ id: r.id, ...r.data }))
  const assignments = (assignmentsRes.data || []).map(r => ({ id: r.id, ...r.data }))

  const activePhase = phases.find(p => p.status === 'Active') || phases[0] || null

  let activeSurvey = null
  if (activePhase && boothNo) {
    // Precise: find an Active assignment for this phase that covers this booth
    const assignment = assignments.find(a =>
      a.phaseId === activePhase.id &&
      a.status === 'Active' &&
      Array.isArray(a.boothNos) &&
      a.boothNos.includes(String(boothNo))
    )
    if (assignment?.formId) {
      activeSurvey = surveys.find(s => s.id === assignment.formId) || null
    }
  }
  // Fallback chain: phase.surveyId → first surveyForm → first survey
  if (!activeSurvey && activePhase) {
    activeSurvey =
      surveys.find(s => s.id === activePhase.surveyId) ||
      (activePhase.surveyForms?.length ? surveys.find(s => s.id === activePhase.surveyForms[0]) : null) ||
      surveys[0] || null
  }
  if (!activeSurvey) activeSurvey = surveys[0] || null

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

export async function fetchVotersForBooth(boothNo, { force = false } = {}) {
  const key = String(boothNo)
  if (!force && _voterCache[key] && Date.now() - _voterCacheAt[key] < VOTER_TTL) {
    return _voterCache[key]
  }
  const { data, error } = await supabase
    .from('voters')
    .select('*')
    .eq('boothNo', key)
    .order('inserted_at', { ascending: true })

  if (error) throw error
  const result = (data || []).map(r => ({ ...r.data, id: r.id, boothNo: r.boothNo }))
  _voterCache[key] = result
  _voterCacheAt[key] = Date.now()
  return result
}
