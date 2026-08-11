import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase/config'
import {
  fetchPolls, createPoll, updatePoll, deletePoll,
  setActivePoll, deactivateAllPolls, fetchPollResponses, clearPollResponses,
} from '../firebase/pollService'
import { Vote, Plus, Trash2, Play, Square, RefreshCw, BarChart2, X, Radio, Download, Trophy, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#5B5CEB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

function pct(n, total) {
  return total === 0 ? 0 : Math.round((n / total) * 100)
}

// tally uses r.option (the DB column name)
function tallyResponses(responses, options) {
  const counts = {}
  options.forEach(o => { counts[o] = 0 })
  responses.forEach(r => {
    if (counts[r.option] !== undefined) counts[r.option]++
    else if (r.option) counts[r.option] = (counts[r.option] || 0) + 1
  })
  return counts
}

// ── 15-min response trend ─────────────────────────────────────────────────────

function buildTrend15(responses) {
  if (!responses || responses.length === 0) return []
  const buckets = {}
  responses.forEach(r => {
    const raw = r.submittedAt || r.submitted_at || r.inserted_at
    if (!raw) return
    const d = new Date(raw)
    if (isNaN(d)) return
    d.setSeconds(0, 0)
    d.setMinutes(Math.floor(d.getMinutes() / 15) * 15)
    const key = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    buckets[key] = (buckets[key] || 0) + 1
  })
  return Object.entries(buckets)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([time, count]) => ({ time, count }))
}

