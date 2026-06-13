import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../hooks/useQuiz'
import { kanaData } from '../data/kanaData'
import { getLearnedRomaji, saveWrongKana, saveQuizResult, getQuizStats } from '../db/db'

export default function QuizPage() {
  const navigate = useNavigate()
  const [learnedRomaji, setLearnedRomaji] = useState<string[] | null>(null)
  const [persistedStats, setPersistedStats] = useState<{ correct: number; total: number } | null>(null)

  // 加载已学假名和历史统计
  useEffect(() => {
    getLearnedRomaji().then(setLearnedRomaji)
    getQuizStats().then(setPersistedStats)
  }, [])

  // 题库：已学假名非空则从中抽选，否则全量
  const pool = useMemo(() => {
    if (!learnedRomaji || learnedRomaji.length === 0) return kanaData
    const set = new Set(learnedRomaji)
    const filtered = kanaData.filter((k) => set.has(k.romaji))
    return filtered.length > 0 ? filtered : kanaData
  }, [learnedRomaji])

  const { question, score, rate, feedback, submitAnswer, nextQuestion } = useQuiz(pool)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [question])

  const displayedChar = question.script === 'hiragana'
    ? question.kana.hiragana
    : question.kana.katakana

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return
    const result = submitAnswer(input)
    // 持久化：错题 + 统计
    if (!result.correct) {
      saveWrongKana(result.expected)
    }
    saveQuizResult(result.correct)
  }, [input, submitAnswer])

  const handleNext = useCallback(() => {
    setInput('')
    nextQuestion()
  }, [nextQuestion])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (feedback) {
          handleNext()
        } else {
          handleSubmit()
        }
      }
    },
    [feedback, handleSubmit, handleNext],
  )

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }, [])

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="pt-6 pb-2 px-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-500"
        >
          ← 首页
        </button>
        <div className="text-xs text-gray-400 text-right">
          <div>
            {score.total > 0 && `本轮 ${score.correct}/${score.total}`}
            {rate !== null && (
              <span className="ml-1 text-gray-500 font-medium">{rate}%</span>
            )}
          </div>
          {persistedStats && persistedStats.total > 0 && (
            <div className="text-gray-300">
              累计 {persistedStats.correct}/{persistedStats.total}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 gap-8">
        <span className="text-9xl font-light text-gray-900 select-none leading-none">
          {displayedChar}
        </span>

        <span className="text-xs text-gray-300">
          {question.script === 'hiragana' ? '平假名' : '片假名'}
        </span>

        <div className="w-full max-w-sm flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!feedback}
            placeholder="输入罗马音..."
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={`flex-1 px-4 py-3 rounded-xl border text-center text-lg
                       outline-none transition-colors
                       ${feedback
                         ? feedback.correct
                           ? 'border-green-300 bg-green-50 text-green-700'
                           : 'border-red-300 bg-red-50 text-red-700'
                         : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-300'
                       }`}
          />
        </div>

        {!feedback ? (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-full max-w-sm py-3 rounded-xl bg-blue-500 text-white
                       font-medium text-base disabled:opacity-30
                       active:bg-blue-600 transition-colors"
          >
            确认
          </button>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center gap-4">
            <div className={`text-center px-5 py-3 rounded-xl w-full
              ${feedback.correct ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <p className="text-lg font-bold">
                {feedback.correct ? '✓ 正确' : '✗ 错误'}
              </p>
              {!feedback.correct && (
                <p className="text-sm mt-1">
                  正确读音：<span className="font-mono font-bold">{feedback.expected}</span>
                </p>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => speak(question.kana.hiragana)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700
                           font-medium text-base active:bg-gray-200 transition-colors"
              >
                🔊 听发音
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white
                           font-medium text-base active:bg-blue-600 transition-colors"
              >
                下一题
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="pb-6" />
    </div>
  )
}
