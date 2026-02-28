import { NextRequest, NextResponse } from "next/server"
import { pollVideoStatus } from "@/lib/heygen"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get("taskId")
  const videoId = searchParams.get("videoId")

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 })
  }

  try {
    const { status, url } = await pollVideoStatus(taskId)

    // Update DB when ready or failed
    if ((status === "ready" || status === "failed") && videoId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl && supabaseUrl !== "your-supabase-url") {
        const { createClient } = await import("@/lib/supabase/server")
        const supabase = await createClient()
        if (status === "ready" && url) {
          await supabase
            .from("videos")
            .update({ url, status: "ready" })
            .eq("id", videoId)
        } else {
          await supabase.from("videos").update({ status: "failed" }).eq("id", videoId)
        }
      }
    }

    return NextResponse.json({ status, url: url ?? null })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
