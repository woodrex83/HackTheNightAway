"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, TrendingUp, LayoutDashboard, Zap } from "lucide-react"
import { useUser } from "@/components/user-provider"
import { useAuth } from "@/components/auth-provider"
import { useLanguage } from "@/components/language-provider"
import type { TranslationKey } from "@/lib/i18n"

const NAV_ITEMS: { href: string; labelKey: TranslationKey; icon: React.FC<{ className?: string }> }[] = [
  { href: "/discover", labelKey: "nav.discover", icon: Search },
  { href: "/progress", labelKey: "nav.progress", icon: TrendingUp },
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
]

function XpBadge() {
  const { profile } = useUser()
  if (!profile) return null
  return (
    <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-black text-amber-400">
      <Zap className="h-3 w-3" />
      {profile.xp.toLocaleString()}
    </span>
  )
}

function LangToggle({ className }: { className?: string }) {
  const { lang, toggleLang, t } = useLanguage()
  return (
    <button
      onClick={toggleLang}
      className={`flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-black text-foreground transition-colors hover:bg-primary/10 hover:border-primary/40 hover:text-primary ${className ?? ""}`}
      aria-label={`Switch to ${lang === "en" ? "Cantonese" : "English"}`}
    >
      {t("nav.lang")}
    </button>
  )
}

export function SidebarNav() {
  const pathname = usePathname()
  const { session, signOut } = useAuth()
  const { t } = useLanguage()

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-black tracking-tight">
          Learning<span className="text-primary"> Solo</span>
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
              {labelKey === "nav.progress" && <XpBadge />}
            </Link>
          )
        })}
      </nav>

      {/* User strip */}
      <div className="border-t border-border p-3 flex flex-col gap-2">
        <LangToggle className="w-full justify-center" />
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-black text-primary">
            {session?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-bold text-foreground">{session?.username}</span>
            <span className="text-[10px] text-muted-foreground">IB Student</span>
          </div>
          <button
            onClick={signOut}
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground"
          >
            Out
          </button>
        </div>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-bottom md:hidden">
      {/* Language toggle strip */}
      <div className="flex justify-end px-4 pt-1.5">
        <LangToggle />
      </div>
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 transition-all active:scale-95 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-primary/15 -translate-y-0.5 shadow-sm shadow-primary/20"
                    : "bg-transparent"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-extrabold">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
