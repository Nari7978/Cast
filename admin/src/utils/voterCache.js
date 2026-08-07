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

// Save all voters to IndexedDB (clears old data first).
// Runs in a single transaction — fast even for 50K records.
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

// Metadata (small) lives in localStorage — synchronous and instant.
const META_KEY = 'cast_import_meta'
export function cacheImportMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)) } catch {}
}
export function loadCachedImportMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) } catch { return null }
}
export function clearVoterCache() {
  localStorage.removeItem(META_KEY)
}
