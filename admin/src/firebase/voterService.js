import {
  collection, doc, writeBatch, serverTimestamp,
  setDoc, getDoc, getDocs, deleteDoc,
} from 'firebase/firestore'
import { db } from './config'

const CHUNK_SIZE = 400

// ── Booths (small collection, kept in Firestore) ─────────────────────────────

export async function clearBooths() {
  const snap = await getDocs(collection(db, 'booths'))
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

  await clearBooths()

  const entries = Object.values(boothMap)
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db)
    entries.slice(i, i + CHUNK_SIZE).forEach(booth => {
      batch.set(doc(db, 'booths', booth.boothNo), booth)
    })
    await batch.commit()
  }
}

export async function fetchAllBooths() {
  const snap = await getDocs(collection(db, 'booths'))
  return snap.docs
    .map(d => d.data())
    .sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
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
