import { NextRequest, NextResponse } from "next/server"

function calcNextReview(score: number): Date {
  const now = new Date()
  if (score === 100) {
    now.setDate(now.getDate() + 7)
  } else if (score >= 60) {
    now.setDate(now.getDate() + 3)
  } else {
    now.setDate(now.getDate() + 1)
  }
  return now
}

function calcMasteryDelta(score: number): number {
  if (score === 100) return 15
  if (score >= 60) return 7
  return 2
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      videoId,
      quizScore,
      totalQuestions,
      xpEarned,
    } = await req.json() as {
      userId?: string
      videoId: string
      quizScore: number
      totalQuestions: number
      xpEarned: number
    }

    const scorePercent = totalQuestions > 0 ? Math.round((quizScore / totalQuestions) * 100) : 0
    const nextReviewAt = calcNextReview(scorePercent)
    const masteryDelta = calcMasteryDelta(scorePercent)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === "your-supabase-url" || !userId) {
      return NextResponse.json({
        success: true,
        nextReviewAt: nextReviewAt.toISOString(),
        masteryDelta,
        scorePercent,
      })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    // Upsert history record
    const { data: existing } = await supabase
      .from("user_video_history")
      .select("mastery")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .single()

    const currentMastery = (existing?.mastery as number) ?? 0
    const newMastery = Math.min(100, currentMastery + masteryDelta)

    await supabase.from("user_video_history").upsert({
      user_id: userId,
      video_id: videoId,
      watched_at: new Date().toISOString(),
      quiz_score: scorePercent,
      next_review_at: nextReviewAt.toISOString(),
      mastery: newMastery,
    })

    // Update user XP
    const { data: user } = await supabase
      .from("users")
      .select("xp, streak, last_active")
      .eq("id", userId)
      .single()

    if (user) {
      const today = new Date().toISOString().slice(0, 10)
      const newStreak =
        user.last_active !== today ? (user.streak as number) + 1 : (user.streak as number)
      await supabase.from("users").update({
        xp: (user.xp as number) + xpEarned,
        streak: newStreak,
        last_active: today,
      }).eq("id", userId)
    }

    return NextResponse.json({
      success: true,
      nextReviewAt: nextReviewAt.toISOString(),
      masteryDelta,
      scorePercent,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === "your-supabase-url" || !userId) {
      return NextResponse.json({ history: [], user: null })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const [{ data: history }, { data: user }] = await Promise.all([
      supabase
        .from("user_video_history")
        .select("*, videos(*, topics(*))")
        .eq("user_id", userId)
        .order("watched_at", { ascending: false })
        .limit(50),
      supabase.from("users").select("*").eq("id", userId).single(),
    ])

    return NextResponse.json({ history: history ?? [], user })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
