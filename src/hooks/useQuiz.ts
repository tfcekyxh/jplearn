import { useState, useCallback, useMemo } from 'react'
import type { Kana } from '../data/kanaData'
import { kanaData } from '../data/kanaData'

type Script = 'hiragana' | 'katakana'

interface Question {
  kana: Kana
  script: Script
}

interface Score {
  correct: number
  total: number
}

interface Feedback {
  correct: boolean
  expected: string
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateQuestion(): Question {
  return {
    kana: randomItem(kanaData),
    script: Math.random() < 0.5 ? 'hiragana' : 'katakana',
  }
}

export function useQuiz() {
  const [question, setQuestion] = useState<Question>(generateQuestion)
  const [score, setScore] = useState<Score>({ correct: 0, total: 0 })
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const submitAnswer = useCallback(
    (answer: string) => {
      const trimmed = answer.trim().toLowerCase()
      const expected = question.kana.romaji
      const correct = trimmed === expected
      setFeedback({ correct, expected })
      setScore((s) => ({
        correct: s.correct + (correct ? 1 : 0),
        total: s.total + 1,
      }))
    },
    [question],
  )

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion())
    setFeedback(null)
  }, [])

  const rate = useMemo(() => {
    if (score.total === 0) return null
    return Math.round((score.correct / score.total) * 100)
  }, [score])

  return {
    question,
    score,
    rate,
    feedback,
    submitAnswer,
    nextQuestion,
  }
}
