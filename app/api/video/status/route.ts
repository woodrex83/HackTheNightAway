import { NextRequest, NextResponse } from "next/server"

const MINIMAX_API_URL = "https://api.minimax.io"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get("taskId")
  const videoId = searchParams.get("videoId")

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 })
  }

  // Mock task for dev
  if (taskId.startsWith("mock-task-")) {
    return NextResponse.json({ status: "processing", url: null })
  }

  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey || apiKey === "your_key_here") {
    return NextResponse.json({ status: "processing", url: null })
  }

  try {
    const response = await fetch(
      `${MINIMAX_API_URL}/v1/query/video_generation?task_id=${taskId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to query Minimax" }, { status: 502 })
    }

    const data = await response.json() as {
      task_id: string
      status: string
      file_id?: string
      base_resp: { status_code: number }
    }

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json({ status: "failed", url: null })
    }

    const statusLower = data.status.toLowerCase()

    if ((statusLower === "success") && data.file_id) {
      // Fetch the download URL for the file
      const fileResponse = await fetch(
        `${MINIMAX_API_URL}/v1/files/retrieve?file_id=${data.file_id}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      )
      let url: string | null = null
      if (fileResponse.ok) {
        const fileData = await fileResponse.json() as { file?: { download_url?: string } }
        url = fileData.file?.download_url ?? null
      }

      // Update DB if videoId provided
      if (videoId && url) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl && supabaseUrl !== "your-supabase-url") {
          const { createClient } = await import("@/lib/supabase/server")
          const supabase = await createClient()
          await supabase
            .from("videos")
            .update({ file_id: data.file_id, url, status: "ready" })
            .eq("id", videoId)
        }
      }

      return NextResponse.json({ status: "ready", url, fileId: data.file_id })
    }

    if (statusLower === "fail" || statusLower === "failed") {
      if (videoId) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl && supabaseUrl !== "your-supabase-url") {
          const { createClient } = await import("@/lib/supabase/server")
          const supabase = await createClient()
          await supabase.from("videos").update({ status: "failed" }).eq("id", videoId)
        }
      }
      return NextResponse.json({ status: "failed", url: null })
    }

    return NextResponse.json({ status: "processing" as const, url: null })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
