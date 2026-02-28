import * as fs from "fs"
import * as path from "path"
import { config as loadDotenv } from "dotenv"
import { INTRO_PROMPT } from "./prompt"

// Load .env.local from the project root (wherever npm run is executed from)
loadDotenv({ path: path.join(process.cwd(), ".env.local") })

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MINIMAX_API_URL = "https://api.minimax.io"
// MiniMax-Hailuo-2.3 is the latest model (released Oct 2025).
// At 768P it supports up to 10 seconds — the current API maximum.
const MODEL = "MiniMax-Hailuo-2.3"
const DURATION = 10
const RESOLUTION = "768P"

const POLL_INTERVAL_MS = 8_000
const OUT_DIR = path.join(process.cwd(), "public")
const OUT_FILE = path.join(OUT_DIR, "intro.mp4")

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function createTask(apiKey: string): Promise<string> {
  const res = await fetch(`${MINIMAX_API_URL}/v1/video_generation`, {
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

  if (!res.ok) {
    throw new Error(`Create task failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as {
    task_id: string
    base_resp: { status_code: number; status_msg: string }
  }

  if (data.base_resp.status_code !== 0) {
    throw new Error(`Minimax error: ${data.base_resp.status_msg}`)
  }

  return data.task_id
}

async function pollTask(
  apiKey: string,
  taskId: string
): Promise<{ status: string; fileId?: string }> {
  const res = await fetch(
    `${MINIMAX_API_URL}/v1/query/video_generation?task_id=${taskId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )

  if (!res.ok) {
    throw new Error(`Poll failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as {
    status: string
    file_id?: string
    base_resp: { status_code: number; status_msg: string }
  }

  return { status: data.status, fileId: data.file_id }
}

async function downloadVideo(apiKey: string, fileId: string): Promise<void> {
  const res = await fetch(
    `${MINIMAX_API_URL}/v1/files/retrieve?file_id=${fileId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )

  if (!res.ok) {
    throw new Error(`Retrieve file failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as {
    file: { download_url: string }
    base_resp: { status_code: number; status_msg: string }
  }

  const videoRes = await fetch(data.file.download_url)
  if (!videoRes.ok || !videoRes.body) {
    throw new Error("Failed to download video bytes")
  }

  const buffer = Buffer.from(await videoRes.arrayBuffer())
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_FILE, buffer)
  console.log(`Saved to ${OUT_FILE}`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.MINIMAX_API_KEY

  if (!apiKey || apiKey === "your_key_here") {
    console.error("MINIMAX_API_KEY not set in .env.local")
    process.exit(1)
  }

  console.log(`Model : ${MODEL}`)
  console.log(`Length: ${DURATION}s @ ${RESOLUTION}`)
  console.log("Creating generation task...")

  const taskId = await createTask(apiKey)
  console.log(`Task ID: ${taskId}`)
  console.log("Polling for completion (this typically takes 2-5 minutes)...")

  while (true) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    const { status, fileId } = await pollTask(apiKey, taskId)
    console.log(`  status: ${status}`)

    if (status === "Success" && fileId) {
      await downloadVideo(apiKey, fileId)
      break
    }

    if (status === "Fail") {
      console.error("Generation failed.")
      process.exit(1)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
