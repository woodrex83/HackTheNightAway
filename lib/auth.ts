const HARDCODED_USERS = [
  { username: "test", password: "test" },
]

const STORAGE_KEY = "ib_auth"

export interface AuthSession {
  authed: boolean
  username: string
}

export function checkCredentials(username: string, password: string): boolean {
  return HARDCODED_USERS.some(
    (u) => u.username === username && u.password === password
  )
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function saveSession(username: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ authed: true, username }))
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

export function isAuthed(): boolean {
  const session = getSession()
  return session?.authed === true
}
