"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthed } from "@/lib/auth"
import { IntroLanding } from "@/components/landing/intro-landing"

export default function RootPage() {
  const router = useRouter()
  const [showLanding, setShowLanding] = useState(false)

  useEffect(() => {
    if (isAuthed()) {
      const onboarded = localStorage.getItem("ib_onboarded")
      router.replace(onboarded ? "/feed" : "/onboarding")
    } else {
      setShowLanding(true)
    }
  }, [router])

  if (!showLanding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <IntroLanding />
}
