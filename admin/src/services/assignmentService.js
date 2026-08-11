import { supabase } from '../supabase/config'
import { readCache, writeCache } from '../utils/fsCache'

const COL = 'assignments'
const toDoc = row => ({ id: row.id, _createdAt: row.inserted_at, ...row.data })

async function fetchAll() {
  const { data, error } = await supabase.from(COL).select('*').order('inserted_at', { ascending: false })
  if (error) throw error
  return data.map(toDoc)
}

export function subscribeAssignments(cb, onError) {
  const cached = readCache(COL)
  if (cached) cb(cached)

  fetchAll().then(docs => { writeCache(COL, docs); cb(docs) }).catch(onError)

  const channel = supabase.channel(`${COL}_rt`)
    .on('postgres_changes', { event: '*', schema: 'public', table: COL }, () => {
      fetchAll().then(docs => { writeCache(COL, docs); cb(docs) }).catch(onError)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function createAssignment(data) {
  const now = new Date().toISOString().slice(0, 10)
  const { error } = await supabase.from(COL).insert({
    data: { ...data, createdAt: now, createdBy: data.createdBy || 'Admin' },
  })
  if (error) throw error
}

export async function deleteAssignment(id) {
  const { error } = await supabase.from(COL).delete().eq('id', id)
  if (error) throw error
}
