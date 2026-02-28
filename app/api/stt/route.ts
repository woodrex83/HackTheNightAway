import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const apiKey = process.env.CANTONESE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "STT not configured" }, { status: 503 })
  }

  const formData = await req.formData()
  const audio = formData.get("audio") as Blob | null
  const language = (formData.get("language") as string | null) ?? "zh"

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 })
  }

  const upstream = new FormData()
  upstream.append("file", audio, `recording.webm`)
  upstream.append("language", language)

  const res = await fetch("https://stt-api.cantonese.ai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstream,
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text }, { status: res.status })
  }

  const data = await res.json() as { text: string }
  return NextResponse.json({ text: data.text })
}
