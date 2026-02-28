const HEYGEN_API_BASE = "https://api.heygen.com"

type HeyGenStatus = "pending" | "processing" | "completed" | "failed"

interface HeyGenGenerateResponse {
  data: { video_id: string } | null
  error: string | null
}

interface HeyGenStatusResponse {
  data: {
    video_id: string
    status: HeyGenStatus
    video_url: string | null
    thumbnail_url: string | null
    error?: string
  } | null
  error: string | null
}

function heygenHeaders(): HeadersInit {
  const apiKey = process.env.HEYGEN_API_KEY
  if (!apiKey) throw new Error("HEYGEN_API_KEY is not configured")
  return {
    "X-Api-Key": apiKey,
    "Content-Type": "application/json",
  }
}

function buildScript(subject: string, topic: string): string {
  return (
    `Hey there! Today we are going to explore ${topic} in ${subject}. ` +
    `This is an important concept for your IB and DSE exam preparation. ` +
    `Let me walk you through it step by step so you can master it with confidence. ` +
    `By the end of this video, you will have a clear understanding of the key ideas and how to apply them. ` +
    `Let's get started!`
  )
}

export async function generateVideo(
  subject: string,
  topic: string
): Promise<{ taskId: string }> {
  const apiKey = process.env.HEYGEN_API_KEY
  if (!apiKey || apiKey === "your_key_here") {
    return { taskId: `mock-heygen-task-${Date.now()}` }
  }

  const avatarId = process.env.HEYGEN_AVATAR_ID ?? "Daisy-inskirt-20220818"
  const voiceId = process.env.HEYGEN_VOICE_ID ?? "2d5b0e6cf36f460aa7fc47e3eee4ba54"
  const script = buildScript(subject, topic)

  const response = await fetch(`${HEYGEN_API_BASE}/v2/video/generate`, {
    method: "POST",
    headers: heygenHeaders(),
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatarId,
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: script,
            voice_id: voiceId,
            speed: 1.0,
          },
          background: {
            type: "color",
            value: "#1a1a2e",
          },
        },
      ],
      dimension: {
        width: 720,
        height: 1280,
      },
      aspect_ratio: "9:16",
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`HeyGen API error: ${err}`)
  }

  const data = await response.json() as HeyGenGenerateResponse
  if (data.error || !data.data?.video_id) {
    throw new Error(`HeyGen error: ${data.error ?? "No video_id returned"}`)
  }

  return { taskId: data.data.video_id }
}

export async function pollVideoStatus(
  taskId: string
): Promise<{ status: "processing" | "ready" | "failed"; url: string | null }> {
  if (taskId.startsWith("mock-heygen-task-")) {
    return { status: "processing", url: null }
  }

  const apiKey = process.env.HEYGEN_API_KEY
  if (!apiKey || apiKey === "your_key_here") {
    return { status: "processing", url: null }
  }

  const response = await fetch(
    `${HEYGEN_API_BASE}/v1/video_status.get?video_id=${taskId}`,
    { headers: heygenHeaders() }
  )

  if (!response.ok) {
    return { status: "failed", url: null }
  }

  const data = await response.json() as HeyGenStatusResponse
  if (data.error || !data.data) {
    return { status: "failed", url: null }
  }

  const { status, video_url } = data.data

  if (status === "completed") {
    return { status: "ready", url: video_url ?? null }
  }

  if (status === "failed") {
    return { status: "failed", url: null }
  }

  return { status: "processing", url: null }
}
