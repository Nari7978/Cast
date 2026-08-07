import {
  collection, doc, onSnapshot, addDoc, deleteDoc,
  serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import { db } from './config'

const COL = 'assignments'

export function subscribeAssignments(cb) {
  const q = query(collection(db, COL), orderBy('_createdAt', 'desc'))
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

export async function createAssignment(data) {
  const now = new Date().toISOString().slice(0, 10)
  await addDoc(collection(db, COL), {
    ...data,
    createdAt: now,
    createdBy: data.createdBy || 'Admin',
    _createdAt: serverTimestamp(),
  })
}

export async function deleteAssignment(id) {
  await deleteDoc(doc(db, COL, id))
}
