import { supabase } from '../supabase/config'
import { readCache, writeCache } from '../utils/fsCache'

const COL = 'phases'
const toDoc = row => ({ id: row.id, _createdAt: row.inserted_at, ...row.data })

async function fetchAll() {
  const [{ data, error }, { data: respData }, { data: assignData }] = await Promise.all([
    supabase.from(COL).select('*').order('inserted_at', { ascending: false }),
    supabase.from('responses').select('id, data'),
    supabase.from('assignments').select('id, data'),
  ])
  if (error) throw error

  // Count responses per phaseId
  const respCountMap = {}
  ;(respData || []).forEach(r => {
    const pid = r.data?.phaseId
    if (!pid) return
    respCountMap[pid] = (respCountMap[pid] || 0) + 1
  })

  // Count assigned booths per phaseId from assignments table
  const boothCountMap = {}
  ;(assignData || []).forEach(a => {
    const pid = a.data?.phaseId
    if (!pid) return
    boothCountMap[pid] = (boothCountMap[pid] || 0) + (a.data?.boothCount || 0)
  })

  return data.map(row => ({
    ...toDoc(row),
    responses: respCountMap[row.id] || 0,
    booths:    boothCountMap[row.id] || 0,
  }))
}

export function subscribePhases(cb, onError) {
  const cached = readCache(COL)
  if (cached) cb(cached)

  fetchAll().then(docs => { writeCache(COL, docs); cb(docs) }).catch(onError)

  const refresh = () => fetchAll().then(docs => { writeCache(COL, docs); cb(docs) }).catch(onError)

  const channel = supabase.channel(`${COL}_rt`)
    .on('postgres_changes', { event: '*', schema: 'public', table: COL }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'responses' }, refresh)
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function createPhase(data) {
  const now = new Date().toISOString()
  const { error } = await supabase.from(COL).insert({
    data: {
      ...data,
      surveyForms: data.surveyForms || [],
      booths: data.booths || 0,
      agentsAssigned: data.agentsAssigned || 0,
      completedBooths: data.completedBooths || 0,
      pendingBooths: data.pendingBooths || 0,
      responses: data.responses || 0,
      createdAt: data.createdAt || now.slice(0, 10),
      timeline: data.timeline || [now.slice(0, 10), null, null, null, null, null],
    },
  })
  if (error) throw error
}

export async function updatePhase(id, data) {
  const { error } = await supabase.rpc('update_doc', { tbl: COL, doc_id: id, patch: data })
  if (error) throw error
}

export async function deletePhase(id) {
  const { error } = await supabase.from(COL).delete().eq('id', id)
  if (error) throw error
}
