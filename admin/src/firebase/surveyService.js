import {
  collection, doc, onSnapshot, addDoc, updateDoc,
  serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import { db } from './config'
import { readCache, writeCache } from '../utils/fsCache'

const COL = 'surveys'

export function subscribeSurveyForms(cb, onError) {
  const cached = readCache(COL)
  if (cached) cb(cached)
  const q = query(collection(db, COL), orderBy('_createdAt', 'desc'))
  return onSnapshot(q, snap => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    writeCache(COL, data)
    cb(data)
  }, onError)
}

export async function createSurveyForm(data) {
  const now = new Date().toISOString().slice(0, 10)
  await addDoc(collection(db, COL), {
    ...data,
    linkedPhases: data.linkedPhases || [],
    createdBy: data.createdBy || 'Admin',
    createdAt: now,
    updatedAt: now,
    _createdAt: serverTimestamp(),
  })
}

export async function updateSurveyForm(id, data) {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: new Date().toISOString().slice(0, 10),
  })
}
