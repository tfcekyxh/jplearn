import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { wordData } from '../data/wordData'
import { saveWrongWord } from '../db/db'
import WordCard from '../components/WordCard'

export default function WordReadingPage() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [knownCount, setKnownCount] = useState(0)
  const [unknownCount, setUnknownCount] = useState(0)
  const [done, setDone] = useState(false)

  const current = wordData[index]
  const total = wordData.length

  const mark = useCallback(
    (known: boolean) => {
      if (known) {
        setKnownCount((c) => c + 1)
      } else {
        setUnknownCount((c) => c + 1)
        saveWrongWord(current.kana)
      }

      if (index + 1 < total) {
        setIndex((i) => i + 1)
      } else {
        setDone(true)
      }
    },
    [index, total, current],
  )

  const restart = useCallback(() => {
    setIndex(0)
    setKnownCount(0)
    setUnknownCount(0)
    setDone(false)
  }, [])

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.85
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }, [])

  if (done) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center px-5 gap-6">
        <p className="text-2xl font-bold text-gray-900">本轮完成 🎉</p>
        <div className="text-center text-gray-500 space-y-1">
          <p>
            我会了：<span className="text-green-500 font-semibold">{knownCount}</span>
          </p>
          <p>
            不会：<span className="text-red-400 font-semibold">{unknownCount}</span>
          </p>
          <p className="text-xs text-gray-300 mt-2">
            共 {total} 个单词
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={restart}
            className="px-6 py-3 rounded-xl bg-blue-500 text-white
                       font-medium active:bg-blue-600 transition-colors"
          >
            再来一轮
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600
                       font-medium active:bg-gray-200 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="pt-6 pb-2 px-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-500"
        >
          ← 首页
        </button>
        <span className="text-xs text-gray-300">
          {index + 1} / {total}
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-4">
        <WordCard word={current} onSpeak={speak} />
      </main>

      <footer className="pb-8 px-5 flex gap-4">
        <button
          onClick={() => mark(false)}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700
                     font-medium text-base active:bg-gray-200 transition-colors"
        >
          不会
        </button>
        <button
          onClick={() => mark(true)}
          className="flex-1 py-3 rounded-xl bg-blue-500 text-white
                     font-medium text-base active:bg-blue-600 transition-colors"
        >
          我会了
        </button>
      </footer>
    </div>
  )
}
