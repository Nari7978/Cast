// IndexedDB cache for voter data — persists across navigation, no network needed.
// localStorage stores the small metadata; IndexedDB stores the large voter array.

const DB_NAME    = 'cast_db'
const VOTER_STORE = 'voters'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(VOTER_STORE, { keyPath: '_id' })
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

// ── Single-import cache (legacy compat) ───────────────────────────────────────

const META_KEY = 'cast_import_meta'
export function cacheImportMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)) } catch {}
}
export function loadCachedImportMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) } catch { return null }
}

// ── Multi-import metadata ─────────────────────────────────────────────────────

const METAS_KEY = 'cast_import_metas'
export function cacheImportMetas(metas) {
  try { localStorage.setItem(METAS_KEY, JSON.stringify(metas)) } catch {}
}
export function loadCachedImportMetas() {
  try { return JSON.parse(localStorage.getItem(METAS_KEY)) || [] } catch { return [] }
}

// ── Voter IndexedDB ───────────────────────────────────────────────────────────

// Full replace (used by first import or clear+reimport).
export async function cacheVoters(voters) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VOTER_STORE, 'readwrite')
    const store = tx.objectStore(VOTER_STORE)
    store.clear()
    for (const v of voters) store.put(v)
    tx.oncomplete = () => resolve()
    tx.onerror    = e => reject(e.target.error)
  })
}

// Merge voters for a new import: removes existing voters for the same booths
// (matched by v._boothNo), then inserts the new voters.
export async function mergeVoterCache(newVoters, boothNos) {
  const boothSet = new Set(boothNos.map(String))
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VOTER_STORE, 'readwrite')
    const store = tx.objectStore(VOTER_STORE)
    const req   = store.getAll()
    req.onsuccess = () => {
      const kept = (req.result || []).filter(v => !boothSet.has(String(v._boothNo || '')))
      store.clear()
      for (const v of kept)      store.put(v)
      for (const v of newVoters) store.put(v)
    }
    tx.oncomplete = () => resolve()
    tx.onerror    = e => reject(e.target.error)
  })
}

// Remove voters for specific booths from the cache (used on delete).
export async function removeVotersByBooths(boothNos) {
  const boothSet = new Set(boothNos.map(String))
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(VOTER_STORE, 'readwrite')
    const store = tx.objectStore(VOTER_STORE)
    const req   = store.getAll()
    req.onsuccess = () => {
      const kept = (req.result || []).filter(v => !boothSet.has(String(v._boothNo || '')))
      store.clear()
      for (const v of kept) store.put(v)
    }
    tx.oncomplete = () => resolve()
    tx.onerror    = e => reject(e.target.error)
  })
}

// Load all voters from IndexedDB. Returns [] if nothing cached.
export async function loadCachedVoters() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const req = db.transaction(VOTER_STORE, 'readonly').objectStore(VOTER_STORE).getAll()
      req.onsuccess = e => resolve(e.target.result || [])
      req.onerror   = e => reject(e.target.error)
    })
  } catch {
    return []
  }
}

export async function clearVoterCache() {
  localStorage.removeItem(META_KEY)
  localStorage.removeItem(METAS_KEY)
  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(VOTER_STORE, 'readwrite')
      tx.objectStore(VOTER_STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror    = e => reject(e.target.error)
    })
  } catch {}
}
