import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import { db } from './config'
import { readCache, writeCache } from '../utils/fsCache'

const COL = 'agents'

export function subscribeAgents(cb, onError) {
  const cached = readCache(COL)
  if (cached) cb(cached)
  const q = query(collection(db, COL), orderBy('_createdAt', 'desc'))
  return onSnapshot(q, snap => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    writeCache(COL, data)
    cb(data)
  }, onError)
}

export async function createAgent(data) {
  const now = new Date().toISOString().slice(0, 10)
  await addDoc(collection(db, COL), {
    ...data,
    created: now,
    updated: now,
    _createdAt: serverTimestamp(),
  })
}

export async function updateAgent(id, data) {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updated: new Date().toISOString().slice(0, 10),
  })
}

export async function deleteAgent(id) {
  await deleteDoc(doc(db, COL, id))
}
