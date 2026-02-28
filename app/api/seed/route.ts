import { NextResponse } from "next/server"

const SEED_TOPICS = [
  { subject: "Physics", topic: "Newton's Laws of Motion" },
  { subject: "Mathematics", topic: "Differentiation Fundamentals" },
  { subject: "Biology", topic: "DNA Replication and Transcription" },
  { subject: "Chemistry", topic: "Atomic Structure and Periodicity" },
  { subject: "History", topic: "Causes of World War I" },
  { subject: "Economics", topic: "Supply and Demand Equilibrium" },
  { subject: "English Lit", topic: "Narrative Voice and Perspective" },
  { subject: "Computer Science", topic: "Sorting Algorithms" },
]

function buildPrompt(subject: string, topic: string): string {
  return (
    `IB ${subject} concept: "${topic}". ` +
    `Educational explainer with clear visuals, dynamic motion graphics, concise text overlays. ` +
    `[Push in] Compelling opening hook with a real-world question. ` +
    `[Static shot] Core concept breakdown with key definitions and examples. ` +
    `[Zoom out] Summary with key takeaways. ` +
    `Bright, engaging, student-friendly style. Vertical 9:16 format.`
  )
}

export async function POST() {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey || apiKey === "your_key_here") {
    return NextResponse.json({
      message: "Seed skipped — no Minimax API key configured",
      topics: SEED_TOPICS.map((t) => t.topic),
    })
  }

  const results: Array<{ topic: string; taskId?: string; error?: string }> = []

  for (const { subject, topic } of SEED_TOPICS) {
    try {
      const prompt = buildPrompt(subject, topic)
      const response = await fetch("https://api.minimax.io/v1/video_generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "MiniMax-Hailuo-02",
          prompt,
          duration: 6,
          resolution: "768P",
          prompt_optimizer: true,
        }),
      })

      const data = await response.json() as {
        task_id?: string
        base_resp: { status_code: number; status_msg: string }
      }

      if (!response.ok || data.base_resp?.status_code !== 0) {
        results.push({ topic, error: data.base_resp?.status_msg ?? "Request failed" })
        continue
      }

      const taskId = data.task_id!
      results.push({ topic, taskId })

      // Persist to Supabase if configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl && supabaseUrl !== "your-supabase-url") {
        const { createClient } = await import("@/lib/supabase/server")
        const supabase = await createClient()
        await supabase.from("videos").insert({
          prompt,
          task_id: taskId,
          status: "processing",
        })
      }
    } catch (err) {
      results.push({
        topic,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return NextResponse.json({ results })
}
