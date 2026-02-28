"use client"

import { useState, useCallback, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { GeneratingCard } from "@/components/feed/generating-card"
import { IB_SUBJECTS, getSubjectConfig } from "@/lib/subject-colors"
import { useUser } from "@/components/user-provider"
import { useLanguage } from "@/components/language-provider"
import { Search, Sparkles, Zap, ChevronRight, TrendingDown } from "lucide-react"
import Link from "next/link"
import type { WeakTopic } from "@/app/api/quiz/weak-topics/route"

interface GenerationJob {
  subject: string
  topic: string
  taskId: string
  videoId: string | null
}

const SUGGESTED_TOPICS: Record<string, string[]> = {
  Mathematics: ["Integration by Parts", "Probability Distributions", "Binomial Theorem"],
  Physics: ["Electromagnetic Induction", "Quantum Physics", "Circular Motion"],
  Chemistry: ["Le Chatelier's Principle", "Organic Reaction Mechanisms", "Entropy"],
  Biology: ["Enzyme Kinetics", "Meiosis vs Mitosis", "Ecosystem Energy Flow"],
  History: ["Cold War Origins", "Treaty of Versailles", "Rise of Fascism"],
  Economics: ["Market Failure", "Fiscal Policy", "Exchange Rate Mechanisms"],
  "English Lit": ["Unreliable Narrator", "Feminist Literary Theory", "Intertextuality"],
  "Computer Science": ["Recursion", "Binary Search Trees", "TCP/IP Protocol Stack"],
}

function MasteryBar({ mastery }: { mastery: number }) {
  return (
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full bg-rose-400"
        style={{ width: `${mastery}%` }}
      />
    </div>
  )
}

export default function DiscoverPage() {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [topicInput, setTopicInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const { profile } = useUser()
  const { t } = useLanguage()

  // Fetch weak topics for curation recommendations
  useEffect(() => {
    const userId = profile?.id
    const params = userId ? `?userId=${userId}` : ""
    fetch(`/api/quiz/weak-topics${params}`)
      .then((r) => r.json())
      .then((data: { topics?: WeakTopic[] }) => {
        if (data.topics?.length) setWeakTopics(data.topics)
      })
      .catch(() => {})
  }, [profile?.id])

  const handleGenerate = useCallback(async (subject: string, topic: string) => {
    if (!subject || !topic.trim()) return
    setIsGenerating(true)
    setError(null)
    setJob(null)

    try {
      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          topic: topic.trim(),
          interests: profile?.interests ?? "",
        }),
      })
      const data = await res.json() as {
        videoId: string | null
        taskId: string
        status: string
        error?: string
        mock?: boolean
      }

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to start video generation")
        return
      }

      setJob({ subject, topic: topic.trim(), taskId: data.taskId, videoId: data.videoId })
    } catch {
      setError("Network error — please try again")
    } finally {
      setIsGenerating(false)
    }
  }, [profile?.interests])

  const cfg = selectedSubject ? getSubjectConfig(selectedSubject) : null

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 pb-28 md:pb-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground">{t("discover.heading")}</h1>
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            {t("discover.sub")}
          </p>
        </div>

        {/* Recommended for you — weak topic curation */}
        {weakTopics.length > 0 && (
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-400" />
                <h2 className="text-sm font-black text-foreground">{t("discover.recommended")}</h2>
              </div>
              <p className="text-xs font-semibold text-muted-foreground pl-6">
                {t("discover.recommended.sub")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {weakTopics.map((wt) => {
                const c = getSubjectConfig(wt.subject)
                return (
                  <div
                    key={`${wt.subject}-${wt.topic}`}
                    className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3"
                  >
                    <span className="text-xl">{c.icon}</span>
                    <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-bold text-foreground">{wt.topic}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black ${c.color}`}>{wt.subject}</span>
                        <MasteryBar mastery={wt.mastery} />
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {wt.mastery}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGenerate(wt.subject, wt.topic)}
                      disabled={isGenerating}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:opacity-40"
                    >
                      <Zap className="h-3 w-3" />
                      {t("discover.generate")}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Generation result */}
        {job && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-border" style={{ height: 400 }}>
            <GeneratingCard
              subject={job.subject}
              topic={job.topic}
              taskId={job.taskId}
              videoId={job.videoId}
              onReady={(url) => {
                setJob(null)
                alert(`Video ready! URL: ${url.slice(0, 80)}...`)
              }}
              onFailed={() => {
                setError("Video generation failed. Please try again.")
                setJob(null)
              }}
            />
          </div>
        )}

        {/* Subject selector */}
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {t("discover.step1")}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {IB_SUBJECTS.map((subject) => {
              const c = getSubjectConfig(subject)
              const isSelected = selectedSubject === subject
              return (
                <button
                  key={subject}
                  onClick={() => { setSelectedSubject(subject); setTopicInput("") }}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                    isSelected
                      ? `${c.border} ${c.bg} ${c.color}`
                      : "border-border bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{c.icon}</span>
                  <span className="truncate">{subject}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Topic input */}
        {selectedSubject && (
          <div className="mb-4 flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {t("discover.step2")}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGenerate(selectedSubject, topicInput)
                  }}
                  placeholder={`e.g. ${SUGGESTED_TOPICS[selectedSubject]?.[0] ?? "Enter topic..."}`}
                  className="h-12 w-full rounded-xl border border-border bg-secondary pl-10 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={() => handleGenerate(selectedSubject, topicInput)}
                disabled={!topicInput.trim() || isGenerating}
                className={`flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 ${
                  cfg ? "shadow-primary/30" : ""
                } bg-primary`}
              >
                {isGenerating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {t("discover.generate")}
              </button>
            </div>

            {/* Suggested topics */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("discover.suggested")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TOPICS[selectedSubject]?.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setTopicInput(topic)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition-all hover:-translate-y-0.5 ${
                      cfg ? `${cfg.border} ${cfg.bg} ${cfg.color}` : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3">
            <p className="text-sm font-bold text-destructive">{error}</p>
          </div>
        )}

        {/* Explore all topics by subject */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            {t("discover.browse")}
          </h2>
          {IB_SUBJECTS.map((subject) => {
            const c = getSubjectConfig(subject)
            return (
              <div key={subject} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className={`flex items-center gap-3 px-4 py-3 ${c.bg}`}>
                  <span className="text-xl">{c.icon}</span>
                  <span className={`text-sm font-black ${c.color}`}>{subject}</span>
                </div>
                <div className="flex flex-col divide-y divide-border">
                  {SUGGESTED_TOPICS[subject]?.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setSelectedSubject(subject)
                        setTopicInput(topic)
                      }}
                      className="flex items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                    >
                      {topic}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Go to feed CTA */}
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="mb-3 text-sm font-bold text-foreground">
            {t("discover.feed.cta")}
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5"
          >
            {t("discover.feed.btn")}
            <Zap className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
