import type { Metadata, Viewport } from 'next'
import { Nunito, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { UserProvider } from '@/components/user-provider'
import { LanguageProvider } from '@/components/language-provider'
import './globals.css'

const _nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Learning Solo — AI-Powered IB Revision',
  description:
    'Master your IB syllabus with personalised AI-generated videos, spaced repetition quizzes, XP streaks, and a smart learning feed.',
  keywords: ['IB', 'revision', 'AI', 'learning', 'videos', 'spaced repetition'],
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <UserProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </UserProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
