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

// Paginated voter fetch from Firestore (used when CSV not in memory)
export async function fetchVotersPage(pageSize = 25, cursor = null, filters = {}) {
  let q = query(collection(db, 'voters'), orderBy('VOTER_NAME'), limit(pageSize))
  if (filters.boothNo)     q = query(q, where('BOOTH_NO', '==', filters.boothNo))
  if (filters.station)     q = query(q, where('POLLING_STATION', '==', filters.station))
  if (cursor)              q = query(q, startAfter(cursor))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }))
  const lastVisible = snap.docs[snap.docs.length - 1] || null
  return { docs, lastVisible }
}
