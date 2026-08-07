import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Upload, Download, Search, X, FileText, CheckCircle2,
  Edit2, Trash2, Settings2, ChevronDown, ChevronLeft, ChevronRight,
  Eye, EyeOff, ArrowUp, ArrowDown, ArrowUpDown, Users, Loader2,
  AlertCircle, Cloud,
} from 'lucide-react'
import {
  uploadVoterCSV, downloadVoterCSV,
  uploadBooths, fetchAllBooths,
  saveImportMeta, getImportMeta,
  clearBooths, deleteImportMeta,
} from '../firebase/voterService'
import {
  cacheVoters, loadCachedVoters,
  cacheImportMeta, loadCachedImportMeta,
  clearVoterCache,
} from '../utils/voterCache'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_HEADERS = [
  'EPIC_NO', 'VOTER_NAME', 'FATHER_NAME', 'HOUSE_NO', 'AGE',
  'GENDER', 'PART_NO', 'SL_NO', 'MOBILE', 'CASTE',
  'BOOTH_NO', 'POLLING_STATION', 'ADDRESS',
]
const HEADER_LABEL = {
  EPIC_NO: 'EPIC No', VOTER_NAME: 'Voter Name', FATHER_NAME: 'Father Name',
  HOUSE_NO: 'House No', AGE: 'Age', GENDER: 'Gender', PART_NO: 'Part No',
  SL_NO: 'Sl No', MOBILE: 'Mobile', CASTE: 'Caste', BOOTH_NO: 'Booth No',
  POLLING_STATION: 'Polling Station', ADDRESS: 'Address',
}
const hl = k => HEADER_LABEL[k] || k.replace(/_/g, ' ')

const PAGE_SIZE    = 25
const GENDER_COLOR = { Male: '#5B5CEB', Female: '#EC4899', Other: '#10B981' }
const GENDER_BG    = { Male: '#EEF2FF', Female: '#FDF2F8', Other: '#ECFDF5' }
const CASTE_COLOR  = { General: '#06B6D4', OBC: '#F59E0B', SC: '#8B5CF6', ST: '#10B981' }

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function normalizeKey(h) {
  return h.toUpperCase().trim().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')
}
function parseRow(line) {
  const result = []; let inQuote = false, cur = ''
  for (const c of line) {
    if (c === '"') inQuote = !inQuote
    else if (c === ',' && !inQuote) { result.push(cur.trim()); cur = '' }
    else cur += c
  }
  result.push(cur.trim()); return result
}
function parseCSV(text) {
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

// Detect which column holds booth numbers and polling station names.
// Booth column must have numeric values — skip any column whose values are school/place names.
function detectCols(headers, sampleRows = []) {
  // Station: prefers explicit POLLING_STATION, then any STATION/POLLING column
  const stationCol = headers.find(h => /^POLLING_STATION$/.test(h))
    || headers.find(h => /STATION|POLLING/.test(h))
    || 'POLLING_STATION'

  // Booth candidates: exclude name/station/location-like columns
  const boothCandidates = headers.filter(h =>
    /BOOTH_NO|PART_NO|WARD_NO/.test(h) ||
    (/BOOTH/.test(h) && !/NAME|STATION|LOCATION|ADDRESS/.test(h))
  )

  let boothCol = null
  if (sampleRows.length > 0) {
    // Prefer the candidate whose values are all numeric
    boothCol = boothCandidates.find(h => {
      const vals = sampleRows.slice(0, 30).map(v => String(v[h] || '').trim()).filter(Boolean)
      return vals.length > 0 && vals.every(v => /^\d+$/.test(v))
    })
  }
  boothCol = boothCol || boothCandidates[0] || 'BOOTH_NO'

  return { boothCol, stationCol }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <ArrowUpDown size={11} className="text-slate-300" />
  return sort.dir === 'asc'
    ? <ArrowUp size={11} style={{ color: '#5B5CEB' }} />
    : <ArrowDown size={11} style={{ color: '#5B5CEB' }} />
}

function CellContent({ col, val }) {
  if (val === undefined || val === null || val === '') return <span className="text-slate-300">—</span>
  const v = String(val)
  if (col === 'EPIC_NO')
    return <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{v}</span>
  if (col === 'VOTER_NAME')
    return <span className="text-slate-800 font-medium whitespace-nowrap">{v}</span>
  if (col === 'GENDER')
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ color: GENDER_COLOR[v], background: GENDER_BG[v] }}>{v}</span>
  if (col === 'BOOTH_NO' || col === 'BOOTH' || col === 'PART_NO')
    return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold border border-[#C7D2FE] text-[#5B5CEB]" style={{ background: '#EEF2FF' }}>{v}</span>
  if (col === 'CASTE' || col === 'CAST')
    return <span className="text-[11px] font-semibold" style={{ color: CASTE_COLOR[v] || '#64748B' }}>{v}</span>
  if (col === 'AGE')
    return <span className="text-slate-700 font-semibold">{v}</span>
  if (col === 'ADDRESS')
    return <span className="text-slate-400 text-[12px] block max-w-[200px] truncate" title={v}>{v}</span>
  return <span className="text-slate-600 whitespace-nowrap">{v}</span>
}

