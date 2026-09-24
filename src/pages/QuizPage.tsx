import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../hooks/useQuiz'
import { kanaData } from '../data/kanaData'
import { getLearnedRomaji, saveWrongKana, saveQuizResult, getQuizStats } from '../db/db'
import { useAudio } from '../hooks/useAudio'

export default function QuizPage() {
  const navigate = useNavigate()
  const [learnedRomaji, setLearnedRomaji] = useState<string[] | null>(null)
  const [persistedStats, setPersistedStats] = useState<{ correct: number; total: number } | null>(null)

  useEffect(() => {
    getLearnedRomaji().then(setLearnedRomaji)
    getQuizStats().then(setPersistedStats)
  }, [])

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

  // 监听视觉视口：手机软键盘弹出时 visualViewport.height 会明显变小
  // （iOS 上 layout viewport 高度不变，这是键盘弹起唯一可靠的信号）。
  // 用「历史最大高度 - 当前高度」判定，阈值 120px 可滤掉浏览器地址栏伸缩。
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [visibleHeight, setVisibleHeight] = useState<number | null>(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let maxHeight = vv.height
    const update = () => {
      if (vv.height > maxHeight) maxHeight = vv.height
      const open = maxHeight - vv.height > 120
      setKeyboardOpen(open)
      setVisibleHeight(open ? vv.height : null)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  const displayedChar = question.script === 'hiragana'
    ? question.kana.hiragana
    : question.kana.katakana

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return
    const result = submitAnswer(input)
    if (!result.correct) {
      saveWrongKana(result.expected)
    }
    saveQuizResult(result.correct)
    // 触屏设备提交后主动收起键盘，把屏幕让给正误反馈和操作按钮；
    // 点击「下一题」时会在点击手势内重新 focus 唤起键盘
    if (window.matchMedia?.('(pointer: coarse)').matches) {
      inputRef.current?.blur()
    }
  }, [input, submitAnswer])

  const handleNext = useCallback(() => {
    setInput('')
    nextQuestion()
    // iOS Safari 仅在用户手势的同步调用栈内 focus 才会唤起软键盘，
    // 输入框必须保持非 disabled/readonly，此处 focus 才能生效
    inputRef.current?.focus()
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

  const playAudio = useAudio()

  return (
    <div
      className="h-full bg-white flex flex-col overflow-hidden transition-[height] duration-200"
      style={visibleHeight !== null ? { height: visibleHeight } : undefined}
    >
      <header className="pt-6 pb-2 px-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-500 py-2"
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

      <main
        className={`flex-1 flex flex-col items-center justify-center px-5 transition-[gap] duration-200
          ${keyboardOpen ? 'gap-4' : 'gap-8'}`}
      >
        {/* 假名大字 — 键盘弹起时缩小，收回后还原；切换时带动画 */}
        <span
          key={displayedChar + question.script}
          className={`font-light text-gray-900 select-none leading-none animate-card-in
                      transition-[font-size] duration-200
                      ${keyboardOpen ? 'text-7xl' : 'text-9xl'}`}
        >
          {displayedChar}
        </span>

        <span className="text-xs text-gray-300">
          {question.script === 'hiragana' ? '平假名' : '片假名'}
        </span>

        <div className="w-full max-w-sm">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              // 不使用 disabled：禁用状态无法 focus，会导致手机上无法唤起键盘
              if (feedback) return
              setInput(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder="输入罗马音..."
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={`w-full px-4 py-4 rounded-xl border text-center text-lg
                       outline-none transition-all duration-200
                       ${feedback ? 'pointer-events-none ' : ''}
                       ${feedback
                         ? feedback.correct
                           ? 'border-green-300 bg-green-50 text-green-700'
                           : 'border-red-300 bg-red-50 text-red-700'
                         : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                       }`}
          />
        </div>

        {!feedback ? (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-full max-w-sm py-4 rounded-xl bg-blue-500 text-white
                       font-medium text-base disabled:opacity-30
                       active:bg-blue-600 transition-colors min-h-[48px]"
          >
            确认
          </button>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-feedback-in">
            <div className={`text-center px-5 py-4 rounded-xl w-full
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
                onClick={() => playAudio(`${import.meta.env.BASE_URL}audio/${question.kana.romaji}.mp3`)}
                className="flex-1 py-4 rounded-xl bg-gray-100 text-gray-700
                           font-medium text-base active:bg-gray-200
                           transition-colors min-h-[48px]"
              >
                🔊 听发音
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-4 rounded-xl bg-blue-500 text-white
                           font-medium text-base active:bg-blue-600
                           transition-colors min-h-[48px]"
              >
                下一题
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className={`transition-[padding] duration-200 ${keyboardOpen ? 'pb-2' : 'pb-6'}`} />
    </div>
  )
}
