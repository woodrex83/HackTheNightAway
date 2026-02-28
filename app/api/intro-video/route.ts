import { NextResponse } from "next/server"
import { INTRO_PROMPT } from "@/scripts/intro-video/prompt"

const MINIMAX_API_URL = "https://api.minimax.io"
// MiniMax-Hailuo-2.3 is the latest model (released Oct 2025).
// At 768P it supports up to 10 seconds — the current API maximum.
const MODEL = "MiniMax-Hailuo-2.3"
const DURATION = 10
const RESOLUTION = "768P"

export async function POST() {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey || apiKey === "your_key_here") {
    return NextResponse.json({
      taskId: `mock-task-intro-${Date.now()}`,
      mock: true,
    })
  }

  try {
    const response = await fetch(`${MINIMAX_API_URL}/v1/video_generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: INTRO_PROMPT,
        duration: DURATION,
        resolution: RESOLUTION,
        prompt_optimizer: true,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Minimax error: ${err}` }, { status: 502 })
    }

    const data = (await response.json()) as {
      task_id: string
      base_resp: { status_code: number; status_msg: string }
    }

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json(
        { error: `Minimax: ${data.base_resp.status_msg}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ taskId: data.task_id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
