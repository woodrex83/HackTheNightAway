import { NextRequest, NextResponse } from "next/server"
import { invokeAgent } from "@/lib/agent"

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, curriculum, subjects, level } = await req.json() as {
      message: string
      sessionId: string
      curriculum?: string
      subjects?: string[]
      level?: string
    }

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "message and sessionId are required" },
        { status: 400 }
      )
    }

    const result = await invokeAgent(message, sessionId, curriculum, subjects, level)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
