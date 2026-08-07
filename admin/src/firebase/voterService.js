import {
  collection, doc, writeBatch, serverTimestamp,
  setDoc, getDoc, getDocs, deleteDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage'
import { db, storage } from './config'
import { parseCSV, detectCols } from '../utils/csvUtils'

const CHUNK_SIZE = 400

// ── CSV → Firebase Storage (replaces Firestore batch writes) ─────────────────
// Uploads the raw CSV file as a single object. Near-instant regardless of row count.
export async function uploadVoterCSV(file, onProgress) {
  const storageRef = ref(storage, 'voter_imports/latest.csv')
  // Use uploadBytesResumable if you want per-byte progress; uploadBytes is fine for <50MB
  await uploadBytes(storageRef, file, { contentType: 'text/csv' })
  onProgress?.('done')
  return getDownloadURL(storageRef)
}

// Download the CSV from Storage and return its text content
export async function downloadVoterCSV(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CSV download failed: ${res.status}`)
  return res.text()
}

// Get the download URL for the latest voter CSV directly from Storage
// (works even when Firestore meta was deleted)
export async function getVoterCSVDownloadURL() {
  return getDownloadURL(ref(storage, 'voter_imports/latest.csv'))
}

// Download the latest CSV text using Firebase SDK (no CORS issues, no fetch needed)
export async function downloadVoterCSVFromStorage() {
  const blob = await getBlob(ref(storage, 'voter_imports/latest.csv'))
  return blob.text()
}

// Rebuild booths collection from the Storage CSV backup.
// Called automatically when fetchAllBooths() returns empty but a CSV backup exists.
// Returns the rebuilt booth array, or [] if no backup found.
export async function recoverBoothsFromStorage() {
  let text
  try {
    const blob = await getBlob(ref(storage, 'voter_imports/latest.csv'))
    text = await blob.text()
  } catch { return [] }

  const { headers, voters } = parseCSV(text)
  if (voters.length === 0) return []

  const { boothCol, stationCol } = detectCols(headers, voters.slice(0, 50))

  const boothMap = {}
  voters.forEach(v => {
    const key = String(v[boothCol] || '').trim()
    if (!key) return
    if (!boothMap[key]) boothMap[key] = { boothNo: key, pollingStation: v[stationCol] || '', voterCount: 0 }
    boothMap[key].voterCount++
  })

  const entries = Object.values(boothMap)
  if (entries.length === 0) return []

  // Write back to Firestore
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db)
    entries.slice(i, i + CHUNK_SIZE).forEach(booth => batch.set(doc(db, 'booths', booth.boothNo), booth))
    await batch.commit()
  }

  return entries.sort((a, b) => Number(a.boothNo) - Number(b.boothNo))
}

// ── Booths (small collection, kept in Firestore) ─────────────────────────────

// Delete all existing booth docs — used both before re-upload and when clearing all data.
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

  // Clear old data first so re-uploads never leave stale docs
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
