import {
  collection, doc, onSnapshot, addDoc, updateDoc,
  serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import { db } from './config'

const COL = 'phases'

export function subscribePhases(cb, onError) {
  const q = query(collection(db, COL), orderBy('_createdAt', 'desc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onError)
}

export async function createPhase(data) {
  const now = new Date().toISOString()
  await addDoc(collection(db, COL), {
    ...data,
    surveyForms: data.surveyForms || [],
    booths: data.booths || 0,
    agentsAssigned: data.agentsAssigned || 0,
    completedBooths: data.completedBooths || 0,
    pendingBooths: data.pendingBooths || 0,
    responses: data.responses || 0,
    createdAt: data.createdAt || now.slice(0, 10),
    timeline: data.timeline || [now.slice(0, 10), null, null, null, null, null],
    _createdAt: serverTimestamp(),
  })
}

export async function updatePhase(id, data) {
  await updateDoc(doc(db, COL, id), data)
}
