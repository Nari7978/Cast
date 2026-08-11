import { supabase } from '../supabase/config'

// ── Polls ──────────────────────────────────────────────────────────────────────

export async function fetchPolls() {
  const { data, error } = await supabase.from('polls').select('*').order('inserted_at', { ascending: false })
  if (error) throw error
  return (data || []).map(r => ({ id: r.id, ...r.data, inserted_at: r.inserted_at }))
}

export async function createPoll(pollData) {
  const { error } = await supabase.from('polls').insert({ data: pollData })
  if (error) throw error
}

export async function updatePoll(id, pollData) {
  const { error } = await supabase.from('polls').update({ data: pollData }).eq('id', id)
  if (error) throw error
}

export async function deletePoll(id) {
  const { error } = await supabase.from('polls').delete().eq('id', id)
  if (error) throw error
}

export async function setActivePoll(id) {
  // Deactivate all, then activate this one
  const { data: all } = await supabase.from('polls').select('id, data')
  if (all) {
    for (const row of all) {
      const updated = { ...row.data, status: row.id === id ? 'Active' : 'Inactive' }
      await supabase.from('polls').update({ data: updated }).eq('id', row.id)
    }
  }
}

export async function deactivateAllPolls() {
  const { data: all } = await supabase.from('polls').select('id, data')
  if (all) {
    for (const row of all) {
      await supabase.from('polls').update({ data: { ...row.data, status: 'Inactive' } }).eq('id', row.id)
    }
  }
}

// ── Poll Responses ─────────────────────────────────────────────────────────────

export async function fetchPollResponses(pollId) {
  const { data, error } = await supabase
    .from('poll_responses')
    .select('*')
    .eq('pollId', pollId)
    .order('recordedAt', { ascending: false })
  if (error) throw error
  return data || []
}

export async function clearPollResponses(pollId) {
  const { error } = await supabase.from('poll_responses').delete().eq('pollId', pollId)
  if (error) throw error
}
