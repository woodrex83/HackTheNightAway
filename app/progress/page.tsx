"use client"

import { AppShell } from "@/components/layout/app-shell"
import { useUser } from "@/components/user-provider"
import { getSubjectConfig } from "@/lib/subject-colors"
import { getMockSubjectMastery, getMockStats, MOCK_HISTORY } from "@/lib/mock-data"
import { Flame, Zap, Trophy, BookOpen, TrendingUp, Star } from "lucide-react"
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"

function levelFromXp(xp: number): { level: number; label: string; nextXp: number } {
  const thresholds = [0, 200, 500, 1000, 2000, 3500, 5000, 7500, 10000]
  const labels = ["Rookie", "Explorer", "Scholar", "Learner", "Achiever", "Expert", "Master", "Legend", "Prodigy"]
  let level = 0
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i
  }
  return {
    level: level + 1,
    label: labels[level],
    nextXp: thresholds[level + 1] ?? thresholds[thresholds.length - 1],
  }
}

export default function ProgressPage() {
  const { profile } = useUser()
  const stats = getMockStats()
  const xp = (profile?.xp ?? 0) + stats.totalXp
  const streak = Math.max(profile?.streak ?? 0, stats.streak)
  const { level, label, nextXp } = levelFromXp(xp)
  const xpPct = Math.min(100, Math.round((xp / nextXp) * 100))

  const subjects = profile?.ibSubjects ?? []
  const masteryData = getMockSubjectMastery(subjects)

  const radarData = masteryData.map((m) => ({
    subject: m.subject.split(" ")[0],
    value: m.mastery,
  }))

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 pb-28 md:pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-foreground">My Progress</h1>
        </div>

        {/* Stats strip */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Streak", value: streak, suffix: "days", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/15" },
            { label: "Total XP", value: xp.toLocaleString(), suffix: "", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/15" },
            { label: "Videos", value: stats.totalVideos, suffix: "", icon: BookOpen, color: "text-primary", bg: "bg-primary/15" },
            { label: "Avg Score", value: `${stats.avgScore}%`, suffix: "", icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/15" },
          ].map(({ label: lbl, value, suffix, icon: Icon, color, bg }) => (
            <div key={lbl} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className={`text-xl font-black ${color}`}>{value}{suffix && <span className="ml-0.5 text-sm">{suffix}</span>}</p>
                <p className="text-xs font-semibold text-muted-foreground">{lbl}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Level card */}
        <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 border border-primary/40">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Level {level}</p>
                <p className="text-xl font-black text-foreground">{label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-muted-foreground">{xp.toLocaleString()} XP</p>
              <p className="text-xs font-bold text-primary">→ {nextXp.toLocaleString()} XP</p>
            </div>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-muted-foreground text-right">{xpPct}% to next level</p>
        </div>

        {/* Radar chart */}
        {radarData.length > 2 && (
          <div className="mb-5 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-black text-foreground">Subject Mastery Radar</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700 }}
                  />
                  <Radar
                    name="Mastery"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, fontWeight: 700 }}
                    formatter={(v: number) => [`${v}%`, "Mastery"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Subject progress bars */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-black text-foreground">Subject Breakdown</h2>
          {masteryData.map((m) => {
            const cfg = getSubjectConfig(m.subject)
            return (
              <div key={m.subject} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
                    <span>{cfg.icon}</span>
                    {m.subject}
                  </span>
                  <span className="text-xs font-black text-foreground">{m.mastery}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${m.mastery}%`,
                      background: `linear-gradient(90deg, ${cfg.chartColor}66, ${cfg.chartColor})`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{m.videos} videos watched</span>
              </div>
            )
          })}
        </div>

        {/* Recent activity */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-black text-foreground">Recent Activity</h2>
          {MOCK_HISTORY.slice(0, 8).map((h) => {
            const cfg = getSubjectConfig(h.subject)
            const scoreColor = h.score === 100 ? "text-emerald-400" : h.score >= 60 ? "text-amber-400" : "text-rose-400"
            return (
              <div key={h.id} className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                  <span className="text-base">{cfg.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{h.topic}</p>
                  <p className="text-xs text-muted-foreground">{h.subject} · {h.date}</p>
                </div>
                <span className={`text-sm font-black ${scoreColor}`}>{h.score}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
