"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { useUser } from "@/components/user-provider"
import { useLanguage } from "@/components/language-provider"
import { getSubjectConfig, getSubjectsForCurriculum } from "@/lib/subject-colors"
import { ArrowRight, Check, Sparkles, Zap, GraduationCap } from "lucide-react"

type Curriculum = "IB" | "DSE"

const CURRICULUM_OPTIONS: {
  id: Curriculum
  label: string
  sub: string
  badge: string
  icon: string
}[] = [
  {
    id: "IB",
    label: "IB Diploma Programme",
    sub: "International Baccalaureate — global curriculum for ages 16-19",
    badge: "IB",
    icon: "🌐",
  },
  {
    id: "DSE",
    label: "DSE Hong Kong",
    sub: "香港中學文憑 — local Hong Kong secondary curriculum",
    badge: "DSE",
    icon: "🏙",
  },
]

const IB_LEVELS = ["HL", "SL"]
const DSE_MATH_MODULES = ["Core", "Module 1 (M1)", "Module 2 (M2)"]

function CurriculumCard({
  option,
  selected,
  onSelect,
}: {
  option: (typeof CURRICULUM_OPTIONS)[number]
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-all active:scale-95 ${
        selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border bg-card hover:border-border/80 hover:bg-secondary"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Check className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{option.icon}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
            selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          }`}
        >
          {option.badge}
        </span>
      </div>
      <div>
        <p className={`text-sm font-black ${selected ? "text-foreground" : "text-foreground"}`}>
          {option.label}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{option.sub}</p>
      </div>
    </button>
  )
}

function SubjectCard({
  subject,
  selected,
  onToggle,
}: {
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
  const [step, setStep] = useState(0)
  const [curriculum, setCurriculum] = useState<Curriculum>("IB")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [level, setLevel] = useState("")
  const [interests, setInterests] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateProfile } = useUser()
  const { t } = useLanguage()
  const router = useRouter()

  const availableSubjects = getSubjectsForCurriculum(curriculum)

  const toggleSubject = useCallback((subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    )
  }, [])

  const handleCurriculumSelect = useCallback((c: Curriculum) => {
    setCurriculum(c)
    // Clear subject selection when switching curriculum
    setSelectedSubjects([])
    setLevel("")
  }, [])

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true)
    updateProfile({
      curriculum,
      level,
      ibSubjects: selectedSubjects,
      interests,
      onboarded: true,
    })
    localStorage.setItem("ib_onboarded", "true")
    router.push("/feed")
  }, [curriculum, level, selectedSubjects, interests, updateProfile, router])

  const totalSteps = 3
  const stepLabel = `Step ${step + 1} of ${totalSteps}`

  return (
    <AuthGuard>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-60 w-60 rounded-full bg-accent/15 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          {/* Progress bar */}
          <div className="mb-8 flex items-center gap-3">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>

          {/* Step 0 — Curriculum picker */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {stepLabel}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-foreground sm:text-4xl">
                  Which curriculum are you studying?
                </h1>
                <p className="text-sm font-semibold text-muted-foreground">
                  Choose your programme so we can personalise your content and exam-style questions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CURRICULUM_OPTIONS.map((option) => (
                  <CurriculumCard
                    key={option.id}
                    option={option}
                    selected={curriculum === option.id}
                    onSelect={() => handleCurriculumSelect(option.id)}
                  />
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
                >
                  {t("onboarding.next")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 1 — Subject picker */}
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
                  {curriculum === "DSE"
                    ? "Pick the DSE subjects you are taking for the HKDSE exam."
                    : t("onboarding.step1.sub")}
                </p>
              </div>

              {/* Level selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {curriculum === "IB" ? "Your level" : "Mathematics module"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(curriculum === "IB" ? IB_LEVELS : DSE_MATH_MODULES).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLevel(l)}
                      className={`rounded-full border-2 px-4 py-1.5 text-xs font-black transition-all ${
                        level === l
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {availableSubjects.map((subject) => (
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="text-sm font-bold text-muted-foreground hover:text-foreground"
                  >
                    {t("onboarding.back")}
                  </button>
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
            </div>
          )}

          {/* Step 2 — Interests */}
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
