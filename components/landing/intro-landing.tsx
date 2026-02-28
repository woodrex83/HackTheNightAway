"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Eye, EyeOff, BookOpen, Trophy, Flame, Zap, X } from "lucide-react"

// Prefer the CDN URL set at build time; fall back to the local public copy
const INTRO_VIDEO =
  process.env.NEXT_PUBLIC_INTRO_VIDEO_URL || "/intro.mp4"

// How long into the video before the login popup appears
const POPUP_DELAY_MS = 6000

export function IntroLanding() {
  const [phase, setPhase] = useState<"video" | "auth-popup">("video")
  const [showPopup, setShowPopup] = useState(false)

  // Auth form state
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { signIn } = useAuth()
  const router = useRouter()

  // Start popup timer on mount
  useEffect(() => {
    popupTimerRef.current = setTimeout(() => {
      setShowPopup(true)
    }, POPUP_DELAY_MS)
    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
    }
  }, [])

  const handleVideoTap = useCallback(() => {
    if (!showPopup) {
      setShowPopup(true)
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
    }
  }, [showPopup])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!username.trim() || !password.trim()) {
        setError("Please fill in all fields")
        return
      }
      setIsSubmitting(true)
      setError(null)

      if (mode === "signup" && username !== "test") {
        setError("Sign-up is invite-only. Use the demo account: test / test")
        setIsSubmitting(false)
        return
      }

      const result = signIn(username, password)
      if (!result.success) {
        setError(result.error ?? "Invalid credentials")
        setIsSubmitting(false)
        return
      }

      const onboarded = localStorage.getItem("ib_onboarded")
      router.push(onboarded ? "/feed" : "/onboarding")
    },
    [username, password, mode, signIn, router]
  )

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      {/* Local intro video — served from /public/intro.mp4 */}
      <video
        ref={videoRef}
        src={INTRO_VIDEO}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        onClick={handleVideoTap}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

      {/* Brand header */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-center pt-14 z-10 pointer-events-none">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/40">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg">
            Learning<span className="text-primary"> Solo</span>
          </h1>
        </div>
      </div>

      {/* Bottom CTA — tap hint */}
      {!showPopup && (
        <div
          className="absolute inset-x-0 bottom-10 z-10 flex flex-col items-center gap-4 px-6 text-center"
          onClick={handleVideoTap}
        >
          <p className="text-xs font-bold text-white/50 animate-pulse">Tap to get started</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: BookOpen, label: "AI Videos" },
              { icon: Trophy, label: "XP & Streaks" },
              { icon: Flame, label: "Spaced Repetition" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm"
              >
                <Icon className="h-3 w-3 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Auth popup — bottom sheet */}
      {showPopup && (
        <>
          {/* Backdrop tap to dismiss */}
          <div
            className="absolute inset-0 z-20"
            onClick={() => setShowPopup(false)}
          />

          <div className="absolute inset-x-0 bottom-0 z-30 animate-in slide-in-from-bottom duration-400">
            <div className="rounded-t-3xl border-t border-white/10 bg-card/95 px-6 pt-5 pb-10 backdrop-blur-2xl shadow-2xl">
              {/* Handle bar */}
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

              {/* Close */}
              <button
                onClick={() => setShowPopup(false)}
                className="absolute right-5 top-5 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Heading */}
              <div className="mb-5 flex flex-col gap-1">
                <h2 className="text-2xl font-black text-foreground">
                  Start learning
                </h2>
                <p className="text-sm font-semibold text-muted-foreground">
                  Sign in to track your progress, earn XP and unlock your feed.
                </p>
              </div>

              {/* Tab switcher */}
              <div className="mb-4 flex rounded-xl bg-secondary p-1">
                <button
                  onClick={() => { setMode("signin"); setError(null) }}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                    mode === "signin"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode("signup"); setError(null) }}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                    mode === "signup"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  className="h-12 w-full rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    className="h-12 w-full rounded-xl border border-border bg-secondary px-4 pr-12 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {error && (
                  <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <div className="mt-4 rounded-xl bg-secondary/60 p-3">
                <p className="text-center text-xs font-semibold text-muted-foreground">
                  Demo account: <span className="font-black text-foreground">test / test</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

