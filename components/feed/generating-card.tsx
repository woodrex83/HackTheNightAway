"use client"

import { useEffect, useState } from "react"
import { Loader2, Zap } from "lucide-react"
import { getSubjectConfig } from "@/lib/subject-colors"

interface GeneratingCardProps {
  subject: string
  topic: string
  taskId: string
  videoId: string | null
  onReady: (url: string) => void
  onFailed: () => void
}

const POLL_INTERVAL = 5000

const STATUS_MESSAGES = [
  "Generating your video...",
  "Creating visuals...",
  "Rendering motion graphics...",
  "Almost ready...",
]

export function GeneratingCard({
  subject,
  topic,
  taskId,
  videoId,
  onReady,
  onFailed,
}: GeneratingCardProps) {
  const [messageIdx, setMessageIdx] = useState(0)
  const cfg = getSubjectConfig(subject)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMessageIdx((i) => (i + 1) % STATUS_MESSAGES.length)
    }, 3000)
    return () => clearInterval(msgTimer)
  }, [])

  useEffect(() => {
    if (taskId.startsWith("mock-task-")) return

    const poll = async () => {
      try {
        const params = new URLSearchParams({ taskId })
        if (videoId) params.set("videoId", videoId)
        const res = await fetch(`/api/video/status?${params}`)
        const data = await res.json() as { status: string; url?: string }
        if (data.status === "ready" && data.url) {
          onReady(data.url)
        } else if (data.status === "failed") {
          onFailed()
        }
      } catch {
        // ignore poll errors
      }
    }

    const timer = setInterval(poll, POLL_INTERVAL)
    poll()
    return () => clearInterval(timer)
  }, [taskId, videoId, onReady, onFailed])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-background px-8 text-center">
      <div className={`relative flex h-24 w-24 items-center justify-center rounded-3xl ${cfg.bg} border-2 ${cfg.border}`}>
        <span className="text-5xl">{cfg.icon}</span>
        <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${cfg.bg} ${cfg.color} ${cfg.border} border w-fit mx-auto`}>
          {subject}
        </span>
        <h2 className="text-xl font-black text-foreground">{topic}</h2>
        <p className="text-sm font-semibold text-muted-foreground">
          {STATUS_MESSAGES[messageIdx]}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-bold text-primary">
          AI video generation takes 2-5 minutes
        </span>
      </div>
    </div>
  )
}
