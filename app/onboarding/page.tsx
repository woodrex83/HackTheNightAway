"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useUser } from "@/components/user-provider"
import { useLanguage } from "@/components/language-provider"
import { IB_SUBJECTS, getSubjectConfig } from "@/lib/subject-colors"
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react"

function SubjectCard({ subject, selected, onToggle }: {
  subject: string
  selected: boolean
  onToggle: () => void
}) {
  const cfg = getSubjectConfig(subject)
  return (
    <button
      onClick={onToggle}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-95 ${
        selected
          ? `${cfg.border} ${cfg.bg} shadow-lg`
          : "border-border bg-card hover:border-border/80 hover:bg-secondary"
      }`}
    >
      {selected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      <span className="text-3xl">{cfg.icon}</span>
      <span className={`text-xs font-extrabold ${selected ? cfg.color : "text-muted-foreground"}`}>
        {subject}
      </span>
    </button>
  )
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [interests, setInterests] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateProfile } = useUser()
  const { t, lang } = useLanguage()
  const router = useRouter()

  const toggleSubject = useCallback((subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    )
  }, [])

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true)
    updateProfile({
      ibSubjects: selectedSubjects,
      interests,
      onboarded: true,
    })
    localStorage.setItem("ib_onboarded", "true")
    router.push("/feed")
  }, [selectedSubjects, interests, updateProfile, router])

  const stepLabel =
    lang === "zh-HK"
      ? `${t("onboarding.step")} ${step} ${t("onboarding.of")} 2 步`
      : `${t("onboarding.step")} ${step} ${t("onboarding.of")} 2`

  return (
    <AuthGuard>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
        {/* Blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-60 w-60 rounded-full bg-accent/15 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          {/* Progress bar */}
          <div className="mb-8 flex items-center gap-3">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {stepLabel}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-foreground sm:text-4xl">
                  {t("onboarding.step1.heading")}
                </h1>
                <p className="text-sm font-semibold text-muted-foreground">
                  {t("onboarding.step1.sub")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {IB_SUBJECTS.map((subject) => (
                  <SubjectCard
                    key={subject}
                    subject={subject}
                    selected={selectedSubjects.includes(subject)}
                    onToggle={() => toggleSubject(subject)}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {selectedSubjects.length} {t("onboarding.selected")}
                </span>
                <button
                  onClick={() => setStep(2)}
                  disabled={selectedSubjects.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-40"
                >
                  {t("onboarding.next")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg shadow-accent/30">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {stepLabel}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-foreground sm:text-4xl">
                  {t("onboarding.step2.heading")}
                </h1>
                <p className="text-sm font-semibold text-muted-foreground">
                  {t("onboarding.step2.sub")}
                </p>
              </div>

              {/* Selected subjects review */}
              <div className="flex flex-wrap gap-2">
                {selectedSubjects.map((s) => {
                  const cfg = getSubjectConfig(s)
                  return (
                    <span
                      key={s}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cfg.border} ${cfg.bg} ${cfg.color}`}
                    >
                      <span>{cfg.icon}</span>
                      {s}
                    </span>
                  )
                })}
              </div>

              <textarea
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder={t("onboarding.step2.placeholder")}
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground"
                >
                  {t("onboarding.back")}
                </button>
                <button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-black text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      {t("onboarding.start")}
                      <Zap className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
