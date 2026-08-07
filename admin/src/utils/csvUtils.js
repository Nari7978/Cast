// Shared CSV parsing utilities used by Voters page and voterService recovery.

export function normalizeKey(h) {
  return h.toUpperCase().trim().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')
}

export function parseRow(line) {
  const result = []; let inQuote = false, cur = ''
  for (const c of line) {
    if (c === '"') inQuote = !inQuote
    else if (c === ',' && !inQuote) { result.push(cur.trim()); cur = '' }
    else cur += c
  }
  result.push(cur.trim()); return result
}

export function parseCSV(text) {
  const DEFAULT_HEADERS = [
    'EPIC_NO', 'VOTER_NAME', 'FATHER_NAME', 'HOUSE_NO', 'AGE',
    'GENDER', 'PART_NO', 'SL_NO', 'MOBILE', 'CASTE',
    'BOOTH_NO', 'POLLING_STATION', 'ADDRESS',
  ]
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: DEFAULT_HEADERS, voters: [] }
  const rawHeaders = parseRow(lines[0]).map(normalizeKey)
  const voters = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i])
    if (!cols.some(c => c)) continue
    const voter = { _id: i }
    rawHeaders.forEach((h, idx) => { voter[h] = cols[idx] || '' })
    voters.push(voter)
  }
  return { headers: rawHeaders, voters }
}

export function detectCols(headers, sampleRows = []) {
  const stationCol = headers.find(h => /^POLLING_STATION$/.test(h))
    || headers.find(h => /STATION|POLLING/.test(h))
    || 'POLLING_STATION'

  const boothCandidates = headers.filter(h =>
    /BOOTH_NO|PART_NO|WARD_NO/.test(h) ||
    (/BOOTH/.test(h) && !/NAME|STATION|LOCATION|ADDRESS/.test(h))
  )

  let boothCol = null
  if (sampleRows.length > 0) {
    boothCol = boothCandidates.find(h => {
      const vals = sampleRows.slice(0, 30).map(v => String(v[h] || '').trim()).filter(Boolean)
      return vals.length > 0 && vals.every(v => /^\d+$/.test(v))
    })
  }
  boothCol = boothCol || boothCandidates[0] || 'BOOTH_NO'

  return { boothCol, stationCol }
}
