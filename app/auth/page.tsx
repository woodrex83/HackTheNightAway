"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { isAuthed } from "@/lib/auth"
import { Eye, EyeOff, Zap, BookOpen, Trophy, Flame } from "lucide-react"
import { useEffect } from "react"

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthed()) {
      router.replace("/feed")
    }
  }, [router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!username.trim() || !password.trim()) {
        setError("Please fill in all fields")
        return
      }
      setIsSubmitting(true)
      setError(null)

      if (mode === "signup") {
        // For signup, only allow the hardcoded test user
        if (username !== "test") {
          setError("Sign-up is invite-only. Use the demo account: test / test")
          setIsSubmitting(false)
          return
        }
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-4/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + brand */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/30">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Learning<span className="text-primary"> Solo</span>
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              Master your IB syllabus, one video at a time
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: BookOpen, label: "AI Videos" },
              { icon: Trophy, label: "XP & Streaks" },
              { icon: Flame, label: "Spaced Repetition" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted-foreground"
              >
                <Icon className="h-3 w-3 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/20">
          {/* Tab switcher */}
          <div className="mb-6 flex rounded-xl bg-secondary p-1">
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                className="h-12 w-full rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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

          <div className="mt-5 rounded-xl bg-secondary/60 p-3">
            <p className="text-center text-xs font-semibold text-muted-foreground">
              Demo account: <span className="font-black text-foreground">test / test</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
