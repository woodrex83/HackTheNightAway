"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getSession, saveSession, clearSession, checkCredentials, type AuthSession } from "@/lib/auth"

interface AuthContextType {
  session: AuthSession | null
  isLoading: boolean
  signIn: (username: string, password: string) => { success: boolean; error?: string }
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  signIn: () => ({ success: false }),
  signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const existing = getSession()
    setSession(existing)
    setIsLoading(false)
  }, [])

  const signIn = useCallback((username: string, password: string) => {
    if (!checkCredentials(username, password)) {
      return { success: false, error: "Invalid username or password" }
    }
    saveSession(username)
    const newSession = { authed: true, username }
    setSession(newSession)
    return { success: true }
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
    router.push("/auth")
  }, [router])

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
