"use client"

import { useEffect, useState } from "react"
import { Zap, Flame } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface XpToastProps {
  xp: number
  streak: number
  onDone?: () => void
}

export function XpToast({ xp, streak, onDone }: XpToastProps) {
  const [visible, setVisible] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, 2500)
    return () => clearTimeout(timer)
  }, [onDone])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-card/90 border border-border px-5 py-3 shadow-2xl shadow-black/30 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
          <Zap className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground">+{xp} XP</span>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-400" />
              {streak} {t("xp.streak")}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
