import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { Vote, Loader2 } from 'lucide-react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        const ref = doc(db, 'users', firebaseUser.uid)
        let profile = {}
        try {
          const snap = await getDoc(ref)
          if (snap.exists()) {
            profile = snap.data()
          } else {
            // First login — create profile with default admin role
            profile = { name: firebaseUser.email.split('@')[0], role: 'admin' }
            await setDoc(ref, { ...profile, email: firebaseUser.email, createdAt: serverTimestamp() })
          }
        } catch {
          profile = { name: firebaseUser.email.split('@')[0], role: 'admin' }
        }
        setUser({
          uid:   firebaseUser.uid,
          email: firebaseUser.email,
          name:  profile.name || firebaseUser.email,
          role:  profile.role || 'admin',
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: '#5B5CEB' }}>
            <Vote size={24} className="text-white" />
          </div>
          <Loader2 size={20} className="animate-spin" style={{ color: '#5B5CEB' }} />
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
