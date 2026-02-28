import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MOCK_FEED = [
  {
    video: {
      id: "mock-1",
      topic_id: "t1",
      prompt: "Newton's Laws of Motion",
      task_id: null,
      file_id: null,
      url: null,
      audio_url: null,
      subtitle_srt: null,
      status: "ready" as const,
      duration: 60,
      created_at: new Date().toISOString(),
      topics: {
        id: "t1",
        subject: "Physics",
        title: "Newton's Laws of Motion",
        title_zh: "牛頓運動定律",
        curriculum_tag: "Mechanics",
        difficulty: 1,
        created_at: new Date().toISOString(),
      },
    },
    quiz: {
      id: "q1",
      video_id: "mock-1",
      questions: [
        {
          question: "What does Newton's First Law state?",
          options: [
            "F = ma",
            "An object stays at rest or in uniform motion unless acted upon by a force",
            "For every action there is an equal and opposite reaction",
            "Energy cannot be created or destroyed",
          ],
          correctIndex: 1,
          explanation: "Newton's First Law (inertia) says objects resist changes to their state of motion.",
        },
        {
          question: "Which formula represents Newton's Second Law?",
          options: ["E = mc²", "v = u + at", "F = ma", "P = mv"],
          correctIndex: 2,
          explanation: "F = ma: Force equals mass times acceleration.",
        },
        {
          question: "Newton's Third Law is best described as:",
          options: [
            "Objects fall at the same rate",
            "Action and reaction forces are equal and opposite",
            "Momentum is always conserved",
            "Force is proportional to displacement",
          ],
          correctIndex: 1,
          explanation: "Every action force has an equal and opposite reaction force.",
        },
      ],
      created_at: new Date().toISOString(),
    },
    isReview: false,
  },
  {
    video: {
      id: "mock-2",
      topic_id: "t2",
      prompt: "Differentiation Fundamentals",
      task_id: null,
      file_id: null,
      url: null,
      audio_url: null,
      subtitle_srt: null,
      status: "ready" as const,
      duration: 60,
      created_at: new Date().toISOString(),
      topics: {
        id: "t2",
        subject: "Mathematics",
        title: "Differentiation Fundamentals",
        title_zh: "微分基礎",
        curriculum_tag: "Calculus",
        difficulty: 1,
        created_at: new Date().toISOString(),
      },
    },
    quiz: {
      id: "q2",
      video_id: "mock-2",
      questions: [
        {
          question: "What is the derivative of x³?",
          options: ["x²", "3x²", "3x³", "x⁴/4"],
          correctIndex: 1,
          explanation: "Using the power rule: d/dx(xⁿ) = nxⁿ⁻¹, so d/dx(x³) = 3x².",
        },
        {
          question: "What does the derivative represent geometrically?",
          options: [
            "Area under the curve",
            "Total change",
            "Gradient of the tangent at a point",
            "Volume of revolution",
          ],
          correctIndex: 2,
          explanation: "The derivative gives the instantaneous rate of change, which is the slope of the tangent.",
        },
        {
          question: "The derivative of a constant is:",
          options: ["1", "The constant itself", "0", "Undefined"],
          correctIndex: 2,
          explanation: "Constants don't change, so their rate of change is 0.",
        },
      ],
      created_at: new Date().toISOString(),
    },
    isReview: false,
  },
  {
    video: {
      id: "mock-3",
      topic_id: "t3",
      prompt: "DNA Replication and Transcription",
      task_id: null,
      file_id: null,
      url: null,
      audio_url: null,
      subtitle_srt: null,
      status: "ready" as const,
      duration: 60,
      created_at: new Date().toISOString(),
      topics: {
        id: "t3",
        subject: "Biology",
        title: "DNA Replication and Transcription",
        title_zh: "DNA複製與轉錄",
        curriculum_tag: "Genetics",
        difficulty: 2,
        created_at: new Date().toISOString(),
      },
    },
    quiz: {
      id: "q3",
      video_id: "mock-3",
      questions: [
        {
          question: "DNA replication is described as 'semi-conservative'. What does this mean?",
          options: [
            "Each new DNA molecule contains two new strands",
            "Each new DNA molecule contains one original and one new strand",
            "Only half of the DNA is copied",
            "DNA is copied only during meiosis",
          ],
          correctIndex: 1,
          explanation: "Semi-conservative means each daughter molecule keeps one parental strand and gains one new complementary strand.",
        },
        {
          question: "Which enzyme unwinds the DNA double helix during replication?",
          options: ["DNA polymerase", "RNA polymerase", "Helicase", "Ligase"],
          correctIndex: 2,
          explanation: "Helicase breaks hydrogen bonds between base pairs to unwind the helix.",
        },
        {
          question: "In transcription, DNA is used to make:",
          options: ["A protein directly", "mRNA", "tRNA only", "A copy of DNA"],
          correctIndex: 1,
          explanation: "Transcription produces mRNA from a DNA template, which then carries the code for protein synthesis.",
        },
      ],
      created_at: new Date().toISOString(),
    },
    isReview: false,
  },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subjects = searchParams.get("subjects")?.split(",").filter(Boolean) ?? []
    const userId = searchParams.get("userId")

    // If no Supabase configured, return mock feed
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === "your-supabase-url") {
      return NextResponse.json({ items: MOCK_FEED })
    }

    const supabase = await createClient()

    let feedItems = []

    if (userId) {
      // 1. Overdue reviews
      const { data: reviews } = await supabase
        .from("user_video_history")
        .select("*, videos(*, topics(*))")
        .eq("user_id", userId)
        .lte("next_review_at", new Date().toISOString())
        .order("next_review_at", { ascending: true })
        .limit(3)

      if (reviews?.length) {
        for (const r of reviews) {
          const video = r.videos as Record<string, unknown>
          if (!video) continue
          const { data: quiz } = await supabase
            .from("quizzes")
            .select("*")
            .eq("video_id", (video as { id: string }).id)
            .single()
          feedItems.push({ video, quiz, isReview: true })
        }
      }
    }

    // 2. New content for subjects
    const query = supabase
      .from("videos")
      .select("*, topics(*)")
      .eq("status", "ready")
      .limit(10)

    if (subjects.length > 0) {
      query.in("topics.subject", subjects)
    }

    const { data: videos } = await query.order("created_at", { ascending: false })

    if (videos) {
      const seenIds = new Set(feedItems.map((i) => (i.video as { id: string }).id))
      for (const video of videos) {
        if (seenIds.has(video.id)) continue
        const { data: quiz } = await supabase
          .from("quizzes")
          .select("*")
          .eq("video_id", video.id)
          .single()
        feedItems.push({ video, quiz, isReview: false })
      }
    }

    // If DB is empty, fall back to mock
    if (feedItems.length === 0) {
      return NextResponse.json({ items: MOCK_FEED })
    }

    return NextResponse.json({ items: feedItems })
  } catch {
    return NextResponse.json({ items: MOCK_FEED })
  }
}
