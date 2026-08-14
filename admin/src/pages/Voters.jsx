import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Upload, Download, Search, X, FileText, CheckCircle2,
  Edit2, Trash2, Settings2, ChevronDown, ChevronLeft, ChevronRight,
  Eye, EyeOff, ArrowUp, ArrowDown, ArrowUpDown, Users, Loader2,
  AlertCircle, Cloud, Plus, FolderOpen,
} from 'lucide-react'
import {
  uploadBoothsForImport, uploadVotersForBooths,
  saveImportMetaById, deleteBoothsAndVoters, deleteImportMetaById,
  clearBooths, clearVoters, deleteImportMeta,
} from '../services/voterService'
import { clearFsCache } from '../utils/fsCache'
import {
  cacheImportMetas, loadCachedImportMetas,
  loadCachedImportMeta,
  mergeVoterCache, removeVotersByBooths,
  loadCachedVoters, clearVoterCache,
} from '../utils/voterCache'
import { parseCSV, detectCols } from '../utils/csvUtils'

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

function CloudBadge({ status, errorMsg }) {
  if (!status || status === 'idle') return null
  const cfg = {
    uploading: { bg: '#EEF2FF', border: '#C7D2FE', color: '#5B5CEB', icon: <Cloud size={12} className="animate-pulse" />, text: 'Syncing…' },
    done:      { bg: '#ECFDF5', border: '#A7F3D0', color: '#10B981', icon: <CheckCircle2 size={12} />, text: 'Saved' },
    error:     { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', icon: <AlertCircle size={12} />, text: errorMsg || 'Sync failed' },
  }[status]
  if (!cfg) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
      {cfg.icon}{cfg.text}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Voters() {
  const fileInputRef = useRef(null)

  const [voters,      setVoters]      = useState([])
  const [csvHeaders,  setCsvHeaders]  = useState(DEFAULT_HEADERS)
  const [importMetas, setImportMetas] = useState([])   // [{importId, name, importedOn, records, booths, stations, boothNos, boothCol, stationCol, csvHeaders}]

  // 'idle' | 'loading' | 'ready' | 'error'
  const [loadStatus, setLoadStatus] = useState('idle')

  // Per-import cloud sync status: { [importId]: 'uploading'|'done'|'error'|'idle' }
  const [cloudStatus, setCloudStatus] = useState({})
  const [cloudError,  setCloudError]  = useState({})

  const [visibleCols,  setVisibleCols]  = useState(() => new Set(DEFAULT_HEADERS.filter(h => h !== 'ADDRESS')))
  const [showColPanel, setShowColPanel] = useState(false)

  const [searchRaw,      setSearchRaw]      = useState('')
  const [search,         setSearch]         = useState('')
  const [filterStation,  setFilterStation]  = useState('')
  const [filterBooth,    setFilterBooth]    = useState('')
  const [sort,           setSort]           = useState({ col: '', dir: 'asc' })
  const [page,           setPage]           = useState(1)
  const [drawerVoter,    setDrawerVoter]    = useState(null)
  const [confirmDelete,  setConfirmDelete]  = useState(null)   // importId to confirm-delete, or 'all'

  const hasImports = importMetas.length > 0

  // ── On mount: restore from local cache ──────────────────────────────────────
  useEffect(() => {
    // Try multi-import metas first
    let metas = loadCachedImportMetas()

    // Migrate old single-meta format
    if (!metas.length) {
      const old = loadCachedImportMeta()
      if (old?.records) {
        metas = [{
          importId: 'import_legacy',
          ...old,
          boothNos: [],  // unknown — can't delete by booth without this
        }]
        cacheImportMetas(metas)
      }
    }

    if (!metas.length) return

    setImportMetas(metas)
    const lastHeaders = metas[metas.length - 1]?.csvHeaders
    if (lastHeaders) {
      setCsvHeaders(lastHeaders)
      setVisibleCols(new Set(lastHeaders.filter(h => h !== 'ADDRESS')))
    }
    setLoadStatus('loading')

    loadCachedVoters().then(cached => {
      if (cached.length > 0) {
        setVoters(cached)
        setLoadStatus('ready')
      } else {
        setLoadStatus('idle')
      }
    }).catch(() => setLoadStatus('idle'))
  }, [])

  // ── Debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchRaw), 200)
    return () => clearTimeout(t)
  }, [searchRaw])

  // ── CSV file upload handler (append mode) ────────────────────────────────────
  const handleFileChange = useCallback(async e => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const importId = 'import_' + Date.now()

    try {
    // 1. Parse CSV
    const text = await file.text()
    const { headers, voters: parsed } = parseCSV(text)
    const { boothCol, stationCol } = detectCols(headers, parsed.slice(0, 50))

    const boothNos   = [...new Set(parsed.map(v => String(v[boothCol] || '').trim()).filter(Boolean))]
    const stationSet = new Set(parsed.map(v => v[stationCol]).filter(Boolean))
    const boothSet   = new Set(boothNos)

    // Give each voter a stable unique _id and a _boothNo tag for cache merging
    const parsedTagged = parsed.map((v, i) => ({
      ...v,
      _id:     `${importId}_${i + 1}`,
      _boothNo: String(v[boothCol] || '').trim(),
    }))

    // 2. Build new meta for this import
    const now = new Date()
    const meta = {
      importId,
      name:       file.name,
      importedOn: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      records:    parsed.length,
      booths:     boothNos.length,
      stations:   stationSet.size,
      boothCol,
      stationCol,
      csvHeaders: headers,
      boothNos,
    }

    // 3. If any existing import owned those booths, strip those booths from it.
    //    An import with no remaining booths is removed entirely.
    const updatedMetas = importMetas
      .map(m => ({
        ...m,
        boothNos: (m.boothNos || []).filter(bn => !boothSet.has(String(bn))),
      }))
      .filter(m => m.boothNos.length > 0 || m.importId === 'import_legacy')

    const newMetas = [...updatedMetas, meta]

    // 4. Show data immediately
    const existingVoters = voters.filter(v => !boothSet.has(String(v._boothNo || '')))
    const allVoters      = [...existingVoters, ...parsedTagged]

    setVoters(allVoters)
    setCsvHeaders(headers)
    setVisibleCols(new Set(headers.filter(h => h !== 'ADDRESS')))
    setImportMetas(newMetas)
    setLoadStatus('ready')
    setPage(1)
    setSearch(''); setFilterStation(''); setFilterBooth('')

    // 5. Persist locally
    cacheImportMetas(newMetas)
    mergeVoterCache(parsedTagged, boothNos).catch(() => {})

    // 6. Cloud backup
    setCloudStatus(s => ({ ...s, [importId]: 'uploading' }))
    setCloudError(e => ({ ...e, [importId]: '' }))
    Promise.all([
      uploadBoothsForImport(parsed, boothCol, stationCol),
      uploadVotersForBooths(parsed, boothCol, boothNos),
      saveImportMetaById(importId, meta),
    ]).then(() => {
      setCloudStatus(s => ({ ...s, [importId]: 'done' }))
      setTimeout(() => setCloudStatus(s => ({ ...s, [importId]: 'idle' })), 3000)
    }).catch(err => {
      const msg = err?.code === 'permission-denied'
        ? 'Supabase permission denied — check RLS policies.'
        : `Sync error: ${err?.message || err}`
      setCloudError(e => ({ ...e, [importId]: msg }))
      setCloudStatus(s => ({ ...s, [importId]: 'error' }))
    })
    } catch (err) {
      setCloudError(e => ({ ...e, [importId]: `Import failed: ${err?.message || err}` }))
      setCloudStatus(s => ({ ...s, [importId]: 'error' }))
    }
  }, [voters, importMetas])

  // ── Delete one import ────────────────────────────────────────────────────────
  const handleDeleteImport = useCallback(async importId => {
    const meta = importMetas.find(m => m.importId === importId)
    if (!meta) return

    const boothNos = meta.boothNos || []
    const boothSet = new Set(boothNos.map(String))

    const newMetas   = importMetas.filter(m => m.importId !== importId)
    const newVoters  = voters.filter(v => !boothSet.has(String(v._boothNo || '')))
    const newHeaders = newMetas.length > 0
      ? (newMetas[newMetas.length - 1]?.csvHeaders || DEFAULT_HEADERS)
      : DEFAULT_HEADERS

    setImportMetas(newMetas)
    setVoters(newVoters)
    setCsvHeaders(newHeaders)
    setVisibleCols(new Set(newHeaders.filter(h => h !== 'ADDRESS')))
    if (newMetas.length === 0) setLoadStatus('idle')
    setConfirmDelete(null)

    cacheImportMetas(newMetas)
    removeVotersByBooths(boothNos).catch(() => {})
    if (boothNos.length) {
      deleteBoothsAndVoters(boothNos).catch(() => {})
    }
    deleteImportMetaById(importId).catch(() => {})
    if (importId === 'import_legacy') deleteImportMeta().catch(() => {})
  }, [importMetas, voters])

  // ── Delete all ───────────────────────────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    setVoters([])
    setCsvHeaders(DEFAULT_HEADERS)
    setVisibleCols(new Set(DEFAULT_HEADERS.filter(h => h !== 'ADDRESS')))
    setImportMetas([])
    setLoadStatus('idle')
    setCloudStatus({})
    setSearchRaw(''); setSearch(''); setFilterStation(''); setFilterBooth('')
    setPage(1)
    setConfirmDelete(null)

    clearFsCache('booths')
    clearVoterCache().catch(err => alert(`Cache clear failed: ${err?.message || err}`))
    clearBooths().catch(err => alert(`Failed to clear booths from Supabase: ${err?.message || err}`))
    clearVoters().catch(err => alert(`Failed to clear voters from Supabase: ${err?.message || err}`))
    deleteImportMeta().catch(err => alert(`Failed to delete import metadata: ${err?.message || err}`))
  }, [])

  // ── Column detection from merged headers ─────────────────────────────────────
  const { boothCol, stationCol } = useMemo(() => {
    const lastMeta = importMetas[importMetas.length - 1]
    if (lastMeta?.boothCol) return { boothCol: lastMeta.boothCol, stationCol: lastMeta.stationCol }
    return detectCols(csvHeaders, voters.slice(0, 50))
  }, [importMetas, csvHeaders, voters])

  // ── Derived filter options ────────────────────────────────────────────────────
  const allStations = useMemo(() =>
    [...new Set(voters.map(v => v[stationCol]))].filter(Boolean).sort()
  , [voters, stationCol])

  const allBooths = useMemo(() => {
    const base = filterStation ? voters.filter(v => v[stationCol] === filterStation) : voters
    return [...new Set(base.map(v => v[boothCol] || v._boothNo))].filter(Boolean).sort((a, b) => Number(a) - Number(b))
  }, [voters, filterStation, boothCol, stationCol])

  // ── Filtered + sorted + paged ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = voters
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(v => csvHeaders.some(h => String(v[h] ?? '').toLowerCase().includes(q)))
    }
    if (filterStation) data = data.filter(v => v[stationCol] === filterStation)
    if (filterBooth)   data = data.filter(v => (v[boothCol] || v._boothNo) === filterBooth)
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

  const handleExportCSV = useCallback(() => {
    if (filtered.length === 0) return
    const headers = displayCols
    const rows = filtered.map(voter =>
      headers.map(h => {
        const val = voter[h] ?? ''
        const str = String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'voters_export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filtered, displayCols])

  const handleSort = col => {
    setSort(prev => prev.col === col ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })
    setPage(1)
  }
  const toggleCol    = col => setVisibleCols(prev => { const n = new Set(prev); n.has(col) ? (n.size > 1 && n.delete(col)) : n.add(col); return n })
  const clearFilters = () => { setSearchRaw(''); setSearch(''); setFilterStation(''); setFilterBooth(''); setPage(1) }
  const hasActiveFilters = searchRaw || filterStation || filterBooth

  // Aggregate totals across all imports
  const totalVoters   = voters.length
  const totalBooths   = importMetas.reduce((s, m) => s + (m.boothNos?.length || m.booths || 0), 0)
  const totalStations = useMemo(() => new Set(voters.map(v => v[stationCol]).filter(Boolean)).size, [voters, stationCol])

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="-m-6 flex flex-col bg-[#F5F7FB]" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-[#E8ECF4] px-6 py-4 flex-shrink-0" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-800 font-bold text-xl">Voter Import</h1>
            <p className="text-slate-400 text-[13px] mt-0.5">Upload booth CSVs — each file adds its booths without overwriting others.</p>
          </div>
          <div className="flex items-center gap-2">
            {hasImports && (
              <>
                <button onClick={handleExportCSV} className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8ECF4] bg-white text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={() => setShowColPanel(p => !p)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[13px] font-medium transition-colors ${showColPanel ? 'border-[#5B5CEB] text-[#5B5CEB] bg-[#EEF2FF]' : 'border-[#E8ECF4] bg-white text-slate-600 hover:bg-slate-50'}`}>
                  <Settings2 size={14} /> Columns
                </button>
                <button onClick={() => setConfirmDelete('all')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-red-100 text-red-400 text-[13px] font-medium hover:bg-red-50 transition-colors">
                  <Trash2 size={14} /> Clear All
                </button>
              </>
            )}
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}>
              {hasImports ? <><Plus size={14} /> Add CSV</> : <><Upload size={14} /> Import CSV</>}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

        {/* Loading */}
        {loadStatus === 'loading' && (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center">
              <Loader2 size={36} className="animate-spin mx-auto mb-4" style={{ color: '#5B5CEB' }} />
              <p className="text-slate-700 font-semibold text-[15px]">Restoring voter list…</p>
              <p className="text-slate-400 text-[13px] mt-1">Loading from local storage</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {loadStatus === 'idle' && !hasImports && (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#C7D2FE] p-14 text-center max-w-md w-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ width: 72, height: 72, background: '#EEF2FF' }}>
                <FolderOpen size={30} style={{ color: '#5B5CEB' }} />
              </div>
              <h3 className="text-slate-800 font-bold text-[18px] mb-2">No voter lists uploaded</h3>
              <p className="text-slate-400 text-[13px] leading-relaxed mb-2">
                Upload one CSV per booth — each upload adds that booth's voters without overwriting others.
              </p>
              <p className="text-slate-300 text-[12px] mb-7">e.g. booth1.csv → booth2.csv → booth3.csv</p>
              <button onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}>
                <Upload size={16} /> Upload First Booth CSV
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        {(loadStatus === 'ready' || hasImports) && loadStatus !== 'loading' && (
          <>
            {/* ── Aggregate summary ── */}
            {hasImports && (
              <div className="bg-white rounded-2xl border border-[#E8ECF4] px-5 py-4 flex items-center gap-8" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
                    <Users size={18} style={{ color: '#5B5CEB' }} />
                  </div>
                  <div>
                    <p className="text-slate-800 font-bold text-[15px]">All Booths Combined</p>
                    <p className="text-slate-400 text-[12px] mt-0.5">{importMetas.length} file{importMetas.length !== 1 ? 's' : ''} imported</p>
                  </div>
                </div>
                {[
                  ['Total Voters', totalVoters.toLocaleString()],
                  ['Total Booths', totalBooths.toString()],
                  ['Polling Stations', totalStations.toString()],
                ].map(([label, val]) => (
                  <div key={label} className="text-center flex-shrink-0">
                    <p className="text-slate-800 font-bold text-[20px]">{val}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{label}</p>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)' }}>
                  <Plus size={14} /> Add Another Booth CSV
                </button>
              </div>
            )}

            {/* ── Per-import file cards ── */}
            {importMetas.map(meta => (
              <div key={meta.importId}
                className="bg-white rounded-2xl border border-[#E8ECF4] px-5 py-4 flex items-center gap-5"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F1F5F9' }}>
                  <FileText size={16} style={{ color: '#64748B' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-700 font-semibold text-[13px] truncate">{meta.name || 'Imported File'}</p>
                    <CloudBadge status={cloudStatus[meta.importId]} errorMsg={cloudError[meta.importId]} />
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">Imported on {meta.importedOn}</p>
                </div>
                <div className="flex items-center gap-6 text-center flex-shrink-0">
                  {[
                    ['Voters',  (meta.records || 0).toLocaleString()],
                    ['Booths',  (meta.boothNos?.length || meta.booths || 0).toString()],
                    ['Stations', (meta.stations || 0).toString()],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-slate-800 font-bold text-[15px]">{val}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#ECFDF5' }}>
                    <CheckCircle2 size={12} style={{ color: '#10B981' }} />
                    <span className="text-[11px] font-semibold" style={{ color: '#10B981' }}>Ready</span>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(meta.importId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-red-100 text-red-400 text-[11px] font-semibold hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Column panel */}
            {showColPanel && hasImports && (
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
            {hasImports && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative" style={{ minWidth: 260 }}>
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input value={searchRaw} onChange={e => { setSearchRaw(e.target.value); setPage(1) }}
                    placeholder="Search by any field…"
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-700 placeholder-slate-400 outline-none"
                    onFocus={e => e.target.style.borderColor = '#5B5CEB'}
                    onBlur={e => e.target.style.borderColor = '#E8ECF4'} />
                  {searchRaw && (
                    <button onClick={() => { setSearchRaw(''); setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
            )}

            {/* Table */}
            {hasImports && loadStatus === 'ready' && (
              <div className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 440px)', overflowY: 'auto' }}>
                  <table className="border-collapse" style={{ minWidth: `${(displayCols.length + 1) * 130}px`, width: '100%' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
                      <tr className="border-b border-[#E8ECF4]" style={{ background: '#F8FAFC' }}>
                        {displayCols.map((col, ci) => (
                          <th key={col} onClick={() => handleSort(col)}
                            className="text-left px-4 py-3 text-slate-500 font-semibold text-[11px] uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                            style={ci === 0 ? { position: 'sticky', left: 0, zIndex: 31, background: '#F8FAFC' } : { background: '#F8FAFC' }}>
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
                        <tr><td colSpan={displayCols.length + 1} className="text-center py-16 text-slate-400 text-[13px]">No voters match your search or filters.</td></tr>
                      ) : pageData.map(voter => (
                        <tr key={voter._id} onClick={() => setDrawerVoter(voter)}
                          className="border-b border-slate-50 cursor-pointer"
                          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFD'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          {displayCols.map((col, ci) => (
                            <td key={col} className="px-4 py-3"
                              style={ci === 0 ? { position: 'sticky', left: 0, zIndex: 10, background: 'inherit' } : {}}>
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
            )}
          </>
        )}
      </div>

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}>
          <div className="bg-white rounded-2xl border border-[#E8ECF4] p-7 flex flex-col items-center text-center" style={{ width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#FEF2F2' }}>
              <Trash2 size={24} style={{ color: '#EF4444' }} />
            </div>
            {confirmDelete === 'all' ? (
              <>
                <p className="text-slate-800 font-bold text-[17px] mb-1">Delete all voter data?</p>
                <p className="text-slate-500 text-[13px] leading-relaxed mb-1">
                  This will remove all <strong>{totalVoters.toLocaleString()} voters</strong> from all {importMetas.length} imported files.
                </p>
                <p className="text-slate-400 text-[12px] mb-6">You will need to re-import all booth CSVs to restore.</p>
              </>
            ) : (() => {
              const meta = importMetas.find(m => m.importId === confirmDelete)
              return (
                <>
                  <p className="text-slate-800 font-bold text-[17px] mb-1">Delete this booth import?</p>
                  <p className="text-slate-500 text-[13px] leading-relaxed mb-1">
                    <strong>{meta?.name}</strong><br />
                    {(meta?.records || 0).toLocaleString()} voters · {meta?.boothNos?.length || meta?.booths || 0} booth{(meta?.boothNos?.length || meta?.booths) !== 1 ? 's' : ''}
                  </p>
                  <p className="text-slate-400 text-[12px] mb-6">Only this file's booths will be removed. Other imports stay intact.</p>
                </>
              )
            })()}
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => confirmDelete === 'all' ? handleClearAll() : handleDeleteImport(confirmDelete)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#EF4444,#F87171)' }}>
                <Trash2 size={14} /> Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Voter Drawer ── */}
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
