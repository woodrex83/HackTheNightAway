export const SUBJECT_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; icon: string; chartColor: string }
> = {
  Physics: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    icon: "⚛",
    chartColor: "#22d3ee",
  },
  Mathematics: {
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    icon: "∑",
    chartColor: "#a78bfa",
  },
  Biology: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    icon: "🧬",
    chartColor: "#34d399",
  },
}

export const SUBJECT_CURRICULUM: Record<string, "IB" | "DSE" | "both"> = {
  Physics:     "both",
  Mathematics: "both",
  Biology:     "both",
}

export const IB_SUBJECTS = Object.keys(SUBJECT_CONFIG)
export const DSE_SUBJECTS = Object.keys(SUBJECT_CONFIG)

export function getSubjectConfig(subject: string) {
  return SUBJECT_CONFIG[subject] ?? {
    color: "text-primary",
    bg: "bg-primary/15",
    border: "border-primary/30",
    icon: "📖",
    chartColor: "#a78bfa",
  }
}

export function getSubjectsForCurriculum(_curriculum: "IB" | "DSE" | string): string[] {
  return Object.keys(SUBJECT_CONFIG)
}
