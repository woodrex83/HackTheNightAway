"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { translations, type Lang, type TranslationKey } from "@/lib/i18n"

interface LanguageContextValue {
  lang: Lang
  toggleLang: () => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  toggleLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en")

  useEffect(() => {
    try {
      const stored = localStorage.getItem("app_lang") as Lang | null
      if (stored === "en" || stored === "zh-HK") {
        setLang(stored)
      }
    } catch {
      // ignore
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "zh-HK" : "en"
      try {
        localStorage.setItem("app_lang", next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[lang][key] ?? translations.en[key] ?? key
    },
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
