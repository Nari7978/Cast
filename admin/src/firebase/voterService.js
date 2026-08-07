import {
  collection, doc, writeBatch, serverTimestamp,
  setDoc, getDoc, query, orderBy, limit, startAfter, getDocs, where,
} from 'firebase/firestore'
import { db } from './config'

const CHUNK_SIZE = 400
const PARALLEL   = 5

// Upload all parsed voters to Firestore in parallel batches
export async function uploadVoters(voters, importId, onProgress) {
  const chunks = []
  for (let i = 0; i < voters.length; i += CHUNK_SIZE) {
    chunks.push(voters.slice(i, i + CHUNK_SIZE))
  }

  let uploaded = 0
  for (let i = 0; i < chunks.length; i += PARALLEL) {
    const group = chunks.slice(i, i + PARALLEL)
    await Promise.all(group.map(async chunk => {
      const batch = writeBatch(db)
      chunk.forEach(voter => {
        const id = voter.EPIC_NO || `V_${Math.random().toString(36).slice(2)}`
        batch.set(doc(db, 'voters', id), { ...voter, importId, _updatedAt: serverTimestamp() })
      })
      await batch.commit()
      uploaded += chunk.length
      onProgress?.(uploaded, voters.length)
    }))
  }
}

// Derive booths from voters and write to /booths collection
export async function uploadBooths(voters) {
  const boothMap = {}
  voters.forEach(v => {
    const key = String(v.BOOTH_NO || '').trim()
    if (!key) return
    if (!boothMap[key]) {
      boothMap[key] = { boothNo: key, pollingStation: v.POLLING_STATION || '', voterCount: 0 }
    }
    boothMap[key].voterCount++
  })

  const entries = Object.values(boothMap)
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db)
    entries.slice(i, i + CHUNK_SIZE).forEach(booth => {
      batch.set(doc(db, 'booths', booth.boothNo), booth)
    })
    await batch.commit()
  }
}

// Save import metadata (also acts as the "latest import" record)
export async function saveImportMeta(meta) {
  await setDoc(doc(db, 'voter_imports', 'latest'), {
    ...meta,
    savedAt: serverTimestamp(),
  })
}

// Fetch the latest import metadata (for page reload)
export async function getImportMeta() {
  const snap = await getDoc(doc(db, 'voter_imports', 'latest'))
  return snap.exists() ? snap.data() : null
}

// Fetch all booths from Firestore (small collection, always available after first import)
export async function fetchAllBooths() {
  const snap = await getDocs(collection(db, 'booths'))
  return snap.docs
    .map(d => d.data())
    .sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
}

// Paginated voter fetch from Firestore (used when CSV not in memory).
// When booth/station filter is active: no orderBy (avoids composite-index requirement),
// loads up to pageSize docs and lets the caller do client-side sort.
// When no filter: orderBy VOTER_NAME + cursor for consistent pagination.
export async function fetchVotersPage(pageSize = 25, cursor = null, filters = {}) {
  const hasFilter = !!(filters.boothNo || filters.station)
  const constraints = []
  if (filters.boothNo) constraints.push(where('BOOTH_NO', '==', filters.boothNo))
  if (filters.station) constraints.push(where('POLLING_STATION', '==', filters.station))
  if (!hasFilter)      constraints.push(orderBy('VOTER_NAME'))
  constraints.push(limit(pageSize + 1)) // +1 to detect hasMore
  if (!hasFilter && cursor) constraints.push(startAfter(cursor))
  const snap = await getDocs(query(collection(db, 'voters'), ...constraints))
  const hasMore = snap.docs.length > pageSize
  const docs = snap.docs.slice(0, pageSize).map(d => ({ _id: d.id, ...d.data() }))
  const lastVisible = snap.docs[Math.min(pageSize - 1, snap.docs.length - 1)] || null
  return { docs, lastVisible, hasMore }
}
