"use client"

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react"
import { VideoPlayer } from "@/components/feed/video-player"
import { QuizOverlay } from "@/components/feed/quiz-overlay"
import { XpToast } from "@/components/feed/xp-toast"
import { useUser } from "@/components/user-provider"
import { useLanguage } from "@/components/language-provider"
import type { FeedItem } from "@/lib/supabase/types"

interface VideoFeedProps {
  initialItems: FeedItem[]
  subjects: string[]
  userId?: string
}

type CardState = "video" | "quiz" | "done"

interface CardData {
  item: FeedItem
  state: CardState
}

export function VideoFeed({ initialItems, subjects, userId }: VideoFeedProps) {
  const [cards, setCards] = useState<CardData[]>(
    initialItems.map((item) => ({ item, state: "video" }))
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [xpToast, setXpToast] = useState<{ xp: number; streak: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { addXp, incrementStreak, profile } = useUser()
  const { t } = useLanguage()

  // Load more items when near end
  useEffect(() => {
    if (activeIndex < cards.length - 2) return
    const params = new URLSearchParams()
    if (subjects.length > 0) params.set("subjects", subjects.join(","))
    if (userId) params.set("userId", userId)

    fetch(`/api/feed?${params}`)
      .then((r) => r.json())
      .then((data: { items?: FeedItem[] }) => {
        if (!data.items?.length) return
        setCards((prev) => {
          const existingIds = new Set(prev.map((c) => c.item.video.id))
          const newCards = data.items!
            .filter((i) => !existingIds.has(i.video.id))
            .map((item) => ({ item, state: "video" as CardState }))
          return [...prev, ...newCards]
        })
      })
      .catch(() => {})
  }, [activeIndex, subjects, userId, cards.length])

  // Intersection observer to detect active card
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index)
            setActiveIndex(index)
          }
        }
      },
      { root: container, threshold: 0.6 }
    )

    const children = container.querySelectorAll("[data-index]")
    children.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [cards.length])

  const handleVideoEnded = useCallback((index: number) => {
    setCards((prev) => {
      if (!prev[index]) return prev
      const updated = [...prev]
      // Only show quiz if there is one
      updated[index] = {
        ...updated[index],
        state: prev[index].item.quiz ? "quiz" : "done",
      }
      return updated
    })
  }, [])

  const handleQuizComplete = useCallback(
    async (index: number, score: number, xp: number) => {
      setCards((prev) => {
        const updated = [...prev]
        if (updated[index]) updated[index] = { ...updated[index], state: "done" }
        return updated
      })

      // Update XP and streak
      addXp(xp)
      incrementStreak()
      setXpToast({ xp, streak: (profile?.streak ?? 0) + 1 })

      // Report to API
      const card = cards[index]
      if (card && userId) {
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            videoId: card.item.video.id,
            quizScore: score,
            totalQuestions: card.item.quiz?.questions.length ?? 0,
            xpEarned: xp,
          }),
        }).catch(() => {})
      }

      // Auto-scroll to next card
      const container = containerRef.current
      if (container) {
        const nextCard = container.querySelector(`[data-index="${index + 1}"]`)
        nextCard?.scrollIntoView({ behavior: "smooth" })
      }
    },
    [addXp, incrementStreak, profile?.streak, cards, userId]
  )

  const handleSkipQuiz = useCallback((index: number) => {
    setCards((prev) => {
      const updated = [...prev]
      if (updated[index]) updated[index] = { ...updated[index], state: "done" }
      return updated
    })
    const container = containerRef.current
    if (container) {
      const nextCard = container.querySelector(`[data-index="${index + 1}"]`)
      nextCard?.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  return (
    <>
      {xpToast && (
        <XpToast
          xp={xpToast.xp}
          streak={xpToast.streak}
          onDone={() => setXpToast(null)}
        />
      )}

      <div
        ref={containerRef}
        className="feed-scroll w-full"
      >
        {cards.map((card, index) => (
          <div
            key={card.item.video.id}
            data-index={index}
            className="feed-snap-item relative w-full overflow-hidden"
          >
            {/* Video layer */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                card.state === "quiz" ? "opacity-30 pointer-events-none" : "opacity-100"
              }`}
            >
              <VideoPlayer
                item={card.item}
                isActive={activeIndex === index && card.state === "video"}
                onEnded={() => handleVideoEnded(index)}
              />
            </div>

            {/* Quiz panel — bottom sheet on mobile, right panel on desktop */}
            {card.state === "quiz" && card.item.quiz && (
              <div className="absolute inset-x-0 bottom-0 z-30 md:inset-y-0 md:left-auto md:right-0 md:w-80 md:top-0 md:bottom-0">
                <div className="h-full overflow-y-auto rounded-t-3xl border-t border-border bg-card/95 p-5 backdrop-blur-xl md:rounded-none md:border-l md:border-t-0 md:rounded-tl-none md:shadow-2xl">
                  <QuizOverlay
                    quiz={card.item.quiz}
                    onComplete={(score, xp) => handleQuizComplete(index, score, xp)}
                    onSkip={() => handleSkipQuiz(index)}
                  />
                </div>
              </div>
            )}

            {/* Done state overlay — subtle indicator */}
            {card.state === "done" && (
              <div className="absolute bottom-24 inset-x-0 z-20 flex justify-center">
                <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-white">{t("feed.scroll")}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
