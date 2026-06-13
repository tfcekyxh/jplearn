import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { kanaData, rows, rowLabels, type RowKey } from '../data/kanaData'
import { markKanaLearned } from '../db/db'
import KanaCard from '../components/KanaCard'

export default function CardLearningPage() {
  const navigate = useNavigate()
  const [selectedRow, setSelectedRow] = useState<RowKey | null>(null)
  const [index, setIndex] = useState(0)

  const filtered = useMemo(
    () => (selectedRow ? kanaData.filter((k) => k.row === selectedRow) : kanaData),
    [selectedRow],
  )

  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1))
  const current = filtered[safeIndex]

  useEffect(() => {
    if (current) {
      markKanaLearned(current.romaji)
    }
  }, [current])

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 < 0 ? filtered.length - 1 : i - 1))
  }, [filtered.length])

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1 >= filtered.length ? 0 : i + 1))
  }, [filtered.length])

  const handleRowChange = useCallback((row: RowKey | null) => {
    setSelectedRow(row)
    setIndex(0)
  }, [])

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }, [])

  const position = filtered.length > 0 ? `${safeIndex + 1} / ${filtered.length}` : '0 / 0'

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="pt-6 pb-2 px-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-500 py-2"
        >
          ← 首页
        </button>
        <span className="text-xs text-gray-300">{position}</span>
      </header>

      <nav className="px-5 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max pb-1">
          <FilterChip
            active={selectedRow === null}
            onClick={() => handleRowChange(null)}
          >
            全部
          </FilterChip>
          {rows.map((row) => (
            <FilterChip
              key={row}
              active={selectedRow === row}
              onClick={() => handleRowChange(row)}
            >
              {rowLabels[row]}
            </FilterChip>
          ))}
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-5 py-4">
        {current && (
          <KanaCard key={current.romaji} kana={current} onSpeak={speak} />
        )}
      </main>

      <footer className="pb-8 px-5 flex gap-4">
        <button
          onClick={goPrev}
          className="flex-1 py-4 rounded-xl bg-gray-100 text-gray-700
                     font-medium text-base active:bg-gray-200
                     transition-colors min-h-[48px]"
        >
          上一张
        </button>
        <button
          onClick={goNext}
          className="flex-1 py-4 rounded-xl bg-blue-500 text-white
                     font-medium text-base active:bg-blue-600
                     transition-colors min-h-[48px]"
        >
          下一张
        </button>
      </footer>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
        ${active
          ? 'bg-blue-500 text-white shadow-sm'
          : 'bg-gray-100 text-gray-500 active:bg-gray-200'
        }`}
    >
      {children}
    </button>
  )
}
