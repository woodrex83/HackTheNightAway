import { generateVideo } from "./heygen"
import { generateAudio } from "./audio"

export interface AgentArtifacts {
  videoTaskId?: string
  videoId?: string | null
  audioUrl?: string | null
  quiz?: unknown
  curatedTopics?: string[]
}

export interface AgentResult {
  reply: string
  artifacts: AgentArtifacts
}

const SYSTEM_PROMPT = `You are a Study Buddy for Hong Kong secondary students preparing for IB (International Baccalaureate) and DSE (Hong Kong Diploma of Secondary Education) exams.

Your role:
- Help students understand STEM concepts (Physics, Mathematics, Chemistry, Biology, Computer Science, ICT, Design Technology, Economics, History, English Literature)
- Generate educational videos, audio narrations, quizzes, and curated topic suggestions using your tools
- Adapt explanations to the student's curriculum (IB or DSE) and level (HL/SL for IB, Core/Extended for DSE Math)
- Use Cantonese-friendly explanations and reference Hong Kong local context where relevant
- For IB, align with the IB Diploma Programme syllabus and Internal Assessment requirements
- For DSE, align with the HKDSE syllabus with focus on Papers 1 and 2 exam techniques

When a student asks to learn about a topic:
1. Offer to generate an educational video for visual learning
2. Offer to generate a quiz to test understanding
3. Curate related subtopics they should also study

Always be encouraging, concise, and student-friendly.`

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_video",
      description:
        "Create a short educational explainer video via HeyGen for an IB or DSE STEM topic. Returns a task ID that the frontend polls for the completed video URL.",
      parameters: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "The academic subject (e.g. Physics, Mathematics, Biology)",
          },
          topic: {
            type: "string",
            description: "The specific topic or concept to explain (e.g. Newton's Laws of Motion)",
          },
          curriculum: {
            type: "string",
            description: "The curriculum: IB or DSE",
          },
          interests: {
            type: "string",
            description: "Optional student interests to personalise the video hook",
          },
        },
        required: ["subject", "topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_audio",
      description:
        "Create a Cantonese audio narration and subtitle SRT for an IB or DSE topic.",
      parameters: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "The academic subject",
          },
          topic: {
            type: "string",
            description: "The specific topic or concept",
          },
          language: {
            type: "string",
            description: "Audio language: cantonese or english",
          },
        },
        required: ["subject", "topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_quiz",
      description:
        "Generate 3 IB or DSE style multiple-choice questions with explanations for a STEM topic.",
      parameters: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "The academic subject",
          },
          topic: {
            type: "string",
            description: "The specific topic or concept",
          },
          curriculum: {
            type: "string",
            description: "The curriculum: IB or DSE",
          },
          level: {
            type: "string",
            description: "The level: HL or SL for IB; Core or Extended for DSE Math",
          },
        },
        required: ["subject", "topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "curate_content",
      description:
        "Suggest 4-6 relevant subtopics and a learning summary for a student query. Useful for building personalised study pathways.",
      parameters: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "The academic subject",
          },
          query: {
            type: "string",
            description: "The student's query or learning goal",
          },
          curriculum: {
            type: "string",
            description: "The curriculum: IB or DSE",
          },
        },
        required: ["subject", "query"],
      },
    },
  },
]

