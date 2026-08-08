import {
  collection, doc, writeBatch, serverTimestamp,
  setDoc, getDoc, getDocs, getDocsFromServer, deleteDoc,
} from 'firebase/firestore'
import { db } from './config'
import { readCache, writeCache } from '../utils/fsCache'

const CHUNK_SIZE = 400

// ── Booths (small collection, kept in Firestore) ─────────────────────────────

export async function clearBooths() {
  const snap = await getDocsFromServer(collection(db, 'booths'))
  if (snap.empty) return
  for (let i = 0; i < snap.docs.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db)
    snap.docs.slice(i, i + CHUNK_SIZE).forEach(d => batch.delete(d.ref))
    await batch.commit()
  }
}

export async function uploadBooths(voters, boothCol = 'BOOTH_NO', stationCol = 'POLLING_STATION') {
  const boothMap = {}
  voters.forEach(v => {
    const key = String(v[boothCol] || '').trim()
    if (!key) return
    if (!boothMap[key]) {
      boothMap[key] = { boothNo: key, pollingStation: v[stationCol] || '', voterCount: 0 }
    }
    boothMap[key].voterCount++
  })

  const entries = Object.values(boothMap)
  const newKeys = new Set(entries.map(b => b.boothNo))

  // Write new booths first — Firestore is never empty during the update
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db)
    entries.slice(i, i + CHUNK_SIZE).forEach(booth => {
      batch.set(doc(db, 'booths', booth.boothNo), booth)
    })
    await batch.commit()
  }

  // Then remove any booths that are no longer in the new CSV (server read, not cache)
  const snap = await getDocsFromServer(collection(db, 'booths'))
  const stale = snap.docs.filter(d => !newKeys.has(d.id))
  for (let i = 0; i < stale.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db)
    stale.slice(i, i + CHUNK_SIZE).forEach(d => batch.delete(d.ref))
    await batch.commit()
  }

  // Update session cache with new booth list
  writeCache('booths', entries.sort((a, b) => Number(a.boothNo) - Number(b.boothNo)))
}

export async function fetchAllBooths() {
  const cached = readCache('booths')
  if (cached) {
    // Return cache immediately, refresh in background
    getDocsFromServer(collection(db, 'booths')).then(snap => {
      const fresh = snap.docs.map(d => d.data()).sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
      writeCache('booths', fresh)
    }).catch(() => {})
    return cached
  }
  const snap = await getDocsFromServer(collection(db, 'booths'))
  const data = snap.docs.map(d => d.data()).sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
  writeCache('booths', data)
  return data
}

// ── Import metadata ───────────────────────────────────────────────────────────
export async function saveImportMeta(meta) {
  await setDoc(doc(db, 'voter_imports', 'latest'), {
    ...meta,
    savedAt: serverTimestamp(),
  })
}

export async function getImportMeta() {
  const snap = await getDoc(doc(db, 'voter_imports', 'latest'))
  return snap.exists() ? snap.data() : null
}

export async function deleteImportMeta() {
  await deleteDoc(doc(db, 'voter_imports', 'latest'))
}
