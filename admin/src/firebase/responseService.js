import { supabase } from '../supabase/config'

export async function deleteResponse(rawId) {
  const { error } = await supabase.from('responses').delete().eq('id', rawId)
  if (error) throw error
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const h = d.getHours(), m = d.getMinutes()
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  const period = h < 12 ? 'AM' : 'PM'
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`
}

// Build sequential RESP-XXXXXX id from row index (sorted by insertion time)
function fmtRespId(idx) {
  return `RESP-${String(idx + 1).padStart(6, '0')}`
}

export async function fetchResponsesData() {
  const [respRes, voterRes, agentRes, surveyRes, phaseRes, boothRes] = await Promise.all([
    supabase.from('responses').select('*').order('inserted_at', { ascending: true }),
    supabase.from('voters').select('id, boothNo, data').limit(50000),
    supabase.from('agents').select('*').order('inserted_at', { ascending: false }),
    supabase.from('surveys').select('*').order('inserted_at', { ascending: false }),
    supabase.from('phases').select('*').order('inserted_at', { ascending: false }),
    supabase.from('booths').select('*'),
  ])

  // Build lookup maps
  const voterMap = {}
  ;(voterRes.data || []).forEach(r => {
    voterMap[r.id] = {
      boothNo:    String(r.boothNo || ''),
      name:       r.data?.VOTER_NAME  || r.data?.name      || '',
      epicNo:     r.data?.EPIC_NO     || r.data?.voterId   || '',
      age:        r.data?.AGE         || r.data?.age        || '',
      gender:     r.data?.GENDER      || r.data?.gender     || '',
      mobile:     r.data?.MOBILE      || r.data?.mobile     || '',
    }
  })

  const surveyMap = {}
  ;(surveyRes.data || []).forEach(r => {
    surveyMap[r.id] = { id: r.id, name: r.data?.name || r.data?.title || 'Survey', questions: r.data?.questions || [] }
  })

  const phaseMap = {}
  const phases = (phaseRes.data || []).map(r => ({ id: r.id, ...r.data }))
  phases.forEach(p => { phaseMap[p.id] = p })

  // Map surveyId → phase (check both surveyId and surveyForms array)
  const surveyPhaseMap = {}
  phases.forEach(p => {
    if (p.surveyId) surveyPhaseMap[p.surveyId] = p
    ;(p.surveyForms || []).forEach(fid => { if (!surveyPhaseMap[fid]) surveyPhaseMap[fid] = p })
  })

  const boothMap = {}
  ;(boothRes.data || []).forEach(b => {
    boothMap[String(b.boothNo)] = b
  })

  // Map boothNo → agent (first active agent for that booth)
  const agentMap = {}
  ;(agentRes.data || []).forEach(r => {
    const d = r.data || {}
    const key = String(d.boothNo || '')
    if (key && !agentMap[key]) agentMap[key] = d.name || ''
  })

  const surveys = Object.values(surveyMap)
  const agents  = [...new Set(Object.values(agentMap))].sort()
  const booths  = (boothRes.data || []).sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
  const uniqueStations = [...new Set(booths.map(b => b.pollingStation).filter(Boolean))].sort()

  // Enrich responses
  const rawResp = respRes.data || []

  const responses = rawResp.map((row, idx) => {
    const d = row.data || {}
    const voter   = voterMap[d.voterId]   || {}
    const boothNo = String(d.boothNo || voter.boothNo || '')
    const booth   = boothMap[boothNo]     || {}
    const survey  = surveyMap[d.surveyId] || {}
    const phase   = phaseMap[d.phaseId] || surveyPhaseMap[d.surveyId] || null

    // Build answers array from answers object + survey questions
    const answersObj = d.answers || {}
    const answers = (survey.questions || []).length
      ? survey.questions.map(q => ({
          questionText: q.text || q.label || q.question || String(q.id),
          answer: Array.isArray(answersObj[q.id]) ? answersObj[q.id].join(', ') : (answersObj[q.id] ?? '—'),
        }))
      : Object.entries(answersObj).map(([k, v]) => ({ questionText: k, answer: String(v) }))

    return {
      id:           fmtRespId(idx),
      rawId:        row.id,
      epicNo:       voter.epicNo    || '—',
      voterName:    voter.name      || '—',
      age:          voter.age       || '',
      gender:       voter.gender    || '',
      mobile:       voter.mobile    || '',
      boothNo,
      boothNumber:  boothNo ? `Booth ${boothNo}` : '—',
      stationName:  booth.pollingStation || '—',
      agentName:    agentMap[boothNo]    || '—',
      phaseId:      phase?.id            || '',
      phaseName:    phase?.name          || '—',
      surveyId:     d.surveyId           || '',
      formName:     survey.name          || '—',
      submittedOn:  fmtDate(d.submittedAt),
      submittedDate: d.submittedAt       || '',
      answers,
    }
  })

  return { responses, phases, surveys, agents, booths, uniqueStations }
}
