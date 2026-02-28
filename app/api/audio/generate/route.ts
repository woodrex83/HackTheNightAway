import { NextRequest, NextResponse } from "next/server"
import { generateAudio, type AudioLanguage } from "@/lib/audio"

export async function POST(req: NextRequest) {
  try {
    const { topic, subject, language = "cantonese" } = await req.json() as {
      topic: string
      subject: string
      language?: AudioLanguage
    }

    if (!topic || !subject) {
      return NextResponse.json(
        { error: "topic and subject are required" },
        { status: 400 }
      )
    }

    const result = await generateAudio(subject, topic, language)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
