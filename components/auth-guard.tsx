"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session?.authed) {
      router.replace("/auth")
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session?.authed) return null

  return <>{children}</>
}
