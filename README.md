# Learning Solo

**Learning Solo** is an AI-powered, short-form video learning platform built for IB and DSE students. It turns any exam topic into a personalised, TikTok-style avatar video — complete with an interactive quiz, spaced-repetition tracking, and a bilingual Study Buddy — so students can study smarter, on their own, anywhere.

> Built at **HackTheEast 2026** — Hong Kong, March 2026.

---

## What It Is

Secondary students, especially IB and DSE candidates, struggle to get immediate, personalised help for specific exam topics. Tutors are expensive, YouTube videos are generic, and textbooks are slow. Learning Solo solves this by letting a student type any topic they are struggling with and instantly receive a short AI-generated avatar video explaining it in exam-relevant terms, followed by a quiz to reinforce understanding. Progress is tracked with XP, streaks, and subject mastery scores so students can see exactly where to focus next.

---

## Key Features

- **On-demand AI video generation** — type any IB or DSE topic and receive a personalised short-form avatar video within minutes, powered by HeyGen
- **Interactive quiz overlay** — every video is followed by AI-generated multiple-choice questions; correct answers earn XP and track subject mastery
- **Study Buddy (AI chat agent)** — a contextual chat assistant that answers follow-up questions, explains concepts, and curates related topics using MiniMax
- **Cantonese audio narration** — bilingual support with Cantonese audio tracks for quiz content via Cantonese.ai, serving Hong Kong students in their native language
- **Personalised onboarding** — students select their curriculum (IB or DSE), subjects, and study level so all content is tailored from day one
- **Progress dashboard** — XP totals, daily streak tracking, quiz score trends, subject mastery bar charts, recent activity, and focus-area alerts
- **Spaced repetition signals** — weak topic detection surfaces the subjects with mastery below 50% and routes students back to targeted content
- **Bilingual UI** — full English and Traditional Chinese (Cantonese) interface switchable at any time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Auth & Database | Supabase (Auth + Postgres) |
| AI Video | HeyGen API (avatar video generation) |
| AI Chat & Quiz | MiniMax API (LLM agent, quiz generation, topic curation) |
| Audio | Cantonese.ai API (Cantonese narration) |
| Charts | Recharts |
| Deployment | Vercel |

---

## Features In Detail

### Discover Page
Students choose a subject, enter a topic, and hit Generate. The page polls the HeyGen API and renders the video in a vertical swipe feed once ready. Pre-generated demo videos are available instantly so there is no cold-start wait during demos. A built-in Study Buddy chat panel lets students ask follow-up questions without leaving the page.

### Video Feed
Full-screen vertical video player styled like a short-form feed. Each card shows subject, topic, difficulty level, and a scroll prompt. After the video ends, the quiz overlay slides in automatically.

### Quiz Overlay
Three AI-generated multiple-choice questions per topic. Immediate feedback with explanation for wrong answers. XP is awarded on completion and a streak toast fires if a daily goal is hit.

### Dashboard
Line chart of quiz score trend over 14 days, bar chart of per-subject mastery, stat cards for total XP, videos watched, average quiz score, and day streak. A focus areas panel lists every subject below 50% mastery with a direct link back to Discover.

### Onboarding
Three-step flow: curriculum selection (IB or DSE), subject and level picker, and a free-text interests field. Profile is stored in Supabase and used to personalise video generation prompts.

---

## Project Structure

```
.
├── app/
│   ├── page.tsx                  # Root — redirects to /discover or /onboarding
│   ├── auth/page.tsx             # Sign in / sign up
│   ├── onboarding/page.tsx       # 3-step onboarding flow
│   ├── discover/page.tsx         # Topic search, video generation, Study Buddy chat
│   ├── dashboard/page.tsx        # Progress charts and stats
│   ├── progress/page.tsx         # Detailed progress view
│   └── api/
│       ├── agent/                # MiniMax Study Buddy chat route
│       ├── feed/                 # Video feed data route
│       ├── quiz/                 # Quiz generation and weak-topic routes
│       ├── stt/                  # Speech-to-text route
│       └── video/generate/       # HeyGen video generation route
├── components/
│   ├── feed/                     # VideoPlayer, QuizOverlay, GeneratingCard, XpToast
│   ├── landing/                  # IntroLanding page component
│   ├── layout/                   # AppShell, AppNav
│   ├── ui/                       # shadcn/ui primitives
│   ├── auth-provider.tsx
│   ├── auth-guard.tsx
│   ├── user-provider.tsx
│   ├── language-provider.tsx
│   ├── learning-feed.tsx         # Hot topics feed component
│   └── study-helper.tsx          # Study Buddy panel
├── lib/
│   ├── heygen.ts                 # HeyGen API client (generate + poll)
│   ├── i18n.ts                   # English / Traditional Chinese translations
│   ├── agent.ts                  # MiniMax agent logic
│   ├── audio.ts                  # Cantonese.ai audio helpers
│   ├── auth.ts                   # Auth utilities
│   ├── subject-colors.ts         # Subject icon/colour config for IB and DSE
│   ├── mock-data.ts              # Mock history, mastery, and stat data
│   └── supabase/                 # Supabase client, server, and type definitions
├── scripts/
│   └── intro-video/              # Standalone HeyGen intro video generator
│       ├── generate.ts
│       └── prompt.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local.example
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- A Supabase project
- API keys for MiniMax, HeyGen, and Cantonese.ai

### Installation

```bash
git clone https://github.com/woodrex83/HackTheNightAway.git
cd HackTheNightAway
npm install
```

### Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

See the [Environment Variables](#environment-variables) section below for details on each key.

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Generate an Intro Video (optional)

A standalone script generates a HeyGen intro video using the prompt in `scripts/intro-video/prompt.ts`:

```bash
npm run generate:intro
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and set the following:

| Variable | Required | Description |
|---|---|---|
| `MINIMAX_API_KEY` | Yes | MiniMax API key — used for Study Buddy chat, quiz generation, and topic curation |
| `CANTONESE_AI_API_KEY` | Yes | Cantonese.ai API key — used for Cantonese audio narration in quizzes |
| `HEYGEN_API_KEY` | Yes | HeyGen API key — used to generate avatar videos |
| `HEYGEN_AVATAR_ID` | Yes | HeyGen avatar ID to use for generated videos (e.g. `Daisy-inskirt-20220818`) |
| `HEYGEN_VOICE_ID` | Yes | HeyGen voice ID for the avatar (e.g. `2d5b0e6cf36f460aa7fc47e3eee4ba54`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous (public) key |

To find available avatar and voice IDs for HeyGen:

```
GET https://api.heygen.com/v2/avatars       # list avatars
GET https://api.heygen.com/v2/voices        # list voices
```

---

## Acknowledgements

- [MiniMax](https://www.minimaxi.com) — for the LLM API powering Study Buddy chat, quiz generation, and topic curation
- [Vercel](https://vercel.com) — for hosting and seamless Next.js deployment
- [Cantonese.ai](https://cantonese.ai) — for Cantonese text-to-speech narration that makes the platform accessible to Hong Kong students in their native language
- [HeyGen](https://www.heygen.com) — for the avatar video generation API
- [Supabase](https://supabase.com) — for authentication and persistent data storage
