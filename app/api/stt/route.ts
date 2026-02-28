import { NextRequest, NextResponse } from "next/server"

// Cantonese.ai native STT endpoint
// Auth: api_key as form field (not Bearer header)
// File field: "data"
// Supported formats: wav, mp3, m4a, flac, ogg
const STT_URL = "https://cantonese.ai/api/stt"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.CANTONESE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "STT not configured" }, { status: 503 })
    }

    const formData = await req.formData()
    const audio = formData.get("audio") as Blob | null
    const mimeType = (formData.get("mimeType") as string | null) ?? "audio/ogg"

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 })
    }

    // Pick a filename with the right extension so cantonese.ai detects the format
    const ext = mimeType.includes("ogg") ? "ogg"
      : mimeType.includes("mp4") ? "mp4"
      : mimeType.includes("wav") ? "wav"
      : "ogg"

    const upstream = new FormData()
    upstream.append("api_key", apiKey)
    upstream.append("data", audio, `recording.${ext}`)
    upstream.append("with_timestamp", "false")
    upstream.append("with_diarization", "false")

    const res = await fetch(STT_URL, { method: "POST", body: upstream })

    const rawText = await res.text()

    if (!res.ok) {
      console.error("[STT] cantonese.ai error:", res.status, rawText)
      return NextResponse.json({ error: rawText }, { status: res.status })
    }

    const data = JSON.parse(rawText) as { text: string }
    return NextResponse.json({ text: data.text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    console.error("[STT] route error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
