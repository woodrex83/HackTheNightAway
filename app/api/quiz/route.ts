import { NextRequest, NextResponse } from "next/server"

const MINIMAX_API_URL = "https://api.minimax.io/v1/text/chatcompletion_v2"
const MINIMAX_MODEL = "MiniMax-Text-01"

function buildQuizPrompt(subject: string, topic: string): { system: string; user: string } {
  return {
    system: `You are an expert IB examiner generating multiple-choice quiz questions for students aged 16-19.
Respond ONLY with valid JSON — no markdown fences, no extra text.
Schema:
{
  "questions": [
    {
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "brief explanation (1-2 sentences, encouraging)"
    }
  ]
}
Rules:
- Exactly 3 questions
- Exactly 4 options each
- correctIndex is 0-based
- Language appropriate for IB level
- Mix difficulty: 1 easy, 1 medium, 1 challenging`,
    user: `Generate 3 IB-level MCQ questions for: ${subject} — "${topic}"`,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { subject, topic, videoId } = await req.json() as {
      subject: string
      topic: string
      videoId?: string
    }

    if (!subject || !topic) {
      return NextResponse.json({ error: "subject and topic are required" }, { status: 400 })
    }

    const apiKey = process.env.MINIMAX_API_KEY
    if (!apiKey || apiKey === "your_key_here") {
      // Return mock quiz
      return NextResponse.json({
        questions: [
          {
            question: `Which of the following best describes a key concept in ${topic}?`,
            options: ["Option A", "Option B — correct answer", "Option C", "Option D"],
            correctIndex: 1,
            explanation: "This is a demo question. Connect your Minimax API key to generate real questions.",
          },
          {
            question: `In ${subject}, ${topic} is primarily associated with:`,
            options: ["Concept 1", "Concept 2", "Concept 3 — correct", "Concept 4"],
            correctIndex: 2,
            explanation: "Real explanations appear when the Minimax API key is configured.",
          },
          {
            question: `Advanced question about ${topic}:`,
            options: ["Answer A", "Answer B", "Answer C", "Answer D — correct"],
            correctIndex: 3,
            explanation: "This is placeholder content for demonstration.",
          },
        ],
      })
    }

    const { system, user } = buildQuizPrompt(subject, topic)

    const response = await fetch(MINIMAX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.5,
        max_completion_tokens: 1024,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Minimax API error" }, { status: 502 })
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
      base_resp: { status_code: number }
    }
    const content = data.choices?.[0]?.message?.content ?? ""

    // Parse JSON from content
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    const jsonStr = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned
    const parsed = JSON.parse(jsonStr) as { questions: unknown[] }

    // Persist to Supabase
    if (videoId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl && supabaseUrl !== "your-supabase-url") {
        const { createClient } = await import("@/lib/supabase/server")
        const supabase = await createClient()
        await supabase
          .from("quizzes")
          .upsert({ video_id: videoId, questions: parsed.questions })
      }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
