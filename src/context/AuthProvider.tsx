'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, User, getIdTokenResult, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Claims } from '@/lib/roles'

type AuthContextType = {
  user: User | null
  claims?: Claims
  loading: boolean
  logout: () => Promise<void>
}

import { createContext, useContext } from 'react'
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
        const result = await getIdTokenResult(u, true)
        setClaims(result.claims as Claims)
      } else {
        setClaims(undefined)
      }
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextType>(() => ({
    user, claims, loading,
    logout: () => signOut(auth)
  }), [user, claims, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
