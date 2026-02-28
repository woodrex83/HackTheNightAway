"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"

export interface UserProfile {
  id: string
  username: string
  curriculum: "IB" | "DSE"
  level: string
  ibSubjects: string[]
  interests: string
  xp: number
  streak: number
  lastActive: string
  onboarded: boolean
}

interface UserContextType {
  profile: UserProfile | null
  isLoading: boolean
  updateProfile: (updates: Partial<UserProfile>) => void
  addXp: (amount: number) => void
  incrementStreak: () => void
}

const UserContext = createContext<UserContextType>({
  profile: null,
  isLoading: true,
  updateProfile: () => {},
  addXp: () => {},
  incrementStreak: () => {},
})

export function useUser() {
  return useContext(UserContext)
}

const USER_STORAGE_KEY = "ib_user_profile"

function defaultProfile(username: string): UserProfile {
  return {
    id: crypto.randomUUID(),
    username,
    curriculum: "IB",
    level: "",
    ibSubjects: [],
    interests: "",
    xp: 0,
    streak: 0,
    lastActive: new Date().toISOString().slice(0, 10),
    onboarded: false,
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY)
      const authRaw = localStorage.getItem("ib_auth")
      const auth = authRaw ? JSON.parse(authRaw) : null
      const username = auth?.username ?? "student"

      if (raw) {
        setProfile(JSON.parse(raw) as UserProfile)
      } else if (auth?.authed) {
        const fresh = defaultProfile(username)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fresh))
        setProfile(fresh)
      }
    } catch {
      // ignore
    }
    setIsLoading(false)
  }, [])

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const addXp = useCallback((amount: number) => {
    setProfile((prev) => {
      if (!prev) return prev
      const updated = { ...prev, xp: prev.xp + amount }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const incrementStreak = useCallback(() => {
    setProfile((prev) => {
      if (!prev) return prev
      const today = new Date().toISOString().slice(0, 10)
      if (prev.lastActive === today) return prev
      const updated = { ...prev, streak: prev.streak + 1, lastActive: today }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <UserContext.Provider
      value={{ profile, isLoading, updateProfile, addXp, incrementStreak }}
    >
      {children}
    </UserContext.Provider>
  )
}
