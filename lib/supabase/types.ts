export interface User {
  id: string
  supabase_id: string | null
  username: string | null
  ib_subjects: string[]
  interests: string
  xp: number
  streak: number
  last_active: string
  onboarded: boolean
  created_at: string
}

export interface Topic {
  id: string
  subject: string
  title: string
  title_zh: string | null
  curriculum_tag: string
  difficulty: number
  created_at: string
}

export type VideoStatus = "pending" | "processing" | "ready" | "failed"

export interface Video {
  id: string
  topic_id: string
  prompt: string
  task_id: string | null
  file_id: string | null
  url: string | null
  audio_url: string | null
  subtitle_srt: string | null
  status: VideoStatus
  duration: number
  created_at: string
  topics?: Topic
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Quiz {
  id: string
  video_id: string
  questions: QuizQuestion[]
  created_at: string
}

export interface UserVideoHistory {
  id: string
  user_id: string
  video_id: string
  watched_at: string
  quiz_score: number
  next_review_at: string
  mastery: number
  videos?: Video & { topics?: Topic }
}

export interface FeedItem {
  video: Video & { topics: Topic }
  quiz: Quiz | null
  isReview: boolean
}
