'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, User, signOut, onIdTokenChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { Claims } from '@/lib/roles'
import { doc, getDoc } from 'firebase/firestore'
import { createContext, useContext } from 'react'

type AuthContextType = {
  user: User | null
  claims?: Claims
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, logout: async () => {} })
export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [claims, setClaims] = useState<Claims | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)

      if (u) {
        // Derive claims from Firestore instead of legacy custom claims
        let nextClaims: Claims = {}

        while (Object.keys(nextClaims).length === 0) {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', u.uid))
            if (adminDoc.exists()) {
              nextClaims.admin = true
            }
          } catch (e) {
            console.error('AuthProvider: Failed to check admin status', e)
          }

          try {
            const countryDoc = await getDoc(doc(db, 'countries', u.uid))
            if (countryDoc.exists()) {
              const countryData = countryDoc.data()
              nextClaims.country = true
              nextClaims.countryKey = countryData.country_code
            }
          } catch (e) {
            console.error('AuthProvider: Failed to check country status', e)
          }
        }

        setClaims(nextClaims)
      } else {
        setClaims(undefined)
      }

      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextType>(() => ({
    user,
    claims,
    loading,
    logout: () => signOut(auth),
  }), [user, claims, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
