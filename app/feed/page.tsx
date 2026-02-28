"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { SidebarNav, BottomNav } from "@/components/layout/app-nav"
import { VideoFeed } from "@/components/feed/video-feed"
import { useUser } from "@/components/user-provider"
import type { FeedItem } from "@/lib/supabase/types"

export default function FeedPage() {
  const { profile } = useUser()
  const [items, setItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const subjects = profile?.ibSubjects ?? []
    const params = new URLSearchParams()
    if (subjects.length > 0) params.set("subjects", subjects.join(","))
    if (profile?.id) params.set("userId", profile.id)

    fetch(`/api/feed?${params}`)
      .then((r) => r.json())
      .then((data: { items?: FeedItem[] }) => {
        setItems(data.items ?? [])
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [profile?.ibSubjects, profile?.id])

  return (
    <AuthGuard>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <SidebarNav />

        {/* Feed — fills remaining space on all screen sizes */}
        <div className="relative flex-1 overflow-hidden">
          {isLoading ? (
            <FeedSkeleton />
          ) : items.length > 0 ? (
            <VideoFeed
              initialItems={items}
              subjects={profile?.ibSubjects ?? []}
              userId={profile?.id}
            />
          ) : (
            <EmptyFeed />
          )}
        </div>
      </div>

      <BottomNav />
    </AuthGuard>
  )
}

function FeedSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-bold text-muted-foreground">Loading your feed...</p>
      </div>
    </div>
  )
}

function EmptyFeed() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
        <span className="text-3xl">📭</span>
      </div>
      <div>
        <p className="text-lg font-black text-foreground">No videos yet</p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          Go to Discover to generate your first IB video!
        </p>
      </div>
    </div>
  )
}
