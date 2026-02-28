import { NextRequest, NextResponse } from "next/server"

export interface WeakTopic {
  subject: string
  topic: string
  mastery: number
}

// Mock weak topics returned when Supabase is not configured
const MOCK_WEAK_TOPICS: WeakTopic[] = [
  { subject: "Mathematics", topic: "Integration Techniques", mastery: 20 },
  { subject: "Physics", topic: "Electromagnetic Induction", mastery: 30 },
  { subject: "Chemistry", topic: "Thermodynamics and Entropy", mastery: 15 },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === "your-supabase-url" || !userId) {
      return NextResponse.json({ topics: MOCK_WEAK_TOPICS })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    // Join user history with videos → topics, filter mastery < 50
    const { data, error } = await supabase
      .from("user_video_history")
      .select("mastery, videos(topics(subject, title))")
      .eq("user_id", userId)
      .lt("mastery", 50)
      .order("mastery", { ascending: true })
      .limit(5)

    if (error) {
      return NextResponse.json({ topics: MOCK_WEAK_TOPICS })
    }

    const topics: WeakTopic[] = (data ?? [])
      .map((row) => {
        const video = row.videos as { topics?: { subject?: string; title?: string } } | null
        const topic = video?.topics
        if (!topic?.subject || !topic?.title) return null
        return {
          subject: topic.subject,
          topic: topic.title,
          mastery: row.mastery ?? 0,
        }
      })
      .filter((t): t is WeakTopic => t !== null)

    return NextResponse.json({ topics: topics.length > 0 ? topics : MOCK_WEAK_TOPICS })
  } catch {
    return NextResponse.json({ topics: [] })
  }
}
