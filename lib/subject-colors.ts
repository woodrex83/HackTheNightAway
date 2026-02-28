export const SUBJECT_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; icon: string; chartColor: string }
> = {
  Mathematics: {
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    icon: "∑",
    chartColor: "#a78bfa",
  },
  Physics: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    icon: "⚛",
    chartColor: "#22d3ee",
  },
  Chemistry: {
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    icon: "⚗",
    chartColor: "#fbbf24",
  },
  Biology: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    icon: "🧬",
    chartColor: "#34d399",
  },
  History: {
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    icon: "📜",
    chartColor: "#fb7185",
  },
  Economics: {
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    icon: "📈",
    chartColor: "#60a5fa",
  },
  "English Lit": {
    color: "text-pink-400",
    bg: "bg-pink-500/15",
    border: "border-pink-500/30",
    icon: "📚",
    chartColor: "#f472b6",
  },
  "Computer Science": {
    color: "text-teal-400",
    bg: "bg-teal-500/15",
    border: "border-teal-500/30",
    icon: "💻",
    chartColor: "#2dd4bf",
  },
}

export const IB_SUBJECTS = Object.keys(SUBJECT_CONFIG)

export function getSubjectConfig(subject: string) {
  return SUBJECT_CONFIG[subject] ?? {
    color: "text-primary",
    bg: "bg-primary/15",
    border: "border-primary/30",
    icon: "📖",
    chartColor: "#a78bfa",
  }
}
