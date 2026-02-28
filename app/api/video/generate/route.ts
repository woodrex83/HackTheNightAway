import { NextRequest, NextResponse } from "next/server"
import { generateAudio } from "@/lib/audio"

const MINIMAX_API_URL = "https://api.minimax.io"
const MINIMAX_VIDEO_MODEL = "MiniMax-Hailuo-02"

function buildVideoPrompt(subject: string, topic: string, interests: string): string {
  const interestHook = interests
    ? `Connect concepts to: ${interests}. `
    : ""
  return (
    `IB ${subject} concept: "${topic}". ` +
    `${interestHook}` +
    `Educational explainer with clear visuals, dynamic motion graphics, concise text overlays. ` +
    `[Push in] Compelling opening hook with a real-world question. ` +
    `[Static shot] Core concept breakdown with key definitions and examples. ` +
    `[Zoom out] Summary with key takeaways. ` +
    `Bright, engaging, student-friendly style. Vertical 9:16 format.`
  )
}

export async function POST(req: NextRequest) {
  try {
    const { subject, topic, topicId, interests } = await req.json() as {
      subject: string
      topic: string
      topicId?: string
      interests?: string
    }

    if (!subject || !topic) {
      return NextResponse.json({ error: "subject and topic are required" }, { status: 400 })
    }

    const apiKey = process.env.MINIMAX_API_KEY
    if (!apiKey || apiKey === "your_key_here") {
      return NextResponse.json({
        videoId: `mock-${Date.now()}`,
        taskId: `mock-task-${Date.now()}`,
        status: "processing",
        mock: true,
      })
    }

    const prompt = buildVideoPrompt(subject, topic, interests ?? "")

    // Submit video generation task to Minimax
    const response = await fetch(`${MINIMAX_API_URL}/v1/video_generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MINIMAX_VIDEO_MODEL,
        prompt,
        duration: 6,
        resolution: "768P",
        prompt_optimizer: true,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Minimax error: ${err}` }, { status: 502 })
    }

    const data = await response.json() as { task_id: string; base_resp: { status_code: number; status_msg: string } }

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json(
        { error: `Minimax: ${data.base_resp.status_msg}` },
        { status: 502 }
      )
    }

    const taskId = data.task_id

    // Generate Cantonese audio narration alongside the video task
    let audioUrl: string | null = null
    let subtitleSrt: string | null = null
    try {
      const audioResult = await generateAudio(subject, topic, "cantonese")
      if (audioResult.audioBase64) {
        audioUrl = `data:${audioResult.mimeType};base64,${audioResult.audioBase64}`
      }
      subtitleSrt = audioResult.subtitleSrt || null
    } catch {
      // Audio generation failing should not block video creation
    }

    // Persist to Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl && supabaseUrl !== "your-supabase-url") {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()
      const { data: video } = await supabase
        .from("videos")
        .insert({
          topic_id: topicId ?? null,
          prompt,
          task_id: taskId,
          status: "processing",
          audio_url: audioUrl,
          subtitle_srt: subtitleSrt,
        })
        .select()
        .single()

      return NextResponse.json({ videoId: video?.id, taskId, status: "processing" })
    }

    return NextResponse.json({ videoId: null, taskId, status: "processing" })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
