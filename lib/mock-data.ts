// Seeded mock data for dashboard demo
import { getSubjectConfig, IB_SUBJECTS } from "@/lib/subject-colors"

export interface MockHistory {
  id: string
  subject: string
  topic: string
  score: number
  date: string
  mastery: number
}

export interface SubjectMastery {
  subject: string
  mastery: number
  videos: number
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const MOCK_HISTORY: MockHistory[] = [
  { id: "1", subject: "Physics", topic: "Newton's Laws", score: 100, date: daysAgo(0), mastery: 85 },
  { id: "2", subject: "Mathematics", topic: "Differentiation", score: 67, date: daysAgo(0), mastery: 60 },
  { id: "3", subject: "Biology", topic: "DNA Replication", score: 100, date: daysAgo(1), mastery: 90 },
  { id: "4", subject: "Chemistry", topic: "Atomic Structure", score: 33, date: daysAgo(1), mastery: 40 },
  { id: "5", subject: "Physics", topic: "Electromagnetic Induction", score: 67, date: daysAgo(2), mastery: 65 },
  { id: "6", subject: "Mathematics", topic: "Integration", score: 100, date: daysAgo(2), mastery: 75 },
  { id: "7", subject: "History", topic: "WWI Causes", score: 67, date: daysAgo(3), mastery: 55 },
  { id: "8", subject: "Economics", topic: "Supply & Demand", score: 100, date: daysAgo(3), mastery: 80 },
  { id: "9", subject: "Biology", topic: "Cell Structure", score: 100, date: daysAgo(4), mastery: 95 },
  { id: "10", subject: "Chemistry", topic: "Organic Chemistry", score: 33, date: daysAgo(4), mastery: 35 },
  { id: "11", subject: "Physics", topic: "Quantum Physics", score: 0, date: daysAgo(5), mastery: 20 },
  { id: "12", subject: "Mathematics", topic: "Probability", score: 100, date: daysAgo(5), mastery: 70 },
  { id: "13", subject: "English Lit", topic: "Narrative Voice", score: 67, date: daysAgo(6), mastery: 60 },
  { id: "14", subject: "Computer Science", topic: "Sorting Algorithms", score: 100, date: daysAgo(6), mastery: 85 },
  { id: "15", subject: "History", topic: "Cold War", score: 100, date: daysAgo(7), mastery: 70 },
]

export function getMockSubjectMastery(subjects: string[]): SubjectMastery[] {
  const subjectList = subjects.length > 0 ? subjects : IB_SUBJECTS.slice(0, 6)
  const masteryMap: Record<string, { total: number; count: number }> = {}

  for (const h of MOCK_HISTORY) {
    if (!subjectList.includes(h.subject)) continue
    if (!masteryMap[h.subject]) masteryMap[h.subject] = { total: 0, count: 0 }
    masteryMap[h.subject].total += h.mastery
    masteryMap[h.subject].count += 1
  }

  return subjectList.map((subject) => ({
    subject,
    mastery: masteryMap[subject]
      ? Math.round(masteryMap[subject].total / masteryMap[subject].count)
      : 0,
    videos: masteryMap[subject]?.count ?? 0,
  }))
}

export function getMockScoreTrend() {
  // Last 14 days, daily average score
  return Array.from({ length: 14 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const date = d.toISOString().slice(0, 10)
    const dayHistory = MOCK_HISTORY.filter((h) => h.date === date)
    const avg =
      dayHistory.length > 0
        ? Math.round(dayHistory.reduce((s, h) => s + h.score, 0) / dayHistory.length)
        : null
    return { date: d.toLocaleDateString("en", { month: "short", day: "numeric" }), score: avg }
  })
}

export function getMockStats() {
  const totalXp = MOCK_HISTORY.reduce((s, h) => s + 10 + Math.round((h.score / 100) * 60), 0)
  const avgScore = Math.round(MOCK_HISTORY.reduce((s, h) => s + h.score, 0) / MOCK_HISTORY.length)
  return {
    totalVideos: MOCK_HISTORY.length,
    avgScore,
    totalXp,
    streak: 7,
  }
}
