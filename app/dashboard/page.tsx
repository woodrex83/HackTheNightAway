"use client"

import { AppShell } from "@/components/layout/app-shell"
import { useUser } from "@/components/user-provider"
import { useAuth } from "@/components/auth-provider"
import { getSubjectConfig } from "@/lib/subject-colors"
import {
  getMockSubjectMastery,
  getMockScoreTrend,
  getMockStats,
  MOCK_HISTORY,
} from "@/lib/mock-data"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"
import {
  Flame,
  Zap,
  Trophy,
  BookOpen,
  AlertTriangle,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  bg: string
  sub?: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-xs font-bold text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = useUser()
  const { session } = useAuth()

  const subjects = profile?.ibSubjects ?? []
  const stats = getMockStats()
  const trend = getMockScoreTrend()
  const masteryData = getMockSubjectMastery(subjects)
  const weakSpots = masteryData.filter((m) => m.mastery < 50).sort((a, b) => a.mastery - b.mastery)
  const totalXp = (profile?.xp ?? 0) + stats.totalXp
  const streak = Math.max(profile?.streak ?? 0, stats.streak)

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 md:pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">Dashboard</h1>
              <p className="text-sm font-semibold text-muted-foreground">
                Welcome back, <span className="text-primary font-black">{session?.username ?? "student"}</span>
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-black text-amber-400">{streak} day streak</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total XP"
            value={totalXp.toLocaleString()}
            icon={Zap}
            color="text-amber-400"
            bg="bg-amber-500/15"
            sub="All time"
          />
          <StatCard
            label="Videos Watched"
            value={stats.totalVideos}
            icon={BookOpen}
            color="text-primary"
            bg="bg-primary/15"
          />
          <StatCard
            label="Avg Quiz Score"
            value={`${stats.avgScore}%`}
            icon={Trophy}
            color="text-emerald-400"
            bg="bg-emerald-500/15"
          />
          <StatCard
            label="Day Streak"
            value={streak}
            icon={Flame}
            color="text-orange-400"
            bg="bg-orange-500/15"
            sub="Keep it up!"
          />
        </div>

        {/* Charts row */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {/* Score trend line chart */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-black text-foreground">Quiz Score Trend</h2>
              <span className="ml-auto text-xs font-semibold text-muted-foreground">Last 14 days</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700 }}
                    interval={3}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                    formatter={(v: unknown) =>
                      v != null ? [`${v}%`, "Score"] : ["No activity", ""]
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                    activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject mastery bar chart */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-black text-foreground">Subject Mastery</h2>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={masteryData.map((m) => ({
                    subject: m.subject.split(" ")[0],
                    mastery: m.mastery,
                    fill: getSubjectConfig(m.subject).chartColor,
                  }))}
                  margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="subject"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                    formatter={(v: number) => [`${v}%`, "Mastery"]}
                  />
                  <Bar dataKey="mastery" radius={[6, 6, 0, 0]}>
                    {masteryData.map((m, i) => (
                      <Cell key={i} fill={getSubjectConfig(m.subject).chartColor} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent activity */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-black text-foreground">Recent Activity</h2>
            <div className="flex flex-col gap-3">
              {MOCK_HISTORY.slice(0, 8).map((h) => {
                const cfg = getSubjectConfig(h.subject)
                const scoreColor =
                  h.score === 100
                    ? "text-emerald-400 bg-emerald-500/15"
                    : h.score >= 60
                    ? "text-amber-400 bg-amber-500/15"
                    : "text-rose-400 bg-rose-500/15"
                return (
                  <div key={h.id} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                      <span className="text-sm">{cfg.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{h.topic}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {h.subject} · {h.date}
                      </p>
                    </div>
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-black ${scoreColor}`}>
                      {h.score}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weak spots */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-black text-foreground">Focus Areas</h2>
              <span className="ml-auto text-xs text-muted-foreground">mastery &lt; 50%</span>
            </div>

            {weakSpots.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Trophy className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-bold text-foreground">Excellent work!</p>
                <p className="text-xs text-muted-foreground">All subjects above 50% mastery</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {weakSpots.map((m) => {
                  const cfg = getSubjectConfig(m.subject)
                  return (
                    <div
                      key={m.subject}
                      className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                        <span className="text-base">{cfg.icon}</span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className={`text-xs font-black ${cfg.color}`}>{m.subject}</span>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${m.mastery}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{m.mastery}% mastery</span>
                      </div>
                      <Link
                        href={`/discover`}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-black ${cfg.bg} ${cfg.color} border ${cfg.border} whitespace-nowrap hover:opacity-80 transition-opacity`}
                      >
                        Study now
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