function ResponseTrend15({ responses, options }) {
  const trendData = buildTrend15(responses)
  const hasData   = trendData.length > 0
  const total     = responses.length

  // Also build per-option trend
  const optionTrendData = (() => {
    if (!hasData || !options?.length) return []
    const buckets = {}
    responses.forEach(r => {
      const raw = r.submittedAt || r.submitted_at || r.inserted_at
      if (!raw) return
      const d = new Date(raw)
      if (isNaN(d)) return
      d.setSeconds(0, 0)
      d.setMinutes(Math.floor(d.getMinutes() / 15) * 15)
      const key = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      if (!buckets[key]) { buckets[key] = { time: key }; options.forEach(o => { buckets[key][o] = 0 }) }
      const opt = r.option || r.answer || ''
      if (opt && buckets[key][opt] !== undefined) buckets[key][opt]++
    })
    return Object.values(buckets).sort((a, b) => a.time.localeCompare(b.time))
  })()

  const showOptionBreakdown = options?.length <= 4 && optionTrendData.length > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp size={11} /> Response Trend
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {hasData ? `${total} responses · 15-min intervals` : 'Waiting for responses…'}
          </p>
        </div>
        {hasData && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
            ● LIVE
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-36 text-gray-300">
          <p className="text-xs">No responses yet</p>
        </div>
      ) : showOptionBreakdown ? (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={optionTrendData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
            <defs>
              {options.map((o, i) => (
                <linearGradient key={o} id={`grad15-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1A1D2E', border: 'none', borderRadius: 8, fontSize: 11, color: '#fff' }}
              labelStyle={{ color: '#94A3B8', fontSize: 10 }}
            />
            {options.map((o, i) => (
              <Area key={o} type="monotone" dataKey={o}
                stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                fill={`url(#grad15-${i})`}
                dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="grad15-total" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5B5CEB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#5B5CEB" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1A1D2E', border: 'none', borderRadius: 8, fontSize: 11, color: '#fff' }}
              labelStyle={{ color: '#94A3B8', fontSize: 10 }}
              formatter={(v) => [v, 'Responses']}
            />
            <Area type="monotone" dataKey="count"
              stroke="#5B5CEB" strokeWidth={2.5}
              fill="url(#grad15-total)"
              dot={{ fill: '#5B5CEB', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#5B5CEB' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Legend for multi-option view */}
      {showOptionBreakdown && (
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {options.map((o, i) => (
            <div key={o} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-[10px] text-gray-500 font-medium">{o}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Create / Edit modal ───────────────────────────────────────────────────────

function PollModal({ initial, onClose, onSave }) {
  const [title,    setTitle]    = useState(initial?.title    || '')
  const [question, setQuestion] = useState(initial?.question || '')
  const [options,  setOptions]  = useState(initial?.options  || ['', ''])
  const [booths,   setBooths]   = useState([])
  const [assigned, setAssigned] = useState(initial?.assignedBooths || []) // [] = all booths
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  useEffect(() => {
    supabase.from('booths').select('*').order('inserted_at', { ascending: true })
      .then(({ data }) => {
        const list = (data || []).map(r => ({ id: r.id, ...r.data }))
        setBooths(list)
      })
  }, [])

  const toggleBooth = (no) => {
    const s = String(no)
    setAssigned(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const addOpt    = () => setOptions(o => [...o, ''])
  const removeOpt = (i) => setOptions(o => o.filter((_, idx) => idx !== i))
  const setOpt    = (i, v) => setOptions(o => o.map((x, idx) => idx === i ? v : x))

  const handleSave = async () => {
    const opts = options.map(o => o.trim()).filter(Boolean)
    if (!title.trim())    { setErr('Title is required'); return }
    if (!question.trim()) { setErr('Question is required'); return }
    if (opts.length < 2)  { setErr('At least 2 options required'); return }
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        question: question.trim(),
        options: opts,
        assignedBooths: assigned,
        status: initial?.status || 'Inactive',
      })
      onClose()
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">{initial ? 'Edit Poll' : 'Create Voting Day Poll'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Poll Title</label>
            <input className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Voting Day Opinion Poll" />
          </div>

          {/* Question */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Question</label>
            <input className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. Which party do you want to vote?" />
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</div>
                  <input className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    value={opt} onChange={e => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                  {options.length > 2 && (
                    <button onClick={() => removeOpt(i)} className="p-1 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 8 && (
              <button onClick={addOpt} className="mt-2 text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
                <Plus size={13} /> Add option
              </button>
            )}
          </div>

          {/* Booth assignment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assign to Booths</label>
              <button
                onClick={() => setAssigned([])}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  assigned.length === 0
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                All Booths
              </button>
            </div>
            {booths.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                {booths.map(b => {
                  const no = String(b.boothNo || b.number || b.no || b.name || b.id)
                  const sel = assigned.includes(no)
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleBooth(no)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        sel
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Booth {no}
                    </button>
                  )
                })}
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-1.5">
              {assigned.length === 0
                ? 'Poll visible to all booth agents'
                : `Poll visible to ${assigned.length} selected booth${assigned.length > 1 ? 's' : ''}`}
            </p>
          </div>

          {err && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
        </div>
        <div className="p-6 pt-0 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: '#5B5CEB' }}>
            {saving ? 'Saving…' : 'Save Poll'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Export CSV ────────────────────────────────────────────────────────────────

function exportCSV(poll, responses, options, counts, boothRanked, boothVoterMap) {
  const total = responses.length
  const rows = []

  rows.push([`Poll: ${poll.title}`])
  rows.push([`Question: ${poll.question}`])
  rows.push([`Total Responses: ${total}`])
  rows.push([`Exported: ${new Date().toLocaleString('en-IN')}`])
  rows.push([])

  // Overall
  rows.push(['OVERALL RESULTS'])
  rows.push(['Option', 'Count', 'Percentage'])
  options.forEach(opt => {
    const n = counts[opt] || 0
    rows.push([opt, n, `${pct(n, total)}%`])
  })
  rows.push([])

  // Booth ranking with voter coverage
  rows.push(['BOOTH PERFORMANCE RANKING'])
  rows.push(['Rank', 'Booth', ...options, 'Responses', 'Total Voters', 'Coverage %'])
  boothRanked.forEach((entry, idx) => {
    const boothTotal   = Object.values(entry.tally).reduce((s, n) => s + n, 0)
    const voterCount   = boothVoterMap?.[String(entry.booth)] ?? ''
    const coveragePct  = voterCount ? `${Math.round((boothTotal / voterCount) * 100)}%` : '—'
    rows.push([`#${idx + 1}`, `Booth ${entry.booth}`, ...options.map(o => entry.tally[o] || 0), boothTotal, voterCount, coveragePct])
  })

  const csv = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${poll.title.replace(/\s+/g, '_')}_results_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const RANK_MEDAL = { 0: '🥇', 1: '🥈', 2: '🥉' }

// ── Results panel ─────────────────────────────────────────────────────────────

function ResultsPanel({ poll, responses, boothVoterMap = {}, onClear, onRefresh, refreshing }) {
  const options = poll.options || []
  const counts  = tallyResponses(responses, options)
  const total   = responses.length

  // Group by booth
  const byBooth = {}
  responses.forEach(r => {
    const b = r.boothNo || '—'
    if (!byBooth[b]) byBooth[b] = {}
    const opt = r.option || r.answer || ''
    byBooth[b][opt] = (byBooth[b][opt] || 0) + 1
  })

  // Sorted high → low by total responses (for ranking table)
  const boothRanked = Object.entries(byBooth)
    .map(([booth, tally]) => ({
      booth,
      tally,
      total: Object.values(tally).reduce((s, n) => s + n, 0),
    }))
    .sort((a, b) => b.total - a.total)

  // Also sorted by booth number (for raw breakdown table)
  const boothEntries = Object.entries(byBooth).sort((a, b) => Number(a[0]) - Number(b[0]))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{poll.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{total} total responses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(poll, responses, options, counts, boothRanked, boothVoterMap)}
            title="Export to CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50 transition-colors">
            <Download size={13} /> Export
          </button>
          <button onClick={onRefresh} disabled={refreshing}
            className="p-2 rounded-xl border text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={onClear}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold text-red-500 hover:bg-red-50">
            Clear
          </button>
        </div>
      </div>

      {/* Overall tally */}
      <div className="p-5 space-y-3 border-b">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Overall Results</p>
        {options.map((opt, i) => {
          const n = counts[opt] || 0
          const p = pct(n, total)
          return (
            <div key={opt}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-800">{opt}</span>
                <span className="font-bold tabular-nums" style={{ color: COLORS[i % COLORS.length] }}>
                  {n} <span className="text-gray-400 font-normal">({p}%)</span>
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${p}%`, background: COLORS[i % COLORS.length] }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Booth performance ranking */}
      <div className="p-5 border-b">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Trophy size={11} /> Booth Performance Ranking
        </p>
        {boothRanked.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No responses yet</p>
        ) : (
          <div className="space-y-2">
            {boothRanked.map((entry, idx) => {
              const voterCount   = boothVoterMap[String(entry.booth)]
              const coverage     = voterCount ? Math.round((entry.total / voterCount) * 100) : null
              const leadingOpt   = options.reduce((best, o) =>
                (entry.tally[o] || 0) > (entry.tally[best] || 0) ? o : best, options[0])
              const leadingColor = COLORS[options.indexOf(leadingOpt) % COLORS.length]
              const lagColor     = coverage === null ? '#94A3B8'
                                 : coverage >= 70   ? '#10B981'
                                 : coverage >= 40   ? '#F59E0B'
                                 :                    '#EF4444'
              return (
                <div key={entry.booth}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: idx === 0 ? '#FFFBEB' : idx === 1 ? '#F8FAFF' : idx === 2 ? '#FFF7F1' : '#F9FAFB' }}>
                  {/* Rank */}
                  <div className="w-7 text-center flex-shrink-0">
                    {idx < 3
                      ? <span className="text-base">{RANK_MEDAL[idx]}</span>
                      : <span className="text-xs font-black text-gray-400">#{idx + 1}</span>
                    }
                  </div>
                  {/* Booth name + leading option */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">Booth {entry.booth}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Leading: <span style={{ color: leadingColor }} className="font-semibold">{leadingOpt}</span>
                      {' · '}{options.map(o => `${o}: ${entry.tally[o] || 0}`).join('  ')}
                    </p>
                  </div>
                  {/* Coverage bar */}
                  <div className="w-36 flex-shrink-0">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="font-bold tabular-nums" style={{ color: lagColor }}>
                        {entry.total}{voterCount ? ` / ${voterCount}` : ''} voters
                      </span>
                      {coverage !== null && (
                        <span className="font-black text-[10px]" style={{ color: lagColor }}>{coverage}%</span>
                      )}
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${coverage ?? 0}%`, background: lagColor }} />
                    </div>
                    {coverage !== null && coverage < 40 && (
                      <p className="text-[9px] font-bold mt-0.5" style={{ color: '#EF4444' }}>⚠ Lagging</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Booth-wise raw breakdown */}
      <div className="p-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Booth-wise Breakdown</p>
        {boothEntries.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No responses yet</p>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {/* Header row */}
            <div className="grid text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 border-b sticky top-0 bg-white"
              style={{ gridTemplateColumns: `80px repeat(${options.length}, 1fr) 50px 90px` }}>
              <span>Booth</span>
              {options.map((o, i) => (
                <span key={o} style={{ color: COLORS[i % COLORS.length] }} className="text-center">{o}</span>
              ))}
              <span className="text-right">Total</span>
              <span className="text-right">Coverage</span>
            </div>

            {boothEntries.map(([booth, tally]) => {
              const boothTotal  = Object.values(tally).reduce((s, n) => s + n, 0)
              const voterCount  = boothVoterMap[String(booth)]
              const coverage    = voterCount ? Math.round((boothTotal / voterCount) * 100) : null
              const coverageColor = coverage === null ? '#94A3B8'
                                  : coverage >= 70   ? '#10B981'
                                  : coverage >= 40   ? '#F59E0B'
                                  :                    '#EF4444'
              return (
                <div key={booth}
                  className="grid items-center py-2.5 border-b border-gray-50 last:border-0"
                  style={{ gridTemplateColumns: `80px repeat(${options.length}, 1fr) 50px 90px` }}>
                  <span className="text-xs font-bold text-gray-700">Booth {booth}</span>
                  {options.map((opt, i) => {
                    const n = tally[opt] || 0
                    return (
                      <span key={opt} className="text-center text-sm font-bold tabular-nums"
                        style={{ color: n > 0 ? COLORS[i % COLORS.length] : '#CBD5E1' }}>
                        {n}
                      </span>
                    )
                  })}
                  <span className="text-right text-xs font-bold text-gray-500">{boothTotal}</span>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: coverageColor }}>
                      {coverage !== null ? `${coverage}%` : '—'}
                    </span>
                    {voterCount && (
                      <span className="text-[9px] text-gray-400">{boothTotal}/{voterCount}</span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Total row */}
            <div className="grid items-center pt-2.5 mt-1 border-t-2 border-gray-200"
              style={{ gridTemplateColumns: `80px repeat(${options.length}, 1fr) 50px 90px` }}>
              <span className="text-xs font-bold text-gray-900">TOTAL</span>
              {options.map((opt, i) => (
                <span key={opt} className="text-center text-sm font-black tabular-nums"
                  style={{ color: COLORS[i % COLORS.length] }}>
                  {counts[opt] || 0}
                </span>
              ))}
              <span className="text-right text-xs font-black text-gray-900">{total}</span>
              <span className="text-right text-[10px] font-bold text-gray-500">
                {Object.keys(boothVoterMap).length > 0
                  ? `${Math.round((total / Object.values(boothVoterMap).reduce((s, v) => s + v, 0)) * 100)}%`
                  : '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VotingDayPoll() {
  const [polls,          setPolls]          = useState([])
  const [responses,      setResponses]      = useState({})
  const [loading,        setLoading]        = useState(true)
  const [modal,          setModal]          = useState(null)
  const [activePoll,     setActivePollState] = useState(null)
  const [refreshing,     setRefreshing]     = useState({})
  const [boothVoterMap,  setBoothVoterMap]  = useState({})
  const channelRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const [ps, boothsRes] = await Promise.all([
        fetchPolls(),
        supabase.from('booths').select('boothNo, voterCount'),
      ])
      setPolls(ps)
      const bvMap = {}
      ;(boothsRes.data || []).forEach(b => {
        if (b.boothNo != null) bvMap[String(b.boothNo)] = b.voterCount || 0
      })
      setBoothVoterMap(bvMap)
      const active = ps.find(p => p.status === 'Active') || null
      setActivePollState(active)
      if (active) {
        const res = await fetchPollResponses(active.id)
        setResponses(prev => ({ ...prev, [active.id]: res }))
      }
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    load()
    channelRef.current = supabase
      .channel('poll-admin-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poll_responses' }, payload => {
        const r = payload.new
        setResponses(prev => ({
          ...prev,
          [r.pollId]: [r, ...(prev[r.pollId] || [])],
        }))
      })
      .subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  const handleCreate     = async (data) => { await createPoll(data); await load() }
  const handleUpdate     = async (data) => { await updatePoll(modal.id, data); await load() }
  const handleDelete     = async (poll) => {
    if (!confirm(`Delete "${poll.title}"?`)) return
    await deletePoll(poll.id); await load()
  }
  const handleActivate   = async (poll) => {
    await setActivePoll(poll.id)
    const res = await fetchPollResponses(poll.id)
    setResponses(prev => ({ ...prev, [poll.id]: res }))
    await load()
  }
  const handleDeactivate = async () => { await deactivateAllPolls(); await load() }
  const handleClear      = async (pollId) => {
    if (!confirm('Clear all responses for this poll?')) return
    await clearPollResponses(pollId)
    setResponses(prev => ({ ...prev, [pollId]: [] }))
  }
  const handleRefresh    = async (pollId) => {
    setRefreshing(r => ({ ...r, [pollId]: true }))
    const res = await fetchPollResponses(pollId)
    setResponses(prev => ({ ...prev, [pollId]: res }))
    setRefreshing(r => ({ ...r, [pollId]: false }))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Radio size={22} style={{ color: '#5B5CEB' }} /> Voting Day Poll
          </h1>
          <p className="text-sm text-gray-500 mt-1">Assign live tally questions to booth agents — no voter list needed</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: '#5B5CEB' }}
        >
          <Plus size={16} /> Create Poll
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: poll list */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Polls</h2>
            {polls.length === 0 && (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <Radio size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No polls yet. Create one to get started.</p>
              </div>
            )}
            {activePoll && (
              <ResponseTrend15
                responses={responses[activePoll.id] || []}
                options={activePoll.options || []}
              />
            )}

            {polls.map(poll => {
              const isActive = poll.status === 'Active'
              const boothLabel = !poll.assignedBooths?.length
                ? 'All Booths'
                : `Booths: ${poll.assignedBooths.join(', ')}`
              return (
                <div key={poll.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${isActive ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {isActive ? '● LIVE' : 'Inactive'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{boothLabel}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate">{poll.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{poll.question}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(poll.options || []).map((opt, i) => (
                      <span key={opt} className="text-[11px] px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ background: COLORS[i % COLORS.length] }}>{opt}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    {isActive ? (
                      <button onClick={handleDeactivate}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100">
                        <Square size={12} /> Stop
                      </button>
                    ) : (
                      <button onClick={() => handleActivate(poll)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                        style={{ background: '#5B5CEB' }}>
                        <Play size={12} /> Go Live
                      </button>
                    )}
                    <button onClick={() => setModal(poll)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(poll)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-100 hover:bg-red-50 ml-auto">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right: live results */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <BarChart2 size={13} /> Live Results
            </h2>
            {activePoll ? (
              <ResultsPanel
                poll={activePoll}
                responses={responses[activePoll.id] || []}
                boothVoterMap={boothVoterMap}
                onClear={() => handleClear(activePoll.id)}
                onRefresh={() => handleRefresh(activePoll.id)}
                refreshing={refreshing[activePoll.id] || false}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
                <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Activate a poll to see live booth-wise results here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <PollModal
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={modal === 'create' ? handleCreate : handleUpdate}
        />
      )}
    </div>
  )
}
