import NetInfo from '@react-native-community/netinfo'
import { supabase } from '../supabase/config'
import { useStore } from '../store/useStore'

let unsubscribe = null
let syncing = false

export function startSyncListener() {
  if (unsubscribe) return
  unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      syncPending()
    }
  })
}

export function stopSyncListener() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}

async function syncPending() {
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

export async function fetchActiveSurveyData(boothNo) {
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

  return { activeSurvey, activePhase, phases, surveys }
}

export async function fetchVotersForBooth(boothNo) {
  const { data, error } = await supabase
    .from('voters')
    .select('*')
    .eq('boothNo', String(boothNo))
    .order('inserted_at', { ascending: true })

  if (error) throw error
  return (data || []).map(r => ({ id: r.id, ...r.data }))
}
