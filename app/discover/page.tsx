"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { GeneratingCard } from "@/components/feed/generating-card"
import { getSubjectConfig, getSubjectsForCurriculum } from "@/lib/subject-colors"
import { useUser } from "@/components/user-provider"
import { useLanguage } from "@/components/language-provider"
import {
  Search,
  Sparkles,
  Zap,
  ChevronRight,
  TrendingDown,
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
} from "lucide-react"
import Link from "next/link"
import type { WeakTopic } from "@/app/api/quiz/weak-topics/route"
import type { AgentArtifacts } from "@/lib/agent"

interface GenerationJob {
  subject: string
  topic: string
  taskId: string
  videoId: string | null
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  artifacts?: AgentArtifacts
}

const SUGGESTED_TOPICS: Record<string, string[]> = {
  Physics: ["Newton's Laws of Motion", "Electromagnetic Induction", "Quantum Physics"],
  Mathematics: ["Integration by Parts", "Probability Distributions", "Binomial Theorem"],
  Biology: ["DNA Replication", "Enzyme Kinetics", "Cell Structure and Function"],
}

function MasteryBar({ mastery }: { mastery: number }) {
  return (
    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
      <div className="h-full rounded-full bg-rose-400" style={{ width: `${mastery}%` }} />
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary" : "bg-secondary border border-border"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-primary-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-semibold leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-secondary text-foreground"
        }`}
      >
        {message.content}
        {message.artifacts?.curatedTopics && message.artifacts.curatedTopics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.artifacts.curatedTopics.map((t) => (
              <span
                key={t}
                className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
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

  // Study Buddy state
  const [chatOpen, setChatOpen] = useState(true)
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        profile?.curriculum === "DSE"
          ? "你好！我係你的 DSE Study Buddy。問我任何關於 DSE 課程的問題，我可以幫你生成影片、測驗或建議學習路徑！"
          : "Hi! I'm your IB Study Buddy powered by MiniMax. Ask me about any IB topic and I'll generate videos, quizzes, or suggest what to study next!",
    },
  ])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const chatEndRef = useRef<HTMLDivElement>(null)


  const curriculum = profile?.curriculum ?? "IB"

  // Voice recording
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const handleVoiceToggle = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return
    }

    audioChunksRef.current = []

    // Prefer ogg (supported by cantonese.ai natively); fall back to webm
    const preferredMime = MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
      ? "audio/ogg;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/ogg")
        ? "audio/ogg"
        : ""
    const recorder = preferredMime
      ? new MediaRecorder(stream, { mimeType: preferredMime })
      : new MediaRecorder(stream)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const mimeType = recorder.mimeType || "audio/ogg"
      const blob = new Blob(audioChunksRef.current, { type: mimeType })

      setIsTranscribing(true)
      try {
        const form = new FormData()
        form.append("audio", blob)
        form.append("mimeType", mimeType)

        const res = await fetch("/api/stt", { method: "POST", body: form })
        const data = await res.json() as { text?: string; error?: string }
        if (data.text) {
          setChatInput((prev) => (prev ? `${prev} ${data.text}` : (data.text ?? "")))
        }
      } finally {
        setIsTranscribing(false)
      }
    }

    recorder.start()
    setIsRecording(true)
  }, [isRecording, curriculum])
  const availableSubjects = getSubjectsForCurriculum(curriculum)

  // Scroll chat to bottom when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages])

  // Update welcome message when curriculum loads
  useEffect(() => {
    if (profile?.curriculum) {
      setMessages([
        {
          role: "assistant",
          content:
            profile.curriculum === "DSE"
              ? "你好！我係你的 DSE Study Buddy。問我任何關於 DSE 課程的問題，我可以幫你生成影片、測驗或建議學習路徑！"
              : "Hi! I'm your IB Study Buddy powered by MiniMax. Ask me about any IB topic and I'll generate videos, quizzes, or suggest what to study next!",
        },
      ])
    }
  }, [profile?.curriculum])

  // Fetch weak topics
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

  const handleSendChat = useCallback(async () => {
    const text = chatInput.trim()
    if (!text || isChatLoading) return

    const userMessage: ChatMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          curriculum: profile?.curriculum ?? "IB",
          subjects: profile?.ibSubjects ?? [],
          level: profile?.level ?? "",
        }),
      })
      const data = await res.json() as {
        reply: string
        artifacts?: AgentArtifacts
        error?: string
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.error ? `Error: ${data.error}` : data.reply,
        artifacts: data.artifacts,
      }
      setMessages((prev) => [...prev, assistantMessage])

      // If agent triggered video generation, show the generating card
      if (data.artifacts?.videoTaskId) {
        setJob({
          subject: profile?.ibSubjects?.[0] ?? "STEM",
          topic: text,
          taskId: data.artifacts.videoTaskId,
          videoId: data.artifacts.videoId ?? null,
        })
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered a network error. Please try again." },
      ])
    } finally {
      setIsChatLoading(false)
    }
  }, [chatInput, isChatLoading, sessionId, profile])

  const handleGenerate = useCallback(
    async (subject: string, topic: string) => {
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
        const data = (await res.json()) as {
          videoId: string | null
          taskId: string
          status: string
          error?: string
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
    },
    [profile?.interests]
  )

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
          <p className="text-sm font-semibold text-muted-foreground">{t("discover.sub")}</p>
        </div>

        {/* Study Buddy Chat Panel */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-card">
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-foreground">Study Buddy</p>
                <p className="text-[10px] font-semibold text-muted-foreground">
                  Powered by MiniMax · {curriculum} mode
                </p>
              </div>
            </div>
            {chatOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {chatOpen && (
            <>
              {/* Messages */}
              <div className="flex max-h-64 flex-col gap-3 overflow-y-auto border-t border-border px-4 py-3">
                {messages.map((msg, i) => (
                  <ChatBubble key={i} message={msg} />
                ))}
                {isChatLoading && (
                  <div className="flex gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary border border-border">
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-secondary px-4 py-2.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2 border-t border-border px-3 py-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendChat()
                    }
                  }}
                  placeholder={
                    isRecording
                      ? curriculum === "DSE" ? "正在錄音..." : "Listening..."
                      : isTranscribing
                        ? curriculum === "DSE" ? "正在轉錄..." : "Transcribing..."
                        : curriculum === "DSE"
                          ? "問我 DSE Physics 波動學..."
                          : "Ask about IB Physics waves, DSE Math calculus..."
                  }
                  className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleVoiceToggle}
                  disabled={isTranscribing}
                  title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Record voice"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 ${
                    isRecording
                      ? "animate-pulse bg-rose-500 text-white shadow-lg shadow-rose-500/40"
                      : isTranscribing
                        ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                        : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : isTranscribing ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
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
          <div
            className="mb-6 overflow-hidden rounded-2xl border border-border"
            style={{ height: 400 }}
          >
            <GeneratingCard
              subject={job.subject}
              topic={job.topic}
              taskId={job.taskId}
              videoId={job.videoId}
              onReady={() => setJob(null)}
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
            {availableSubjects.map((subject) => {
              const c = getSubjectConfig(subject)
              const isSelected = selectedSubject === subject
              return (
                <button
                  key={subject}
                  onClick={() => {
                    setSelectedSubject(subject)
                    setTopicInput("")
                  }}
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
                      cfg
                        ? `${cfg.border} ${cfg.bg} ${cfg.color}`
                        : "border-border bg-secondary text-muted-foreground"
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

        {/* Browse all topics */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            {t("discover.browse")}
          </h2>
          {availableSubjects.map((subject) => {
            const c = getSubjectConfig(subject)
            return (
              <div
                key={subject}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
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
          <p className="mb-3 text-sm font-bold text-foreground">{t("discover.feed.cta")}</p>
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