async function dispatchTool(
  toolName: string,
  params: Record<string, string>
): Promise<{ result: string; artifacts: AgentArtifacts }> {
  const artifacts: AgentArtifacts = {}

  switch (toolName) {
    case "generate_video": {
      const { subject, topic } = params

      try {
        const { taskId } = await generateVideo(subject, topic)
        artifacts.videoTaskId = taskId
        artifacts.videoId = null

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl && supabaseUrl !== "your-supabase-url") {
          const { createClient } = await import("./supabase/server")
          const supabase = await createClient()
          const { data: video } = await supabase
            .from("videos")
            .insert({
              topic_id: null,
              prompt: `${subject}: ${topic}`,
              task_id: taskId,
              status: "processing",
            })
            .select()
            .single()
          artifacts.videoId = video?.id ?? null
        }

        return {
          result: `HeyGen avatar video generation started. Task ID: ${taskId}. The video will be ready in 1-3 minutes.`,
          artifacts,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        return { result: `Video generation failed: ${msg}`, artifacts }
      }
    }

    case "generate_audio": {
      const { subject, topic, language = "cantonese" } = params
      try {
        const audioResult = await generateAudio(subject, topic, language as "cantonese" | "english")
        if (audioResult.audioBase64) {
          artifacts.audioUrl = `data:${audioResult.mimeType};base64,${audioResult.audioBase64}`
        }
        return {
          result: audioResult.mock
            ? "Audio generation is in mock mode. Set CANTONESE_AI_API_KEY to enable real audio."
            : "Cantonese audio narration generated successfully.",
          artifacts,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        return { result: `Audio generation failed: ${msg}`, artifacts }
      }
    }

    case "generate_quiz": {
      const { subject, topic, curriculum, level } = params
      try {
        const minimaxKey = process.env.MINIMAX_API_KEY
        if (!minimaxKey || minimaxKey === "your_key_here") {
          const mockQuiz = {
            questions: [
              {
                question: `Key concept in ${topic}?`,
                options: ["Option A", "Option B — correct", "Option C", "Option D"],
                correctIndex: 1,
                explanation: "Demo question. Connect your MiniMax API key for real questions.",
              },
            ],
          }
          artifacts.quiz = mockQuiz
          return { result: `Quiz generated (mock) for ${curriculum ?? "IB"} ${subject}: ${topic}`, artifacts }
        }

        const curriculumTag = curriculum === "DSE" ? "DSE Hong Kong" : "IB Diploma"
        const levelTag = level ? ` (${level})` : ""
        const system = `You are an expert ${curriculumTag} examiner generating multiple-choice quiz questions for students aged 16-19.
Respond ONLY with valid JSON — no markdown fences, no extra text.
Schema: { "questions": [{ "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }] }
Rules: Exactly 3 questions. Exactly 4 options each. correctIndex is 0-based. Language appropriate for ${curriculumTag}${levelTag} level.
Mix difficulty: 1 easy, 1 medium, 1 challenging.`

        const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${minimaxKey}`,
          },
          body: JSON.stringify({
            model: "MiniMax-Text-01",
            messages: [
              { role: "system", content: system },
              { role: "user", content: `Generate 3 ${curriculumTag}-level MCQ questions for: ${subject} — "${topic}"` },
            ],
            temperature: 0.5,
            max_completion_tokens: 1024,
          }),
        })

        if (!response.ok) throw new Error("MiniMax API error")

        const data = await response.json() as { choices: Array<{ message: { content: string } }> }
        const content = data.choices?.[0]?.message?.content ?? ""
        const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim()
        const start = cleaned.indexOf("{")
        const end = cleaned.lastIndexOf("}")
        const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { questions: unknown[] }
        artifacts.quiz = parsed

        return {
          result: `Quiz generated with ${parsed.questions.length} questions for ${curriculumTag} ${subject}: ${topic}`,
          artifacts,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        return { result: `Quiz generation failed: ${msg}`, artifacts }
      }
    }

    case "curate_content": {
      const { subject, query, curriculum } = params
      try {
        const minimaxKey = process.env.MINIMAX_API_KEY
        if (!minimaxKey || minimaxKey === "your_key_here") {
          const mockTopics = ["Introduction to the topic", "Core concepts", "Exam techniques", "Practice problems"]
          artifacts.curatedTopics = mockTopics
          return { result: `Curated topics for ${subject}: ${mockTopics.join(", ")}`, artifacts }
        }

        const curriculumTag = curriculum === "DSE" ? "DSE Hong Kong" : "IB Diploma"
        const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${minimaxKey}`,
          },
          body: JSON.stringify({
            model: "MiniMax-Text-01",
            messages: [
              {
                role: "system",
                content: `You are a ${curriculumTag} STEM curriculum expert. Given a student query, suggest 4-6 specific subtopics they should study. Respond ONLY with valid JSON: { "topics": ["topic1", "topic2", ...], "summary": "brief explanation" }`,
              },
              {
                role: "user",
                content: `${curriculumTag} ${subject} query: "${query}"`,
              },
            ],
            temperature: 0.6,
            max_completion_tokens: 512,
          }),
        })

        if (!response.ok) throw new Error("MiniMax API error")

        const data = await response.json() as { choices: Array<{ message: { content: string } }> }
        const content = data.choices?.[0]?.message?.content ?? ""
        const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim()
        const start = cleaned.indexOf("{")
        const end = cleaned.lastIndexOf("}")
        const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { topics: string[]; summary: string }
        artifacts.curatedTopics = parsed.topics

        return {
          result: `${parsed.summary} Suggested topics: ${parsed.topics.join(", ")}`,
          artifacts,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        return { result: `Content curation failed: ${msg}`, artifacts }
      }
    }

    default:
      return { result: `Unknown tool: ${toolName}`, artifacts }
  }
}

type MiniMaxMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: MiniMaxToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string }

interface MiniMaxToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

interface MiniMaxResponse {
  choices: Array<{
    message: {
      role: string
      content: string
      tool_calls?: MiniMaxToolCall[]
    }
    finish_reason: string
  }>
}

export async function invokeAgent(
  message: string,
  _sessionId: string,
  curriculum?: string,
  subjects?: string[],
  level?: string
): Promise<AgentResult> {
  const minimaxKey = process.env.MINIMAX_API_KEY
  if (!minimaxKey || minimaxKey === "your_key_here") {
    return {
      reply: "MiniMax API key is not configured. Set MINIMAX_API_KEY in .env.local to enable the Study Buddy.",
      artifacts: {},
    }
  }

  const contextPrefix = `Student context: curriculum=${curriculum ?? "IB"}, subjects=${subjects?.join(", ") ?? "not specified"}, level=${level ?? "not specified"}.`

  const messages: MiniMaxMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `${contextPrefix}\n\n${message}` },
  ]

  const combinedArtifacts: AgentArtifacts = {}
  let maxIterations = 5

  while (maxIterations-- > 0) {
    const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${minimaxKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.7,
        max_completion_tokens: 1024,
      }),
    })

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as MiniMaxResponse
    const choice = data.choices?.[0]

    if (!choice) break

    const assistantMessage = choice.message

    // Append the assistant turn to the conversation
    messages.push({
      role: "assistant",
      content: assistantMessage.content ?? "",
      tool_calls: assistantMessage.tool_calls,
    })

    // If no tool calls, we have the final reply
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return {
        reply: assistantMessage.content || "I'm here to help with your IB/DSE studies. Ask me anything!",
        artifacts: combinedArtifacts,
      }
    }

    // Execute each tool call and append results
    for (const toolCall of assistantMessage.tool_calls) {
      const params = JSON.parse(toolCall.function.arguments) as Record<string, string>
      const { result, artifacts } = await dispatchTool(toolCall.function.name, params)
      Object.assign(combinedArtifacts, artifacts)

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      })
    }
  }

  return {
    reply: "I'm here to help with your IB/DSE studies. Ask me anything!",
    artifacts: combinedArtifacts,
  }
}
