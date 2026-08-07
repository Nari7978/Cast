import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDAbp1uhMq4higEf5oOraJfL_4OftxqJSs',
  authDomain: 'cast-90a83.firebaseapp.com',
  projectId: 'cast-90a83',
  storageBucket: 'cast-90a83.firebasestorage.app',
  messagingSenderId: '768718236564',
  appId: '1:768718236564:web:368180d2ad56cbf3cb3d81',
  measurementId: 'G-Y4LYCW8RDZ',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

// Persist all Firestore data to IndexedDB — refreshes show cached data instantly
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

export default app
