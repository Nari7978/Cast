import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Upload, Download, Search, X, FileText, CheckCircle2,
  Edit2, Trash2, Settings2, ChevronDown, ChevronLeft, ChevronRight,
  Eye, EyeOff, ArrowUp, ArrowDown, ArrowUpDown, Users, Cloud, Loader2,
  AlertCircle, RefreshCw,
} from 'lucide-react'
import {
  uploadVoters, uploadBooths, saveImportMeta, getImportMeta,
  fetchVotersPage, fetchAllBooths,
} from '../firebase/voterService'

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
const FS_FILTER_LIMIT = 500  // max voters to load when a booth/station filter is active
const GENDER_COLOR = { Male: '#5B5CEB', Female: '#EC4899', Other: '#10B981' }
const GENDER_BG    = { Male: '#EEF2FF', Female: '#FDF2F8', Other: '#ECFDF5' }
const CASTE_COLOR  = { General: '#06B6D4', OBC: '#F59E0B', SC: '#8B5CF6', ST: '#10B981' }

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function normalizeKey(h) {
  return h.toUpperCase().trim().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')
}

function parseRow(line) {
  const result = []
  let inQuote = false, cur = ''
  for (const c of line) {
    if (c === '"') { inQuote = !inQuote }
    else if (c === ',' && !inQuote) { result.push(cur.trim()); cur = '' }
    else { cur += c }
  }
  result.push(cur.trim())
  return result
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
  if (col === 'BOOTH_NO')
    return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold border border-[#C7D2FE] text-[#5B5CEB]" style={{ background: '#EEF2FF' }}>{v}</span>
  if (col === 'CASTE')
    return <span className="text-[11px] font-semibold" style={{ color: CASTE_COLOR[v] || '#64748B' }}>{v}</span>
  if (col === 'AGE')
    return <span className="text-slate-700 font-semibold">{v}</span>
  if (col === 'ADDRESS')
    return <span className="text-slate-400 text-[12px] block max-w-[200px] truncate" title={v}>{v}</span>
  return <span className="text-slate-600 whitespace-nowrap">{v}</span>
}

function SyncBanner({ status, progress }) {
  if (status === 'idle') return null
  const configs = {
    syncing: {
      bg: '#EEF2FF', border: '#C7D2FE', icon: <Loader2 size={14} className="animate-spin" style={{ color: '#5B5CEB' }} />,
      text: `Syncing voters to cloud… ${progress.uploaded.toLocaleString()} / ${progress.total.toLocaleString()}`,
      color: '#5B5CEB',
    },
    done: {
      bg: '#ECFDF5', border: '#A7F3D0', icon: <CheckCircle2 size={14} style={{ color: '#10B981' }} />,
      text: 'All voters synced to cloud successfully.',
      color: '#10B981',
    },
    error: {
      bg: '#FEF2F2', border: '#FECACA', icon: <AlertCircle size={14} style={{ color: '#EF4444' }} />,
      text: 'Cloud sync failed. Voters are still viewable locally.',
      color: '#EF4444',
    },
  }
  const c = configs[status]
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-[13px] font-medium" style={{ background: c.bg, borderColor: c.border, color: c.color }}>
      {c.icon}
      <span>{c.text}</span>
      {status === 'syncing' && (
        <div className="ml-auto flex-shrink-0 w-32 h-1.5 rounded-full bg-indigo-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ background: '#5B5CEB', width: `${progress.total ? Math.round(progress.uploaded / progress.total * 100) : 0}%` }} />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Voters() {
  const fileInputRef = useRef(null)

  // ── data & file state ────
  const [voters, setVoters]           = useState([])
  const [csvHeaders, setCsvHeaders]   = useState(DEFAULT_HEADERS)
  const [hasFile, setHasFile]         = useState(false)
  const [importMeta, setImportMeta]   = useState(null)
  const [metaLoading, setMetaLoading] = useState(true)

  // ── sync banner ────
  const [syncStatus, setSyncStatus]     = useState('idle')
  const [syncProgress, setSyncProgress] = useState({ uploaded: 0, total: 0 })

  // ── column visibility ────
  const [visibleCols, setVisibleCols]   = useState(() => new Set(DEFAULT_HEADERS.filter(h => h !== 'ADDRESS')))
  const [showColPanel, setShowColPanel] = useState(false)

  // ── filter / sort / page ────
  const [search, setSearch]               = useState('')
  const [filterStation, setFilterStation] = useState('')
  const [filterBooth, setFilterBooth]     = useState('')
  const [sort, setSort]                   = useState({ col: '', dir: 'asc' })
  const [page, setPage]                   = useState(1)
  const [drawerVoter, setDrawerVoter]     = useState(null)

  // ── Firestore-mode state ────
  // fsMode = true when data comes from Firestore (not in-memory CSV)
  const [fsMode, setFsMode]           = useState(false)
  const [fsLoading, setFsLoading]     = useState(false)
  const [fsHasMore, setFsHasMore]     = useState(false)
  const [fsPage, setFsPage]           = useState(1)
  // fsCursors[i] = Firestore document snapshot to START page i+1 (0-indexed: null = start)
  const [fsCursors, setFsCursors]     = useState([null])
  // booths/stations loaded from /booths collection (available after any CSV import)
  const [boothsList, setBoothsList]   = useState([])

  // ── On mount: load import metadata + booths from Firestore ────
  useEffect(() => {
    Promise.all([getImportMeta(), fetchAllBooths()])
      .then(([meta, booths]) => {
        if (booths.length) setBoothsList(booths)
        if (meta) {
          setImportMeta(meta)
          setHasFile(true)
          setFsMode(true)
        }
      })
      .catch(() => {})
      .finally(() => setMetaLoading(false))
  }, [])

  // ── Load voters from Firestore whenever fsMode or filters change ────
  useEffect(() => {
    if (!fsMode) return
    const hasFilters = !!(filterBooth || filterStation)
    // With filters: load a large batch into memory, then use client-side paging/sort/search
    // Without filters: load one page at a time with cursor pagination
    const pageSize = hasFilters ? FS_FILTER_LIMIT : PAGE_SIZE
    setFsLoading(true)
    setFsPage(1)
    setPage(1)
    setFsCursors([null])
    fetchVotersPage(pageSize, null, {
      boothNo: filterBooth || undefined,
      station: filterStation || undefined,
    }).then(({ docs, lastVisible, hasMore }) => {
      setVoters(docs)
      // hasMore only matters for unfiltered cursor-pagination mode
      setFsHasMore(!hasFilters && hasMore)
      if (!hasFilters && lastVisible) setFsCursors([null, lastVisible])
    }).catch(e => console.error('Voter load failed:', e))
      .finally(() => setFsLoading(false))
  }, [fsMode, filterBooth, filterStation])

  // ── Firestore next/prev page (only used in unfiltered fsMode) ────
  const handleFsNext = async () => {
    if (!fsHasMore || fsLoading) return
    const nextPage = fsPage + 1
    const cursor   = fsCursors[fsPage] // last doc of current page → start of next
    setFsLoading(true)
    try {
      const { docs, lastVisible, hasMore } = await fetchVotersPage(PAGE_SIZE, cursor, {})
      setVoters(docs)
      setFsHasMore(hasMore)
      setFsPage(nextPage)
      if (lastVisible) {
        setFsCursors(prev => { const n = [...prev]; n[nextPage] = lastVisible; return n })
      }
    } catch(e) { console.error(e) }
    finally { setFsLoading(false) }
  }

  const handleFsPrev = async () => {
    if (fsPage <= 1 || fsLoading) return
    const prevPage = fsPage - 1
    const cursor   = fsCursors[prevPage - 1] ?? null // entry cursor for prevPage
    setFsLoading(true)
    try {
      const { docs } = await fetchVotersPage(PAGE_SIZE, cursor, {})
      setVoters(docs)
      setFsHasMore(true) // there is a next page (we just came from it)
      setFsPage(prevPage)
    } catch(e) { console.error(e) }
    finally { setFsLoading(false) }
  }

  // ── Derived filter options ────
  // Use boothsList (from Firestore) in fsMode; derive from in-memory CSV otherwise
  const allStations = useMemo(() => {
    if (fsMode && boothsList.length)
      return [...new Set(boothsList.map(b => b.pollingStation))].filter(Boolean).sort()
    return [...new Set(voters.map(v => v.POLLING_STATION))].filter(Boolean).sort()
  }, [fsMode, voters, boothsList])

  const allBooths = useMemo(() => {
    if (fsMode && boothsList.length) {
      const base = filterStation ? boothsList.filter(b => b.pollingStation === filterStation) : boothsList
      return base.map(b => b.boothNo)
    }
    const base = filterStation ? voters.filter(v => v.POLLING_STATION === filterStation) : voters
    return [...new Set(base.map(v => v.BOOTH_NO))].filter(Boolean).sort()
  }, [fsMode, voters, boothsList, filterStation])

  // ── Client-side filter+sort (used in CSV mode OR fsMode with active filters) ────
  // In unfiltered fsMode, voters already holds exactly one page — just display it directly.
  const fsUnfiltered = fsMode && !filterBooth && !filterStation
  const filtered = useMemo(() => {
    if (fsUnfiltered) return voters // bypass — Firestore already handles pagination
    let data = voters
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(v => csvHeaders.some(h => String(v[h] ?? '').toLowerCase().includes(q)))
    }
    if (filterStation) data = data.filter(v => v.POLLING_STATION === filterStation)
    if (filterBooth)   data = data.filter(v => v.BOOTH_NO === filterBooth)
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
  }, [voters, search, filterStation, filterBooth, sort, csvHeaders, fsUnfiltered])

  // Table data: in unfiltered fsMode, show raw Firestore page; otherwise use filtered+paged
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered])
  const pageData   = useMemo(() => {
    if (fsUnfiltered) return voters
    return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }, [filtered, page, fsUnfiltered, voters])
  const displayCols = csvHeaders.filter(h => visibleCols.has(h))

  const pageWindow = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 3) return [1, 2, 3, 4, 5]
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [page - 2, page - 1, page, page + 1, page + 2]
  }, [page, totalPages])

  // ── CSV file handler ────
  const handleFileChange = useCallback(async e => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const text = await file.text()
    const { headers, voters: parsed } = parseCSV(text)

    setVoters(parsed)
    setCsvHeaders(headers)
    setVisibleCols(new Set(headers.filter(h => h !== 'ADDRESS')))
    setHasFile(true)
    setFsMode(false) // back to in-memory CSV mode
    setPage(1)
    setSearch(''); setFilterStation(''); setFilterBooth('')

    const boothSet   = new Set(parsed.map(v => v.BOOTH_NO).filter(Boolean))
    const stationSet = new Set(parsed.map(v => v.POLLING_STATION).filter(Boolean))
    const now = new Date()
    const meta = {
      name: file.name,
      importedOn: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      records: parsed.length,
      booths: boothSet.size,
      stations: stationSet.size,
      importId: `import_${Date.now()}`,
    }
    setImportMeta(meta)

    setSyncStatus('syncing')
    setSyncProgress({ uploaded: 0, total: parsed.length })
    try {
      await uploadVoters(parsed, meta.importId, (uploaded, total) => {
        setSyncProgress({ uploaded, total })
      })
      await uploadBooths(parsed)
      await saveImportMeta(meta)
      // Refresh boothsList from Firestore so filter dropdowns update
      fetchAllBooths().then(b => setBoothsList(b)).catch(() => {})
      setSyncStatus('done')
    } catch (err) {
      console.error('Voter sync failed:', err)
      setSyncStatus('error')
    }
  }, [])

  // ── helpers ────
  const handleSort = col => {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })
    setPage(1)
  }
  const toggleCol = col => {
    setVisibleCols(prev => {
      const next = new Set(prev)
      if (next.has(col)) { if (next.size > 1) next.delete(col) }
      else next.add(col)
      return next
    })
  }
  const clearFilters = () => { setSearch(''); setFilterStation(''); setFilterBooth(''); setPage(1) }
  const hasActiveFilters = search || filterStation || filterBooth

  const openFilePicker = () => fileInputRef.current?.click()

  // Label for "X records found" in unfiltered fsMode
  const recordsLabel = fsUnfiltered
    ? `${voters.length} records on this page · ${(importMeta?.records ?? 0).toLocaleString()} total`
    : `${filtered.length.toLocaleString()} record${filtered.length !== 1 ? 's' : ''} found`

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="-m-6 flex flex-col bg-[#F5F7FB]" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* Hidden file input */}
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
                <button
                  onClick={() => setShowColPanel(p => !p)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[13px] font-medium transition-colors ${showColPanel ? 'border-[#5B5CEB] text-[#5B5CEB] bg-[#EEF2FF]' : 'border-[#E8ECF4] bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <Settings2 size={14} /> Columns
                </button>
              </>
            )}
            <button
              onClick={openFilePicker}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}
            >
              <Upload size={14} /> {hasFile ? 'Re-import CSV' : 'Import CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* ─── Empty State ─── */}
        {!hasFile ? (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#C7D2FE] p-14 text-center max-w-md w-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ width: 72, height: 72, background: '#EEF2FF' }}>
                <Users size={30} style={{ color: '#5B5CEB' }} />
              </div>

              {metaLoading ? (
                <Loader2 size={20} className="animate-spin mx-auto mb-3" style={{ color: '#5B5CEB' }} />
              ) : importMeta ? (
                <>
                  <h3 className="text-slate-800 font-bold text-[18px] mb-1">Previous import found</h3>
                  <p className="text-slate-500 text-[13px] mb-1">{importMeta.name}</p>
                  <p className="text-slate-400 text-[12px] mb-2">
                    {importMeta.records?.toLocaleString()} voters · {importMeta.booths} booths · Imported {importMeta.importedOn}
                  </p>
                  <p className="text-slate-400 text-[12px] mb-6">Re-upload the CSV to browse voter records in the table.</p>
                </>
              ) : (
                <>
                  <h3 className="text-slate-800 font-bold text-[18px] mb-2">No voter list uploaded</h3>
                  <p className="text-slate-400 text-[13px] leading-relaxed mb-7">
                    Upload an official voter CSV to begin managing voter records. The table will automatically adapt to your CSV structure.
                  </p>
                </>
              )}

              <button
                onClick={openFilePicker}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}
              >
                <Upload size={16} /> Upload CSV File
              </button>
            </div>
          </div>

        ) : (
          <>
            {/* ─── Uploaded File Card ─── */}
            <div className="bg-white rounded-2xl border border-[#E8ECF4] px-5 py-4 flex items-center gap-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
                <FileText size={18} style={{ color: '#5B5CEB' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-semibold text-[14px]">{importMeta?.name || 'Imported File'}</p>
                <p className="text-slate-400 text-[12px] mt-0.5">Imported on {importMeta?.importedOn}</p>
              </div>
              <div className="flex items-center gap-8 text-center">
                {[
                  ['Records', (importMeta?.records ?? voters.length).toLocaleString()],
                  ['Booths Detected', (importMeta?.booths ?? 0).toString()],
                  ['Polling Stations', (importMeta?.stations ?? 0).toString()],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-slate-800 font-bold text-[17px]">{val}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0" style={{ background: '#ECFDF5' }}>
                <CheckCircle2 size={13} style={{ color: '#10B981' }} />
                <span className="text-[12px] font-semibold" style={{ color: '#10B981' }}>
                  {fsMode ? 'Loaded from Cloud' : 'Imported Successfully'}
                </span>
              </div>
            </div>

            {/* ─── Sync Status Banner ─── */}
            <SyncBanner status={syncStatus} progress={syncProgress} />

            {/* ─── Firestore loading indicator ─── */}
            {fsLoading && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium"
                style={{ background: '#EEF2FF', borderColor: '#C7D2FE', color: '#5B5CEB' }}>
                <Loader2 size={14} className="animate-spin" />
                <span>Loading voter data from cloud…</span>
              </div>
            )}

            {/* ─── Column Visibility Panel ─── */}
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
                        {on ? <Eye size={11} /> : <EyeOff size={11} />}
                        {hl(col)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ─── Search + Filters Bar ─── */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative" style={{ minWidth: 260 }}>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder={fsUnfiltered ? 'Select a booth or station to search…' : 'Search by any field…'}
                  disabled={fsUnfiltered}
                  className={`w-full pl-9 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-700 placeholder-slate-400 outline-none transition-all ${fsUnfiltered ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onFocus={e => { if (!fsUnfiltered) e.target.style.borderColor = '#5B5CEB' }}
                  onBlur={e => e.target.style.borderColor = '#E8ECF4'}
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="relative">
                <select value={filterStation}
                  onChange={e => { setFilterStation(e.target.value); setFilterBooth(''); setPage(1) }}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-600 outline-none cursor-pointer"
                  style={{ minWidth: 160 }}>
                  <option value="">Polling Station</option>
                  {allStations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select value={filterBooth}
                  onChange={e => { setFilterBooth(e.target.value); setPage(1) }}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-600 outline-none cursor-pointer"
                  style={{ minWidth: 140 }}>
                  <option value="">Booth Number</option>
                  {allBooths.map(b => <option key={b} value={b}>Booth {b}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-slate-500 border border-[#E8ECF4] bg-white hover:bg-slate-50 transition-colors">
                  <X size={12} /> Clear filters
                </button>
              )}

              <span className="ml-auto text-slate-400 text-[12px] flex-shrink-0">{recordsLabel}</span>
            </div>

            {/* ─── Table ─── */}
            <div className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                <table className="border-collapse" style={{ minWidth: `${(displayCols.length + 2) * 130}px`, width: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
                    <tr className="border-b border-[#E8ECF4]" style={{ background: '#F8FAFC' }}>
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold text-[11px] uppercase tracking-wider"
                        style={{ position: 'sticky', left: 0, zIndex: 31, background: '#F8FAFC', width: 48, minWidth: 48 }}>#</th>
                      {displayCols.map((col, ci) => (
                        <th key={col} onClick={() => !fsUnfiltered && handleSort(col)}
                          className={`text-left px-4 py-3 text-slate-500 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap ${fsUnfiltered ? '' : 'cursor-pointer select-none'}`}
                          style={ci === 0 ? { position: 'sticky', left: 48, zIndex: 31, background: '#F8FAFC' } : { background: '#F8FAFC' }}>
                          <div className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                            {hl(col)}{!fsUnfiltered && <SortIcon col={col} sort={sort} />}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-slate-400 font-semibold text-[11px] uppercase tracking-wider text-right"
                        style={{ background: '#F8FAFC', minWidth: 96 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.length === 0 ? (
                      <tr><td colSpan={displayCols.length + 2} className="text-center py-16 text-slate-400 text-[13px]">
                        {fsLoading ? 'Loading…' : 'No voters match your search or filters.'}
                      </td></tr>
                    ) : pageData.map((voter, idx) => (
                      <tr key={voter._id} onClick={() => setDrawerVoter(voter)}
                        className="border-b border-slate-50 cursor-pointer"
                        style={{ transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFD'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <td className="px-4 py-3 text-slate-400 text-[11px]" style={{ position: 'sticky', left: 0, zIndex: 10, background: 'inherit' }}>
                          {fsUnfiltered ? (fsPage - 1) * PAGE_SIZE + idx + 1 : (page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        {displayCols.map((col, ci) => (
                          <td key={col} className="px-4 py-3"
                            style={ci === 0 ? { position: 'sticky', left: 48, zIndex: 10, background: 'inherit' } : {}}>
                            <CellContent col={col} val={voter[col]} />
                          </td>
                        ))}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setDrawerVoter(voter)} title="View"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"><Eye size={14} /></button>
                            <button title="Edit"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Edit2 size={14} /></button>
                            <button title="Delete"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {fsUnfiltered ? (
                /* Firestore cursor pagination — prev/next only */
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#E8ECF4]">
                  <span className="text-slate-400 text-[12px]">
                    Page {fsPage} · {(importMeta?.records ?? 0).toLocaleString()} total records · Select a booth or station for full search
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={handleFsPrev} disabled={fsPage <= 1 || fsLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span className="text-slate-400 text-[12px] px-2">Page {fsPage}</span>
                    <button onClick={handleFsNext} disabled={!fsHasMore || fsLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Client-side pagination */
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
                        onMouseLeave={e => { if (page !== p) e.currentTarget.style.background = '' }}
                      >{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight size={14} /></button>
                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                      className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">»</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Voter Detail Drawer ─── */}
      {drawerVoter && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" style={{ backdropFilter: 'blur(1px)' }} onClick={() => setDrawerVoter(null)} />
          <div className="fixed right-0 top-16 bottom-0 bg-white border-l border-[#E8ECF4] z-50 flex flex-col"
            style={{ width: 380, boxShadow: '-4px 0 24px rgba(0,0,0,0.10)' }}>
            <div className="px-5 py-4 border-b border-[#E8ECF4] flex items-start justify-between flex-shrink-0">
              <div>
                <p className="text-slate-800 font-bold text-[15px]">{drawerVoter.VOTER_NAME || 'Voter Details'}</p>
                <p className="text-slate-400 text-[12px] mt-0.5 font-mono">{drawerVoter.EPIC_NO}</p>
              </div>
              <button onClick={() => setDrawerVoter(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors mt-0.5"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 border-b border-[#E8ECF4] flex-shrink-0" style={{ background: '#FAFBFF' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-[18px] flex-shrink-0"
                  style={{ background: GENDER_COLOR[drawerVoter.GENDER] || '#5B5CEB' }}>
                  {String(drawerVoter.VOTER_NAME || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-slate-800 font-semibold text-[14px]">{drawerVoter.VOTER_NAME}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: GENDER_COLOR[drawerVoter.GENDER], background: GENDER_BG[drawerVoter.GENDER] }}>
                      {drawerVoter.GENDER}</span>
                    <span className="text-slate-400 text-[12px]">·</span>
                    <span className="text-slate-500 text-[12px]">{drawerVoter.AGE} years</span>
                    <span className="text-slate-400 text-[12px]">·</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border border-[#C7D2FE] text-[#5B5CEB]" style={{ background: '#EEF2FF' }}>
                      Booth {drawerVoter.BOOTH_NO}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-2">
                {csvHeaders.map(key => {
                  const val = drawerVoter[key]
                  if (val === undefined || val === null || val === '') return null
                  return (
                    <div key={key} className="flex items-start py-3 border-b border-slate-50 last:border-0 gap-3">
                      <span className="text-slate-400 text-[12px] w-36 flex-shrink-0 pt-0.5">{hl(key)}</span>
                      <span className="text-slate-700 text-[12px] font-medium flex-1 text-right break-words">{String(val)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[#E8ECF4] flex-shrink-0">
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">
                  <Edit2 size={14} /> Edit Voter
                </button>
                <button className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-red-100 text-red-400 text-[13px] font-medium hover:bg-red-50 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
