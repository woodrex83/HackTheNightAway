"use client"

import { useRef, useEffect, useState, useCallback, forwardRef } from "react"
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react"
import { getSubjectConfig } from "@/lib/subject-colors"
import { useLanguage } from "@/components/language-provider"
import type { FeedItem } from "@/lib/supabase/types"

interface VideoPlayerProps {
  item: FeedItem
  isActive: boolean
  onEnded: () => void
}

interface SrtCue {
  start: number
  end: number
  text: string
}

function parseSrt(srt: string): SrtCue[] {
  const cues: SrtCue[] = []
  const blocks = srt.trim().split(/\n\s*\n/)
  for (const block of blocks) {
    const lines = block.trim().split("\n")
    if (lines.length < 3) continue
    const timeLine = lines[1]
    const match = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    )
    if (!match) continue
    const toSec = (h: string, m: string, s: string, ms: string) =>
      parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000
    cues.push({
      start: toSec(match[1], match[2], match[3], match[4]),
      end: toSec(match[5], match[6], match[7], match[8]),
      text: lines.slice(2).join(" "),
    })
  }
  return cues
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= level ? "bg-white" : "bg-white/30"}`}
        />
      ))}
    </div>
  )
}

function MockVideoCard({ topic, subject }: { topic: string; subject: string }) {
  const cfg = getSubjectConfig(subject)
  const { t } = useLanguage()
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-background via-secondary to-background px-8 text-center">
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-3xl ${cfg.bg} border-2 ${cfg.border} shadow-2xl`}
      >
        <span className="text-5xl">{cfg.icon}</span>
      </div>
      <div className="flex flex-col gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${cfg.bg} ${cfg.color} ${cfg.border} border w-fit mx-auto`}
        >
          {subject}
        </span>
        <h2 className="text-2xl font-black text-foreground leading-tight">{topic}</h2>
        <p className="text-sm font-semibold text-muted-foreground">
          AI-generated video will appear here once your Minimax API key is configured and the
          video finishes processing.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span className="text-xs font-bold text-primary">{t("feed.demo")}</span>
      </div>
    </div>
  )
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer({ item, isActive, onEnded }, _ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)

    // Audio narration state
    const [audioState, setAudioState] = useState<"idle" | "loading" | "ready" | "error">("idle")
    const [audioSrc, setAudioSrc] = useState<string | null>(null)
    const [subtitleCues, setSubtitleCues] = useState<SrtCue[]>([])
    const [currentCaption, setCurrentCaption] = useState("")

    const { lang, t } = useLanguage()
    const isCantoneseMode = lang === "zh-HK"

    const topic = item.video.topics
    const cfg = getSubjectConfig(topic?.subject ?? "")
    const hasVideo = !!item.video.url

    // Fetch cantonese audio on-demand when card becomes active in Cantonese mode
    useEffect(() => {
      if (!isActive || !isCantoneseMode) return
      if (audioState !== "idle") return

      // Use pre-generated audio from DB if available
      if (item.video.audio_url) {
        setAudioSrc(item.video.audio_url)
        if (item.video.subtitle_srt) {
          setSubtitleCues(parseSrt(item.video.subtitle_srt))
        }
        setAudioState("ready")
        return
      }

      // Fetch on-demand
      const subject = topic?.subject ?? ""
      const topicTitle = topic?.title ?? ""
      if (!subject || !topicTitle) return

      setAudioState("loading")
      fetch("/api/audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicTitle, subject, language: "cantonese" }),
      })
        .then((r) => r.json())
        .then((data: { audioBase64?: string | null; mimeType?: string; subtitleSrt?: string; error?: string }) => {
          if (data.error) {
            setAudioState("error")
            return
          }
          if (data.audioBase64) {
            setAudioSrc(`data:${data.mimeType ?? "audio/mp3"};base64,${data.audioBase64}`)
          }
          if (data.subtitleSrt) {
            setSubtitleCues(parseSrt(data.subtitleSrt))
          }
          setAudioState("ready")
        })
        .catch(() => setAudioState("error"))
    }, [isActive, isCantoneseMode, audioState, item.video.audio_url, item.video.subtitle_srt, topic])

    // Reset audio state when language switches back to English or card is no longer active
    useEffect(() => {
      if (!isCantoneseMode) {
        const audio = audioRef.current
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
        setCurrentCaption("")
      }
    }, [isCantoneseMode])

    // Control video playback
    useEffect(() => {
      const video = videoRef.current
      if (!video || !hasVideo) return

      if (isActive) {
        // Loop video in Cantonese mode (audio is longer than 6s video)
        video.loop = isCantoneseMode
        video.muted = isCantoneseMode
        video.play().catch(() => {})
      } else {
        video.pause()
        video.currentTime = 0
      }
    }, [isActive, hasVideo, isCantoneseMode])

    // Control audio element when state becomes ready
    useEffect(() => {
      const audio = audioRef.current
      if (!audio || !audioSrc) return
      audio.src = audioSrc

      if (isActive && isCantoneseMode && audioState === "ready") {
        audio.play().catch(() => {})
      } else {
        audio.pause()
        audio.currentTime = 0
      }
    }, [audioSrc, isActive, isCantoneseMode, audioState])

    // Video event listeners
    useEffect(() => {
      const video = videoRef.current
      if (!video) return

      const onTimeUpdate = () => {
        if (video.duration) {
          setProgress((video.currentTime / video.duration) * 100)
        }
      }
      const onLoadedMetadata = () => setDuration(video.duration)
      const onPlay = () => setIsPlaying(true)
      const onPause = () => setIsPlaying(false)
      const onEndedHandler = () => {
        // In English mode, video end triggers quiz
        if (!isCantoneseMode) {
          setIsPlaying(false)
          onEnded()
        }
      }

      video.addEventListener("timeupdate", onTimeUpdate)
      video.addEventListener("loadedmetadata", onLoadedMetadata)
      video.addEventListener("play", onPlay)
      video.addEventListener("pause", onPause)
      video.addEventListener("ended", onEndedHandler)

      return () => {
        video.removeEventListener("timeupdate", onTimeUpdate)
        video.removeEventListener("loadedmetadata", onLoadedMetadata)
        video.removeEventListener("play", onPlay)
        video.removeEventListener("pause", onPause)
        video.removeEventListener("ended", onEndedHandler)
      }
    }, [onEnded, isCantoneseMode])

    // Audio event listeners for captions + quiz trigger
    useEffect(() => {
      const audio = audioRef.current
      if (!audio) return

      const onTimeUpdate = () => {
        const t = audio.currentTime
        const cue = subtitleCues.find((c) => t >= c.start && t < c.end)
        setCurrentCaption(cue?.text ?? "")
      }
      const onEnded = () => {
        // In Cantonese mode, audio end triggers quiz
        if (isCantoneseMode) {
          setCurrentCaption("")
          onEndedCantoneseMode()
        }
      }

      audio.addEventListener("timeupdate", onTimeUpdate)
      audio.addEventListener("ended", onEnded)

      return () => {
        audio.removeEventListener("timeupdate", onTimeUpdate)
        audio.removeEventListener("ended", onEnded)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtitleCues, isCantoneseMode])

    const onEndedCantoneseMode = useCallback(() => {
      setIsPlaying(false)
      onEnded()
    }, [onEnded])

    const togglePlay = () => {
      const video = videoRef.current
      if (!video) return
      if (video.paused) {
        video.play()
        audioRef.current?.play().catch(() => {})
      } else {
        video.pause()
        audioRef.current?.pause()
      }
    }

    const toggleMute = () => {
      const video = videoRef.current
      if (!video) return
      video.muted = !video.muted
      setIsMuted(video.muted)
    }

    const formatTime = (s: number) =>
      `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

    const displayTitle =
      isCantoneseMode && topic?.title_zh ? topic.title_zh : (topic?.title ?? "Topic")

    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {/* Hidden audio element for Cantonese narration */}
        <audio ref={audioRef} preload="none" />

        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              src={item.video.url!}
              className="h-full w-full object-cover"
              muted={isMuted || isCantoneseMode}
              playsInline
              loop={isCantoneseMode}
              preload={isActive ? "auto" : "metadata"}
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 z-10 flex items-center justify-center"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {!isPlaying && (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                  <Play className="h-8 w-8 text-white" />
                </div>
              )}
            </button>
          </>
        ) : (
          <MockVideoCard topic={displayTitle} subject={topic?.subject ?? "Subject"} />
        )}

        {/* Top gradient + info */}
        <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/60 via-black/20 to-transparent p-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <span
                className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.color} border ${cfg.border}`}
              >
                {topic?.subject}
              </span>
              {item.isReview && (
                <span className="w-fit rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400">
                  {t("feed.review")}
                </span>
              )}
            </div>
            <DifficultyDots level={topic?.difficulty ?? 1} />
          </div>
        </div>

        {/* Cantonese audio loading indicator */}
        {isCantoneseMode && audioState === "loading" && (
          <div className="absolute inset-x-0 top-16 z-20 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-[10px] font-bold text-white">{t("feed.audio.loading")}</span>
            </div>
          </div>
        )}

        {/* SRT caption overlay */}
        {isCantoneseMode && currentCaption && (
          <div className="absolute inset-x-4 bottom-28 z-20 flex justify-center">
            <div className="rounded-xl bg-black/75 px-4 py-2 backdrop-blur-sm text-center">
              <p className="text-sm font-bold leading-snug text-white">{currentCaption}</p>
            </div>
          </div>
        )}

        {/* Bottom gradient + controls */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-6">
          {hasVideo && !isCantoneseMode && (
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-black leading-tight text-white line-clamp-2">
                {displayTitle}
              </h3>
              {topic?.curriculum_tag && (
                <span className="text-xs font-semibold text-white/60">
                  {topic.curriculum_tag}
                </span>
              )}
              {hasVideo && duration > 0 && !isCantoneseMode && (
                <span className="text-[10px] font-bold text-white/40">
                  {formatTime(duration * (progress / 100))} / {formatTime(duration)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isCantoneseMode && audioState === "ready" && (
                <div className="flex h-10 items-center justify-center rounded-full bg-primary/30 px-3 backdrop-blur-sm">
                  <span className="text-[10px] font-black text-primary">廣東話</span>
                </div>
              )}
              {hasVideo && !isCantoneseMode && (
                <button
                  onClick={toggleMute}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-white" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-white" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
