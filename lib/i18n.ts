export type Lang = "en" | "zh-HK"

export const translations = {
  en: {
    // Nav
    "nav.discover": "Discover",
    "nav.progress": "Progress",
    "nav.dashboard": "Dashboard",
    "nav.lang": "廣",

    // Feed
    "feed.scroll": "Scroll for next video",
    "feed.review": "Review",
    "feed.difficulty.1": "Beginner",
    "feed.difficulty.2": "Intermediate",
    "feed.difficulty.3": "Advanced",
    "feed.demo": "Demo mode — scroll down to quiz",
    "feed.audio.loading": "Loading Cantonese narration...",
    "feed.audio.error": "Audio unavailable",

    // Quiz
    "quiz.title": "Quick Quiz",
    "quiz.skip": "Skip",
    "quiz.question": "Question",
    "quiz.of": "/",
    "quiz.correct": "Brilliant!",
    "quiz.incorrect": "Not quite — here's why:",
    "quiz.perfect": "Perfect!",
    "quiz.good": "Great Job!",
    "quiz.keep": "Keep Going!",
    "quiz.xp": "XP earned",
    "quiz.next": "Next Video",

    // XP Toast
    "xp.streak": "day streak!",

    // Onboarding
    "onboarding.step": "Step",
    "onboarding.of": "of",
    "onboarding.step1.heading": "Pick your subjects",
    "onboarding.step1.sub": "We'll personalise your video feed based on what you're studying. Pick all that apply.",
    "onboarding.step2.heading": "Tell us your interests",
    "onboarding.step2.sub": "This helps us generate videos you'll love. e.g. \"football, astronomy, coding\"",
    "onboarding.step2.placeholder": "What do you enjoy outside of school? Your interests make the videos more relatable...",
    "onboarding.selected": "selected",
    "onboarding.next": "Next",
    "onboarding.back": "Back",
    "onboarding.start": "Start Learning",

    // Discover
    "discover.heading": "Discover",
    "discover.sub": "Generate a personalised AI video on any topic",
    "discover.recommended": "Recommended for You",
    "discover.recommended.sub": "Based on your weakest areas",
    "discover.step1": "1. Choose a subject",
    "discover.step2": "2. Enter a topic",
    "discover.suggested": "Suggested topics",
    "discover.generate": "Generate",
    "discover.browse": "Browse Topics",
  },
  "zh-HK": {
    // Nav
    "nav.discover": "探索",
    "nav.progress": "進度",
    "nav.dashboard": "主頁",
    "nav.lang": "EN",

    // Feed
    "feed.scroll": "向下滑動睇下一條",
    "feed.review": "溫習",
    "feed.difficulty.1": "初級",
    "feed.difficulty.2": "中級",
    "feed.difficulty.3": "高級",
    "feed.demo": "示範模式 — 向下滑動做測驗",
    "feed.audio.loading": "載入廣東話講解中...",
    "feed.audio.error": "音頻暫時不可用",

    // Quiz
    "quiz.title": "小測驗",
    "quiz.skip": "略過",
    "quiz.question": "題目",
    "quiz.of": "/",
    "quiz.correct": "答得好！",
    "quiz.incorrect": "唔係喎 — 原因係：",
    "quiz.perfect": "完美！",
    "quiz.good": "做得好！",
    "quiz.keep": "繼續加油！",
    "quiz.xp": "XP 已獲得",
    "quiz.next": "下一條影片",

    // XP Toast
    "xp.streak": "日連續學習！",

    // Onboarding
    "onboarding.step": "第",
    "onboarding.of": "步，共",
    "onboarding.step1.heading": "選擇你嘅科目",
    "onboarding.step1.sub": "我哋會根據你嘅科目為你個人化動態，揀所有適用嘅。",
    "onboarding.step2.heading": "告訴我哋你嘅興趣",
    "onboarding.step2.sub": "呢個幫助我哋生成你鍾意嘅影片，例如「足球、天文、編程」",
    "onboarding.step2.placeholder": "你喺學校以外鍾意做乜？你嘅興趣令影片更貼近你...",
    "onboarding.selected": "個已選",
    "onboarding.next": "下一步",
    "onboarding.back": "返回",
    "onboarding.start": "開始學習",

    // Discover
    "discover.heading": "探索",
    "discover.sub": "生成任何主題嘅個人化 AI 影片",
    "discover.recommended": "為你推薦",
    "discover.recommended.sub": "根據你最弱嘅範疇",
    "discover.step1": "1. 選擇科目",
    "discover.step2": "2. 輸入主題",
    "discover.suggested": "建議主題",
    "discover.generate": "生成",
    "discover.browse": "瀏覽主題",
  },
} as const

export type TranslationKey = keyof typeof translations.en
