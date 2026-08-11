import { supabase } from '../supabase/config'
import { readCache, writeCache } from '../utils/fsCache'

const CHUNK_SIZE = 400

// ── Booths ────────────────────────────────────────────────────────────────────

export async function clearBooths() {
  const { data } = await supabase.from('booths').select('boothNo')
  if (!data?.length) return
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const { error } = await supabase.from('booths').delete()
      .in('boothNo', data.slice(i, i + CHUNK_SIZE).map(b => b.boothNo))
    if (error) throw error
  }
}

export async function uploadBooths(voters, boothCol = 'BOOTH_NO', stationCol = 'POLLING_STATION') {
  const boothMap = {}
  voters.forEach(v => {
    const key = String(v[boothCol] || '').trim()
    if (!key) return
    if (!boothMap[key]) {
      boothMap[key] = { boothNo: key, pollingStation: v[stationCol] || '', voterCount: 0 }
    }
    boothMap[key].voterCount++
  })

  const entries = Object.values(boothMap)
  const newKeys = new Set(entries.map(b => b.boothNo))

  // Upsert all new booths
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const { error } = await supabase.from('booths')
      .upsert(entries.slice(i, i + CHUNK_SIZE), { onConflict: 'boothNo' })
    if (error) throw error
  }

  // Delete stale booths no longer in the new CSV
  const { data: existing } = await supabase.from('booths').select('boothNo')
  const stale = (existing || []).filter(b => !newKeys.has(b.boothNo)).map(b => b.boothNo)
  for (let i = 0; i < stale.length; i += CHUNK_SIZE) {
    const { error } = await supabase.from('booths').delete().in('boothNo', stale.slice(i, i + CHUNK_SIZE))
    if (error) throw error
  }

  writeCache('booths', entries.sort((a, b) => Number(a.boothNo) - Number(b.boothNo)))
}

export async function fetchAllBooths(onRefresh) {
  const cached = readCache('booths')
  if (cached) {
    supabase.from('booths').select('*').limit(2000).then(({ data }) => {
      if (data) {
        const sorted = data.sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
        writeCache('booths', sorted)
        onRefresh?.(sorted)
      }
    }).catch(() => {})
    return cached
  }
  const { data, error } = await supabase.from('booths').select('*').limit(2000)
  if (error) throw error
  const sorted = data.sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
  writeCache('booths', sorted)
  return sorted
}

// ── Voters ────────────────────────────────────────────────────────────────────

function normalizeVoter(row, boothCol) {
  return {
    boothNo: String(row[boothCol] || '').trim(),
    data: {
      name:              row.VOTER_NAME          || row.NAME        || '',
      voterId:           row.EPIC_NO             || row.VOTER_ID    || '',
      age:               row.AGE                 || '',
      gender:            row.GENDER              || '',
      houseNo:           row.HOUSE_NO            || '',
      mobile:            row.MOBILE              || '',
      fatherName:        row.FATHER_NAME         || '',
      husbandName:       row.HUSBAND_NAME        || '',
      motherName:        row.MOTHER_NAME         || '',
      otherRelationName: row.OTHER_RELATION_NAME || '',
      address:           row.ADDRESS             || '',
      caste:             row.CASTE               || '',
      slNo:              row.SL_NO               || row.PART_SL_NO || '',
    },
  }
}

export async function clearVoters() {
  const { error } = await supabase.from('voters').delete().neq('boothNo', '')
  if (error) throw error
}

export async function uploadVoters(rawVoters, boothCol = 'BOOTH_NO') {
  // Delete all existing voters first
  await supabase.from('voters').delete().neq('boothNo', '')

  const rows = rawVoters
    .map(v => normalizeVoter(v, boothCol))
    .filter(v => v.boothNo)

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { error } = await supabase.from('voters').insert(rows.slice(i, i + CHUNK_SIZE))
    if (error) throw error
  }
}

// ── Import metadata ───────────────────────────────────────────────────────────

export async function saveImportMeta(meta) {
  const { error } = await supabase.from('voter_imports').upsert({ id: 'latest', data: meta })
  if (error) throw error
}

export async function getImportMeta() {
  const { data } = await supabase.from('voter_imports').select('data').eq('id', 'latest').single()
  return data?.data || null
}

export async function deleteImportMeta() {
  const { error } = await supabase.from('voter_imports').delete().eq('id', 'latest')
  if (error) throw error
}
