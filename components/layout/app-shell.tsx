"use client"

import { SidebarNav, BottomNav } from "@/components/layout/app-nav"
import { AuthGuard } from "@/components/auth-guard"

interface AppShellProps {
  children: React.ReactNode
  /** Pass true for the feed page which manages its own full-height layout */
  fullHeight?: boolean
}

export function AppShell({ children, fullHeight = false }: AppShellProps) {
  return (
    <AuthGuard>
      <div className="flex min-h-[100dvh] bg-background">
        <SidebarNav />

        {/* Main content */}
        <div className={`flex flex-1 flex-col ${fullHeight ? "overflow-hidden" : ""}`}>
          {children}
        </div>
      </div>

      <BottomNav />
    </AuthGuard>
  )
}
