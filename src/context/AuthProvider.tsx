'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, User, signOut, onIdTokenChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { Claims } from '@/lib/roles'
import { doc, getDoc } from 'firebase/firestore'
import { createContext, useContext } from 'react'
import { getClaims, resetClaims } from '@/lib/claims'

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

      resetClaims()
      setClaims(await getClaims(u))

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
