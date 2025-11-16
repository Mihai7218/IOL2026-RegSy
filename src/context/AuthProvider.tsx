'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, User, signOut } from 'firebase/auth'
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
        try {
          let nextClaims: Claims = {}

          const adminDoc = await getDoc(doc(db, 'admins', u.uid))
          if (adminDoc.exists()) {
            nextClaims.admin = true
          }

          const countryDoc = await getDoc(doc(db, 'countries', u.uid))
          if (countryDoc.exists()) {
            nextClaims.country = true
            nextClaims.countryKey = countryDoc.data().country_name
          }

          setClaims(nextClaims)
        } catch (e) {
          console.error('Failed to resolve claims from Firestore', e)
          setClaims(undefined)
        }
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
