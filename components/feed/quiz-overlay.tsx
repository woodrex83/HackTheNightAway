"use client"

import { useState, useCallback } from "react"
import { CheckCircle2, XCircle, Trophy, ArrowRight, Zap, Flame } from "lucide-react"
import type { Quiz, QuizQuestion } from "@/lib/supabase/types"
import { useLanguage } from "@/components/language-provider"

interface QuizOverlayProps {
  quiz: Quiz
  onComplete: (score: number, xp: number) => void
  onSkip: () => void
}

const XP_PER_CORRECT = 20
const XP_BASE = 10

function OptionButton({
  option,
  index,
  isAnswered,
  userAnswer,
  correctIndex,
  onClick,
}: {
  option: string
  index: number
  isAnswered: boolean
  userAnswer: number | undefined
  correctIndex: number
  onClick: () => void
}) {
  let cls = "border-border bg-card/60 hover:bg-card cursor-pointer active:scale-[0.98]"
  if (isAnswered) {
    if (index === correctIndex) {
      cls = "border-emerald-500/50 bg-emerald-500/15"
    } else if (index === userAnswer) {
      cls = "border-rose-500/50 bg-rose-500/15 opacity-80"
    } else {
      cls = "border-border bg-card/30 opacity-40"
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={isAnswered}
      className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left text-sm font-semibold transition-all ${cls}`}
    >
      {isAnswered && index === correctIndex && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
      )}
      {isAnswered && index === userAnswer && index !== correctIndex && (
        <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
      )}
      {(!isAnswered || (index !== correctIndex && index !== userAnswer)) && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-border text-[10px] font-black text-muted-foreground">
          {String.fromCharCode(65 + index)}
        </span>
      )}
      <span className="text-foreground">{option}</span>
    </button>
  )
}

function QuestionSlide({
  question,
  index,
  total,
  onAnswer,
}: {
  question: QuizQuestion
  index: number
  total: number
  onAnswer: (correct: boolean) => void
}) {
  const [userAnswer, setUserAnswer] = useState<number | undefined>(undefined)
  const [showExplanation, setShowExplanation] = useState(false)
  const { t } = useLanguage()

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (userAnswer !== undefined) return
      setUserAnswer(optionIndex)
      const correct = optionIndex === question.correctIndex
      setTimeout(() => setShowExplanation(true), 400)
      setTimeout(() => onAnswer(correct), 1600)
    },
    [userAnswer, question.correctIndex, onAnswer]
  )

  const isAnswered = userAnswer !== undefined
  const isCorrect = userAnswer === question.correctIndex

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {t("quiz.question")} {index + 1} {t("quiz.of")} {total}
        </span>
        <div className="flex flex-1 gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < index ? "bg-primary" : i === index ? "bg-primary/50" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-base font-black text-foreground leading-snug">{question.question}</p>

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => (
          <OptionButton
            key={i}
            option={option}
            index={i}
            isAnswered={isAnswered}
            userAnswer={userAnswer}
            correctIndex={question.correctIndex}
            onClick={() => handleAnswer(i)}
          />
        ))}
      </div>

      {showExplanation && (
        <div
          className={`rounded-xl border-2 p-3 ${
            isCorrect
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-primary/30 bg-primary/10"
          }`}
        >
          <p
            className={`text-xs font-black mb-1 ${
              isCorrect ? "text-emerald-400" : "text-primary"
            }`}
          >
            {isCorrect ? t("quiz.correct") : t("quiz.incorrect")}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

function ScoreScreen({
  correct,
  total,
  xp,
  onContinue,
}: {
  correct: number
  total: number
  xp: number
  onContinue: () => void
}) {
  const { t } = useLanguage()
  const pct = Math.round((correct / total) * 100)
  const isPerfect = correct === total
  const isGood = pct >= 60

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg ${
          isPerfect
            ? "bg-amber-500/20 border-2 border-amber-500/40"
            : isGood
            ? "bg-emerald-500/20 border-2 border-emerald-500/40"
            : "bg-primary/20 border-2 border-primary/40"
        }`}
      >
        <Trophy
          className={`h-10 w-10 ${
            isPerfect ? "text-amber-400" : isGood ? "text-emerald-400" : "text-primary"
          }`}
        />
      </div>

      <div>
        <p className="text-3xl font-black text-foreground">
          {isPerfect ? t("quiz.perfect") : isGood ? t("quiz.good") : t("quiz.keep")}
        </p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {correct} / {total} correct
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-4 py-2">
        <Zap className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-black text-amber-400">+{xp} {t("quiz.xp")}</span>
      </div>

      <button
        onClick={onContinue}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5"
      >
        {t("quiz.next")}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function QuizOverlay({ quiz, onComplete, onSkip }: QuizOverlayProps) {
  const [currentQ, setCurrentQ] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const { t } = useLanguage()
  const questions = quiz.questions

  const handleAnswer = useCallback(
    (correct: boolean) => {
      const newCorrect = correct ? correctCount + 1 : correctCount
      if (currentQ + 1 >= questions.length) {
        setCorrectCount(newCorrect)
        setIsDone(true)
      } else {
        setCorrectCount(newCorrect)
        setCurrentQ((q) => q + 1)
      }
    },
    [correctCount, currentQ, questions.length]
  )

  const xpEarned = XP_BASE + correctCount * XP_PER_CORRECT

  if (isDone) {
    return (
      <ScoreScreen
        correct={correctCount}
        total={questions.length}
        xp={xpEarned}
        onContinue={() => onComplete(correctCount, xpEarned)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-streak-fire" />
          <span className="text-xs font-black text-foreground">{t("quiz.title")}</span>
        </div>
        <button
          onClick={onSkip}
          className="text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          {t("quiz.skip")}
        </button>
      </div>
      <QuestionSlide
        key={currentQ}
        question={questions[currentQ]}
        index={currentQ}
        total={questions.length}
        onAnswer={handleAnswer}
      />
    </div>
  )
}
