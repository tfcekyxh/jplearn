import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../hooks/useQuiz'
import { kanaData } from '../data/kanaData'
import { getLearnedRomaji, saveWrongKana, saveQuizResult, getQuizStats } from '../db/db'
import { useAudio } from '../hooks/useAudio'

// 罗马音最长 3 个字母（如 tsu/chi），留 1 个余量
const MAX_ANSWER_LEN = 4

const KEY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

export default function QuizPage() {
  const navigate = useNavigate()
  const [learnedRomaji, setLearnedRomaji] = useState<string[] | null>(null)
  const [persistedStats, setPersistedStats] = useState<{ correct: number; total: number } | null>(null)

  useEffect(() => {
    getLearnedRomaji().then(setLearnedRomaji)
    getQuizStats().then(setPersistedStats)
  }, [])

  // 触屏设备使用页面内自绘罗马音键盘，桌面端继续用真实输入框 + 物理键盘。
  // 自绘键盘模式下页面中不存在可聚焦的 input，系统输入法永远不会弹出，
  // 因此也不需要 visualViewport 监听与布局缩放，彻底消除键盘动画带来的卡顿感。
  const isTouch = useMemo(
    () => window.matchMedia?.('(pointer: coarse)').matches ?? false,
    [],
  )

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
    if (!isTouch) inputRef.current?.focus()
  }, [question, isTouch])

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
  }, [input, submitAnswer])

  const handleNext = useCallback(() => {
    setInput('')
    nextQuestion()
    // 桌面端在点击手势内重新聚焦，保持可直接敲键答题
    if (!isTouch) inputRef.current?.focus()
  }, [nextQuestion, isTouch])

  // 自绘键盘按键（触屏点击 / 外接物理键盘共用）
  const pressLetter = useCallback((ch: string) => {
    if (feedback) return
    setInput((v) => (v.length >= MAX_ANSWER_LEN ? v : v + ch))
  }, [feedback])

  const pressBackspace = useCallback(() => {
    if (feedback) return
    setInput((v) => v.slice(0, -1))
  }, [feedback])

  // 触屏设备若接了物理键盘也能答题
  useEffect(() => {
    if (!isTouch) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        if (feedback) handleNext()
        else handleSubmit()
      } else if (!feedback && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault()
        pressLetter(e.key.toLowerCase())
      } else if (!feedback && e.key === 'Backspace') {
        e.preventDefault()
        pressBackspace()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isTouch, feedback, handleSubmit, handleNext, pressLetter, pressBackspace])

  const playAudio = useAudio()
  const speak = () => playAudio(`${import.meta.env.BASE_URL}audio/${question.kana.romaji}.mp3`)

  const answerBoxClass = `w-full px-4 py-4 rounded-xl border text-center text-lg
    outline-none transition-colors duration-200
    ${feedback
      ? feedback.correct
        ? 'border-green-300 bg-green-50 text-green-700'
        : 'border-red-300 bg-red-50 text-red-700'
      : 'border-gray-200 bg-gray-50 text-gray-900'
    }`

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      <header className="pt-6 pb-2 px-5 flex items-center justify-between shrink-0">
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

      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-5 gap-6">
        {/* 假名大字 — 自绘键盘是页面布局的一部分，永不弹系统键盘，字号恒定无需缩放 */}
        <span
          key={displayedChar + question.script}
          className="text-9xl font-light text-gray-900 select-none leading-none animate-card-in"
        >
          {displayedChar}
        </span>

        <span className="text-xs text-gray-300">
          {question.script === 'hiragana' ? '平假名' : '片假名'}
        </span>

        <div className="w-full max-w-sm">
          {isTouch ? (
            // 仅用于展示的「输入框」：不可聚焦，系统输入法不会弹出
            <div className={`${answerBoxClass} tracking-[0.3em] select-none`}>
              {feedback ? (
                <span className="font-mono">{input}</span>
              ) : input ? (
                <span className="font-mono">{input}</span>
              ) : (
                <span className="text-gray-400 tracking-normal">输入罗马音...</span>
              )}
              {!feedback && <span className="quiz-caret ml-0.5" />}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                // 不使用 disabled：禁用状态无法 focus，会导致手机上无法唤起键盘
                if (feedback) return
                setInput(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (feedback) handleNext()
                  else handleSubmit()
                }
              }}
              placeholder="输入罗马音..."
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className={answerBoxClass}
            />
          )}
        </div>

        {/* 桌面端：确认按钮 / 反馈操作区；触屏端这些操作由自绘键盘承担 */}
        {!isTouch && !feedback && (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-full max-w-sm py-4 rounded-xl bg-blue-500 text-white
                       font-medium text-base disabled:opacity-30
                       active:bg-blue-600 transition-colors min-h-[48px]"
          >
            确认
          </button>
        )}
        {!isTouch && feedback && (
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
                onClick={speak}
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

        {/* 触屏端反馈：保持紧凑，键盘上的回车即「下一题」 */}
        {isTouch && feedback && (
          <div className="w-full max-w-sm animate-feedback-in">
            <div className={`text-center px-5 py-3 rounded-xl
              ${feedback.correct ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <p className="text-base font-bold">
                {feedback.correct ? '✓ 正确' : '✗ 错误'}
                {!feedback.correct && (
                  <span className="text-sm font-normal ml-2">
                    正确读音：<span className="font-mono font-bold">{feedback.expected}</span>
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={speak}
              className="mt-2 w-full py-2.5 rounded-xl bg-gray-100 text-gray-600
                         text-sm font-medium active:bg-gray-200 transition-colors"
            >
              🔊 听发音
            </button>
          </div>
        )}
      </main>

      {isTouch && (
        <RomajiKeyboard
          feedback={!!feedback}
          canSubmit={input.trim().length > 0}
          onLetter={pressLetter}
          onBackspace={pressBackspace}
          onEnter={feedback ? handleNext : handleSubmit}
        />
      )}
    </div>
  )
}

function RomajiKeyboard({
  feedback,
  canSubmit,
  onLetter,
  onBackspace,
  onEnter,
}: {
  feedback: boolean
  canSubmit: boolean
  onLetter: (ch: string) => void
  onBackspace: () => void
  onEnter: () => void
}) {
  // touch-manipulation：去掉双击缩放判定，点击零延迟；select-none：防选词弹窗
  const keyBase =
    `h-11 rounded-lg bg-white text-gray-800 text-lg font-medium flex items-center justify-center
     shadow-[0_1px_0_rgba(0,0,0,0.18)] active:bg-gray-300 transition-colors
     touch-manipulation select-none cursor-pointer`

  return (
    <div
      className="shrink-0 border-t border-gray-200 bg-gray-100 px-1.5 pt-1.5"
      style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {KEY_ROWS.map((row, i) => (
        <div key={i} className="flex gap-1.5 mb-1.5 last:mb-0">
          {i === 2 && <div className="flex-[0.5]" />}
          {row.map((ch) => (
            <button
              key={ch}
              type="button"
              // pointerdown 即时响应（不等 click），但阻止默认聚焦行为
              onPointerDown={(e) => {
                e.preventDefault()
                onLetter(ch)
              }}
              disabled={feedback}
              className={`flex-1 ${keyBase} disabled:opacity-40`}
            >
              {ch}
            </button>
          ))}
          {i === 2 && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault()
                onBackspace()
              }}
              disabled={feedback}
              aria-label="退格"
              className={`flex-[1.5] text-2xl ${keyBase} disabled:opacity-40`}
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          onEnter()
        }}
        disabled={!feedback && !canSubmit}
        className={`mt-1 w-full h-11 rounded-lg text-white text-base font-medium
                    touch-manipulation select-none transition-colors
                    ${feedback
                      ? 'bg-green-500 active:bg-green-600'
                      : 'bg-blue-500 active:bg-blue-600 disabled:opacity-30'}`}
      >
        {feedback ? '下一题 ↵' : '确认 ↵'}
      </button>
    </div>
  )
}
