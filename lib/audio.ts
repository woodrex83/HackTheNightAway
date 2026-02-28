const MINIMAX_API_URL = "https://api.minimax.io/v1/text/chatcompletion_v2"
const MINIMAX_MODEL = "MiniMax-Text-01"
const CANTONESE_AI_TTS_URL = "https://api.cantonese.ai/tts"

export type AudioLanguage = "cantonese" | "english"

export interface AudioResult {
  audioBase64: string | null
  mimeType: string
  subtitleSrt: string
  mock: boolean
}

function buildScriptPrompt(
  subject: string,
  topic: string,
  language: AudioLanguage
): { system: string; user: string } {
  if (language === "cantonese") {
    return {
      system: `你係一位專業STEM老師，用廣東話向16-19歲學生解釋學科概念。
請用自然廣東話口語（使用係、嘅、喺、咁、啦等語氣詞）。
寫一段約20秒嘅口語解說，大約60-80個字，清晰易明。
直接輸出解說文字，唔好加任何標籤或格式。`,
      user: `請用廣東話解說：${subject} — 「${topic}」`,
    }
  }
  return {
    system: `You are an expert STEM teacher explaining concepts to students aged 16-19.
Write a concise 20-second spoken explanation (~50-60 words) that is engaging and clear.
Output only the script text with no labels or formatting.`,
    user: `Explain in English: ${subject} — "${topic}"`,
  }
}

export async function generateAudioScript(
  subject: string,
  topic: string,
  language: AudioLanguage,
  minimaxKey: string
): Promise<string> {
  const { system, user } = buildScriptPrompt(subject, topic, language)

  const response = await fetch(MINIMAX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${minimaxKey}`,
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_completion_tokens: 256,
    }),
  })

  if (!response.ok) throw new Error("Failed to generate audio script")

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices?.[0]?.message?.content?.trim() ?? ""
}

export async function generateAudio(
  subject: string,
  topic: string,
  language: AudioLanguage = "cantonese"
): Promise<AudioResult> {
  const minimaxKey = process.env.MINIMAX_API_KEY
  const cantoneseKey = process.env.CANTONESE_AI_API_KEY

  if (!minimaxKey || minimaxKey === "your_key_here" || !cantoneseKey) {
    return {
      audioBase64: null,
      mimeType: "audio/mp3",
      subtitleSrt: buildMockSrt(topic, language),
      mock: true,
    }
  }

  const script = await generateAudioScript(subject, topic, language, minimaxKey)
  if (!script) throw new Error("Empty script from LLM")

  const ttsResponse = await fetch(CANTONESE_AI_TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: script,
      api_key: cantoneseKey,
      language,
      output_extension: "mp3",
      should_use_turbo_model: true,
      should_return_timestamp: true,
      should_convert_from_simplified_to_traditional: language === "cantonese",
    }),
  })

  if (!ttsResponse.ok) {
    const err = await ttsResponse.text()
    throw new Error(`cantonese.ai error: ${err}`)
  }

  const ttsData = await ttsResponse.json() as { audio: string; srt: string }

  return {
    audioBase64: ttsData.audio,
    mimeType: "audio/mp3",
    subtitleSrt: ttsData.srt ?? "",
    mock: false,
  }
}

function buildMockSrt(topic: string, language: AudioLanguage): string {
  if (language === "cantonese") {
    return `1\n00:00:00,000 --> 00:00:03,000\n${topic}\n\n2\n00:00:03,000 --> 00:00:06,000\n請設定 CANTONESE_AI_API_KEY 以啟用廣東話音頻。`
  }
  return `1\n00:00:00,000 --> 00:00:03,000\n${topic}\n\n2\n00:00:03,000 --> 00:00:06,000\nSet CANTONESE_AI_API_KEY to enable audio.`
}
