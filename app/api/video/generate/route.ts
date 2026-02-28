import { NextRequest, NextResponse } from "next/server"
import { generateVideo } from "@/lib/heygen"

export async function POST(req: NextRequest) {
  try {
    const { subject, topic, topicId } = await req.json() as {
      subject: string
      topic: string
      topicId?: string
    }

    if (!subject || !topic) {
      return NextResponse.json({ error: "subject and topic are required" }, { status: 400 })
    }

    const { taskId } = await generateVideo(subject, topic)

    // Persist to Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl && supabaseUrl !== "your-supabase-url") {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = await createClient()
      const { data: video } = await supabase
        .from("videos")
        .insert({
          topic_id: topicId ?? null,
          prompt: `${subject}: ${topic}`,
          task_id: taskId,
          status: "processing",
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