function CloudBanner({ status, fileName }) {
  if (status === 'idle') return null
  const cfg = {
    uploading: { bg: '#EEF2FF', border: '#C7D2FE', color: '#5B5CEB', icon: <Cloud size={14} className="animate-pulse" />, text: `Saving backup to cloud…` },
    done:      { bg: '#ECFDF5', border: '#A7F3D0', color: '#10B981', icon: <CheckCircle2 size={14} />, text: 'Cloud backup saved.' },
    error:     { bg: '#FEF9EC', border: '#FDE68A', color: '#D97706', icon: <AlertCircle size={14} />, text: 'Cloud backup failed — data still saved locally.' },
  }[status]
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-medium"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
      {cfg.icon}<span>{cfg.text}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Voters() {
  const fileInputRef = useRef(null)

  const [voters, setVoters]         = useState([])
  const [csvHeaders, setCsvHeaders] = useState(DEFAULT_HEADERS)
  const [hasFile, setHasFile]       = useState(false)
  const [importMeta, setImportMeta] = useState(null)

  // 'idle' | 'loading' | 'ready' | 'error'
  const [loadStatus,   setLoadStatus]   = useState('idle')
  // 'idle' | 'uploading' | 'done' | 'error'
  const [cloudStatus,  setCloudStatus]  = useState('idle')

  const [visibleCols, setVisibleCols] = useState(() => new Set(DEFAULT_HEADERS.filter(h => h !== 'ADDRESS')))
  const [showColPanel, setShowColPanel] = useState(false)

  const [search, setSearch]               = useState('')
  const [filterStation, setFilterStation] = useState('')
  const [filterBooth, setFilterBooth]     = useState('')
  const [sort, setSort]                   = useState({ col: '', dir: 'asc' })
  const [page, setPage]                   = useState(1)
  const [drawerVoter, setDrawerVoter]     = useState(null)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [clearing, setClearing]                 = useState(false)

  // ── On mount: restore from IndexedDB (instant, no network) ────
  useEffect(() => {
    const cachedMeta = loadCachedImportMeta()

    if (cachedMeta?.records && cachedMeta?.csvHeaders) {
      // We have metadata — show table immediately
      setImportMeta(cachedMeta)
      setCsvHeaders(cachedMeta.csvHeaders)
      setVisibleCols(new Set(cachedMeta.csvHeaders.filter(h => h !== 'ADDRESS')))
      setHasFile(true)
      setLoadStatus('loading')

      loadCachedVoters().then(cached => {
        if (cached.length > 0) {
          // IndexedDB hit — instant
          setVoters(cached)
          setLoadStatus('ready')
        } else if (cachedMeta.storageUrl) {
          // IndexedDB cleared (different browser/device) — download from Storage
          downloadVoterCSV(cachedMeta.storageUrl)
            .then(text => {
              const { voters: parsed } = parseCSV(text)
              setVoters(parsed)
              cacheVoters(parsed) // populate IndexedDB for next time
              setLoadStatus('ready')
            })
            .catch(() => setLoadStatus('error'))
        } else {
          // No local cache, no cloud backup → re-upload required
          setLoadStatus('idle')
          setHasFile(false)
        }
      })
    } else {
      // No local meta — check Firestore (first load on a new device)
      getImportMeta()
        .then(meta => {
          if (!meta?.storageUrl) return
          cacheImportMeta({ ...meta, csvHeaders: DEFAULT_HEADERS }) // best guess
          setImportMeta(meta)
          setHasFile(true)
          setLoadStatus('loading')
          return downloadVoterCSV(meta.storageUrl)
            .then(text => {
              const { headers, voters: parsed } = parseCSV(text)
              setVoters(parsed)
              setCsvHeaders(headers)
              setVisibleCols(new Set(headers.filter(h => h !== 'ADDRESS')))
              cacheVoters(parsed)
              cacheImportMeta({ ...meta, csvHeaders: headers })
              setLoadStatus('ready')
            })
        })
        .catch(() => {})
    }
  }, [])

  // ── CSV file upload handler ────
  const handleFileChange = useCallback(async e => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    // 1. Parse CSV
    const text = await file.text()
    const { headers, voters: parsed } = parseCSV(text)
    const { boothCol, stationCol } = detectCols(headers, parsed.slice(0, 50))

    // 2. Show table immediately
    setVoters(parsed)
    setCsvHeaders(headers)
    setVisibleCols(new Set(headers.filter(h => h !== 'ADDRESS')))
    setHasFile(true)
    setLoadStatus('ready')
    setCloudStatus('idle')
    setPage(1)
    setSearch(''); setFilterStation(''); setFilterBooth('')

    const boothSet   = new Set(parsed.map(v => v[boothCol]).filter(Boolean))
    const stationSet = new Set(parsed.map(v => v[stationCol]).filter(Boolean))
    const now = new Date()
    const meta = {
      name: file.name,
      importedOn: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      records: parsed.length,
      booths: boothSet.size,
      stations: stationSet.size,
      boothCol,
      stationCol,
      csvHeaders: headers,
    }
    setImportMeta(meta)

    // 3. Save to IndexedDB immediately — persistent, no network, fast
    cacheImportMeta(meta)
    cacheVoters(parsed) // ~0.5s for 30K rows, runs without blocking UI

    // 4. Cloud backup in background (optional but enables cross-device access)
    setCloudStatus('uploading')
    Promise.all([
      uploadVoterCSV(file),
      uploadBooths(parsed, boothCol, stationCol),
    ]).then(async ([storageUrl]) => {
      const fullMeta = { ...meta, storageUrl }
      await saveImportMeta(fullMeta)
      cacheImportMeta(fullMeta) // update local cache with storageUrl
      setImportMeta(fullMeta)
      setCloudStatus('done')
    }).catch(() => setCloudStatus('error'))
  }, [])

  // ── Detected column names from meta ────
  const { boothCol, stationCol } = useMemo(() => {
    if (importMeta?.boothCol) return { boothCol: importMeta.boothCol, stationCol: importMeta.stationCol }
    return detectCols(csvHeaders, voters.slice(0, 50))
  }, [importMeta, csvHeaders, voters])

  // ── Derived filter options (from in-memory voters) ────
  const allStations = useMemo(() =>
    [...new Set(voters.map(v => v[stationCol]))].filter(Boolean).sort()
  , [voters, stationCol])

  const allBooths = useMemo(() => {
    const base = filterStation ? voters.filter(v => v[stationCol] === filterStation) : voters
    return [...new Set(base.map(v => v[boothCol]))].filter(Boolean).sort((a, b) => Number(a) - Number(b))
  }, [voters, filterStation, boothCol, stationCol])

  // ── Filtered + sorted + paged ────
  const filtered = useMemo(() => {
    let data = voters
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(v => csvHeaders.some(h => String(v[h] ?? '').toLowerCase().includes(q)))
    }
    if (filterStation) data = data.filter(v => v[stationCol] === filterStation)
    if (filterBooth)   data = data.filter(v => v[boothCol]   === filterBooth)
    if (sort.col) {
      data = [...data].sort((a, b) => {
        const av = String(a[sort.col] ?? ''), bv = String(b[sort.col] ?? '')
        const an = Number(av), bn = Number(bv)
        if (!isNaN(an) && !isNaN(bn)) return sort.dir === 'asc' ? an - bn : bn - an
        return sort.dir === 'asc'
          ? av.localeCompare(bv, 'en', { sensitivity: 'base' })
          : bv.localeCompare(av, 'en', { sensitivity: 'base' })
      })
    }
    return data
  }, [voters, search, filterStation, filterBooth, sort, csvHeaders, boothCol, stationCol])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData   = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])
  const displayCols = csvHeaders.filter(h => visibleCols.has(h))

  const pageWindow = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3) return [1, 2, 3, 4, 5]
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [page - 2, page - 1, page, page + 1, page + 2]
  }, [page, totalPages])

  const handleClearAll = async () => {
    setClearing(true)
    try {
      // Clear local caches first (instant)
      await clearVoterCache()
      localStorage.removeItem('cast_booths_cache')
      // Clear Firestore data in background (best effort)
      await Promise.allSettled([clearBooths(), deleteImportMeta()])
    } finally {
      // Reset all UI state regardless of Firestore outcome
      setVoters([])
      setCsvHeaders(DEFAULT_HEADERS)
      setVisibleCols(new Set(DEFAULT_HEADERS.filter(h => h !== 'ADDRESS')))
      setHasFile(false)
      setImportMeta(null)
      setLoadStatus('idle')
      setCloudStatus('idle')
      setSearch(''); setFilterStation(''); setFilterBooth('')
      setPage(1)
      setClearing(false)
      setShowConfirmClear(false)
    }
  }

  const handleSort = col => {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })
    setPage(1)
  }
  const toggleCol = col => setVisibleCols(prev => {
    const next = new Set(prev)
    if (next.has(col)) { if (next.size > 1) next.delete(col) } else next.add(col)
    return next
  })
  const clearFilters = () => { setSearch(''); setFilterStation(''); setFilterBooth(''); setPage(1) }
  const hasActiveFilters = search || filterStation || filterBooth

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="-m-6 flex flex-col bg-[#F5F7FB]" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-[#E8ECF4] px-6 py-4 flex-shrink-0" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-800 font-bold text-xl">Voter Import</h1>
            <p className="text-slate-400 text-[13px] mt-0.5">Upload, view and manage official voter lists.</p>
          </div>
          <div className="flex items-center gap-2">
            {hasFile && (
              <>
                <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8ECF4] bg-white text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={() => setShowColPanel(p => !p)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[13px] font-medium transition-colors ${showColPanel ? 'border-[#5B5CEB] text-[#5B5CEB] bg-[#EEF2FF]' : 'border-[#E8ECF4] bg-white text-slate-600 hover:bg-slate-50'}`}>
                  <Settings2 size={14} /> Columns
                </button>
              </>
            )}
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}>
              <Upload size={14} /> {hasFile ? 'Re-import CSV' : 'Import CSV'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* Loading from IndexedDB */}
        {loadStatus === 'loading' && (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center">
              <Loader2 size={36} className="animate-spin mx-auto mb-4" style={{ color: '#5B5CEB' }} />
              <p className="text-slate-700 font-semibold text-[15px]">Restoring voter list…</p>
              <p className="text-slate-400 text-[13px] mt-1">Loading from local storage</p>
            </div>
          </div>
        )}

        {/* Download error */}
        {loadStatus === 'error' && (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="bg-white rounded-2xl border border-red-100 p-10 text-center max-w-sm">
              <AlertCircle size={32} className="mx-auto mb-3" style={{ color: '#EF4444' }} />
              <p className="text-slate-800 font-bold text-[15px] mb-1">Could not restore voter list</p>
              <p className="text-slate-400 text-[13px] mb-5">Please re-upload the CSV file.</p>
              <button onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold"
                style={{ background: '#5B5CEB' }}>
                <Upload size={14} /> Upload CSV File
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {loadStatus === 'idle' && !hasFile && (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#C7D2FE] p-14 text-center max-w-md w-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ width: 72, height: 72, background: '#EEF2FF' }}>
                <Users size={30} style={{ color: '#5B5CEB' }} />
              </div>
              {importMeta ? (
                <>
                  <h3 className="text-slate-800 font-bold text-[18px] mb-1">Previous import found</h3>
                  <p className="text-slate-500 text-[13px] mb-1">{importMeta.name}</p>
                  <p className="text-slate-400 text-[12px] mb-6">{importMeta.records?.toLocaleString()} voters · Re-upload to restore.</p>
                </>
              ) : (
                <>
                  <h3 className="text-slate-800 font-bold text-[18px] mb-2">No voter list uploaded</h3>
                  <p className="text-slate-400 text-[13px] leading-relaxed mb-7">
                    Upload an official voter CSV to begin managing voter records.
                  </p>
                </>
              )}
              <button onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}>
                <Upload size={16} /> Upload CSV File
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        {loadStatus === 'ready' && hasFile && (
          <>
            {/* File card */}
            <div className="bg-white rounded-2xl border border-[#E8ECF4] px-5 py-4 flex items-center gap-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
                <FileText size={18} style={{ color: '#5B5CEB' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-semibold text-[14px] truncate">{importMeta?.name || 'Imported File'}</p>
                <p className="text-slate-400 text-[12px] mt-0.5">Imported on {importMeta?.importedOn}</p>
              </div>
              <div className="flex items-center gap-8 text-center">
                {[
                  ['Records', voters.length.toLocaleString()],
                  ['Booths', (importMeta?.booths ?? allBooths.length).toString()],
                  ['Polling Stations', (importMeta?.stations ?? allStations.length).toString()],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-slate-800 font-bold text-[17px]">{val}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#ECFDF5' }}>
                  <CheckCircle2 size={13} style={{ color: '#10B981' }} />
                  <span className="text-[12px] font-semibold" style={{ color: '#10B981' }}>Ready</span>
                </div>
                <button
                  onClick={() => setShowConfirmClear(true)}
                  title="Delete all voter data"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-100 text-red-400 text-[12px] font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>

            {/* Cloud backup status */}
            <CloudBanner status={cloudStatus} />

            {/* Column panel */}
            {showColPanel && (
              <div className="bg-white rounded-2xl border border-[#E8ECF4] p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-700 font-semibold text-[13px]">Column Visibility</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setVisibleCols(new Set(csvHeaders))} className="text-[12px] font-medium" style={{ color: '#5B5CEB' }}>Show All</button>
                    <span className="text-slate-200">|</span>
                    <button onClick={() => setVisibleCols(new Set([csvHeaders[0]]))} className="text-[12px] font-medium text-slate-400 hover:text-slate-600">Hide All</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {csvHeaders.map(col => {
                    const on = visibleCols.has(col)
                    return (
                      <button key={col} onClick={() => toggleCol(col)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${on ? 'border-[#5B5CEB] text-[#5B5CEB] bg-[#EEF2FF]' : 'border-[#E8ECF4] text-slate-400 bg-white hover:bg-slate-50'}`}>
                        {on ? <Eye size={11} /> : <EyeOff size={11} />} {hl(col)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Search + Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative" style={{ minWidth: 260 }}>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search by any field…"
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-700 placeholder-slate-400 outline-none"
                  onFocus={e => e.target.style.borderColor = '#5B5CEB'}
                  onBlur={e => e.target.style.borderColor = '#E8ECF4'} />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="relative">
                <select value={filterStation} onChange={e => { setFilterStation(e.target.value); setFilterBooth(''); setPage(1) }}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-600 outline-none cursor-pointer" style={{ minWidth: 160 }}>
                  <option value="">Polling Station</option>
                  {allStations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select value={filterBooth} onChange={e => { setFilterBooth(e.target.value); setPage(1) }}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-600 outline-none cursor-pointer" style={{ minWidth: 140 }}>
                  <option value="">Booth Number</option>
                  {allBooths.map(b => <option key={b} value={b}>{/^\d+$/.test(b) ? `Booth ${b}` : b}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-slate-500 border border-[#E8ECF4] bg-white hover:bg-slate-50 transition-colors">
                  <X size={12} /> Clear filters
                </button>
              )}
              <span className="ml-auto text-slate-400 text-[12px] flex-shrink-0">
                {filtered.length.toLocaleString()} record{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                <table className="border-collapse" style={{ minWidth: `${(displayCols.length + 2) * 130}px`, width: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
                    <tr className="border-b border-[#E8ECF4]" style={{ background: '#F8FAFC' }}>
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold text-[11px] uppercase tracking-wider"
                        style={{ position: 'sticky', left: 0, zIndex: 31, background: '#F8FAFC', width: 48, minWidth: 48 }}>#</th>
                      {displayCols.map((col, ci) => (
                        <th key={col} onClick={() => handleSort(col)}
                          className="text-left px-4 py-3 text-slate-500 font-semibold text-[11px] uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                          style={ci === 0 ? { position: 'sticky', left: 48, zIndex: 31, background: '#F8FAFC' } : { background: '#F8FAFC' }}>
                          <div className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                            {hl(col)}<SortIcon col={col} sort={sort} />
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-slate-400 font-semibold text-[11px] uppercase tracking-wider text-right"
                        style={{ background: '#F8FAFC', minWidth: 96 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.length === 0 ? (
                      <tr><td colSpan={displayCols.length + 2} className="text-center py-16 text-slate-400 text-[13px]">No voters match your search or filters.</td></tr>
                    ) : pageData.map((voter, idx) => (
                      <tr key={voter._id} onClick={() => setDrawerVoter(voter)}
                        className="border-b border-slate-50 cursor-pointer"
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFD'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td className="px-4 py-3 text-slate-400 text-[11px]" style={{ position: 'sticky', left: 0, zIndex: 10, background: 'inherit' }}>
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        {displayCols.map((col, ci) => (
                          <td key={col} className="px-4 py-3"
                            style={ci === 0 ? { position: 'sticky', left: 48, zIndex: 10, background: 'inherit' } : {}}>
                            <CellContent col={col} val={voter[col]} />
                          </td>
                        ))}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setDrawerVoter(voter)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"><Eye size={14} /></button>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Edit2 size={14} /></button>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#E8ECF4]">
                <span className="text-slate-400 text-[12px]">
                  Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()} records
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1}
                    className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">«</button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={14} /></button>
                  {pageWindow.map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-lg text-[12px] font-medium transition-colors"
                      style={page === p ? { background: '#5B5CEB', color: '#fff' } : { color: '#64748B' }}
                      onMouseEnter={e => { if (page !== p) e.currentTarget.style.background = '#F1F5F9' }}
                      onMouseLeave={e => { if (page !== p) e.currentTarget.style.background = '' }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={14} /></button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                    className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">»</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Confirm Clear Modal ── */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}>
          <div className="bg-white rounded-2xl border border-[#E8ECF4] p-7 flex flex-col items-center text-center" style={{ width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#FEF2F2' }}>
              <Trash2 size={24} style={{ color: '#EF4444' }} />
            </div>
            <p className="text-slate-800 font-bold text-[17px] mb-1">Delete all voter data?</p>
            <p className="text-slate-500 text-[13px] leading-relaxed mb-1">
              This will permanently remove <strong>{voters.length.toLocaleString()} voters</strong>, all booth data, and the cloud backup.
            </p>
            <p className="text-slate-400 text-[12px] mb-6">You will need to re-import a CSV to restore the data.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowConfirmClear(false)} disabled={clearing}
                className="flex-1 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleClearAll} disabled={clearing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#EF4444,#F87171)' }}>
                {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {clearing ? 'Deleting…' : 'Yes, delete all'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voter Drawer */}
      {drawerVoter && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" style={{ backdropFilter: 'blur(1px)' }} onClick={() => setDrawerVoter(null)} />
          <div className="fixed right-0 top-16 bottom-0 bg-white border-l border-[#E8ECF4] z-50 flex flex-col"
            style={{ width: 380, boxShadow: '-4px 0 24px rgba(0,0,0,0.10)' }}>
            <div className="px-5 py-4 border-b border-[#E8ECF4] flex items-start justify-between flex-shrink-0">
              <div>
                <p className="text-slate-800 font-bold text-[15px]">{drawerVoter.VOTER_NAME || drawerVoter[csvHeaders[1]] || 'Voter Details'}</p>
                <p className="text-slate-400 text-[12px] mt-0.5 font-mono">{drawerVoter.EPIC_NO || drawerVoter[csvHeaders[0]]}</p>
              </div>
              <button onClick={() => setDrawerVoter(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-2">
                {csvHeaders.map(key => {
                  const val = drawerVoter[key]
                  if (val === undefined || val === null || val === '') return null
                  return (
                    <div key={key} className="flex items-start py-3 border-b border-slate-50 last:border-0 gap-3">
                      <span className="text-slate-400 text-[12px] w-40 flex-shrink-0 pt-0.5">{hl(key)}</span>
                      <span className="text-slate-700 text-[12px] font-medium flex-1 text-right break-words">{String(val)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[#E8ECF4] flex-shrink-0 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">
                <Edit2 size={14} /> Edit Voter
              </button>
              <button className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-red-100 text-red-400 text-[13px] font-medium hover:bg-red-50 hover:text-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
