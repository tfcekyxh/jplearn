import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../hooks/useQuiz'

export default function QuizPage() {
  const navigate = useNavigate()
  const { question, score, rate, feedback, submitAnswer, nextQuestion } = useQuiz()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [question])

  const displayedChar = question.script === 'hiragana'
    ? question.kana.hiragana
    : question.kana.katakana

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return
    submitAnswer(input)
  }, [input, submitAnswer])

  const handleNext = useCallback(() => {
    setInput('')
    nextQuestion()
  }, [nextQuestion])

  // 回车提交
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

  // 发音
  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }, [])

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 顶部 */}
      <header className="pt-6 pb-2 px-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-500"
        >
          ← 首页
        </button>
        <span className="text-xs text-gray-400">
          {score.total > 0 && `${score.correct}/${score.total}`}
          {rate !== null && (
            <span className="ml-1 text-gray-500 font-medium">{rate}%</span>
          )}
        </span>
      </header>

      {/* 题目区 */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 gap-8">
        {/* 假名大字 */}
        <span className="text-9xl font-light text-gray-900 select-none leading-none">
          {displayedChar}
        </span>

        {/* 片假名/平假名提示 */}
        <span className="text-xs text-gray-300">
          {question.script === 'hiragana' ? '平假名' : '片假名'}
        </span>

        {/* 输入区 */}
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

        {/* 按钮 */}
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
            {/* 反馈 */}
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

      {/* 底部占位 */}
      <footer className="pb-6" />
    </div>
  )
}
