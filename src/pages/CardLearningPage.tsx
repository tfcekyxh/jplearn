import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { kanaData, rows, rowLabels, type RowKey } from '../data/kanaData'
import { markKanaLearned } from '../db/db'
import { useMnemonics } from '../hooks/useMnemonics'
import { useAudio } from '../hooks/useAudio'
import KanaCard from '../components/KanaCard'

export default function CardLearningPage() {
  const navigate = useNavigate()
  const [selectedRow, setSelectedRow] = useState<RowKey | null>(null)
  const [index, setIndex] = useState(0)

  const { mnemonics, isGenerating, error, generateAll, regenerateOne, clearError } = useMnemonics()

  const filtered = useMemo(
    () => (selectedRow ? kanaData.filter((k) => k.row === selectedRow) : kanaData),
    [selectedRow],
  )

  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1))
  const current = filtered[safeIndex]

  // 将 IndexedDB 中的口诀叠加到当前假名对象（不修改源数据）
  const enhancedCurrent = useMemo(() => {
    if (!current) return null
    const persisted = mnemonics[current.romaji]
    return persisted ? { ...current, mnemonic: persisted } : current
  }, [current, mnemonics])

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

  const playAudio = useAudio()

  const position = filtered.length > 0 ? `${safeIndex + 1} / ${filtered.length}` : '0 / 0'

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="pt-6 pb-2 px-5 flex items-center justify-between gap-2">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-500 py-2 shrink-0"
        >
          ← 首页
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {error && (
            <span
              onClick={clearError}
              className="text-xs text-red-400 truncate cursor-pointer"
            >
              {error}
            </span>
          )}
          <button
            onClick={generateAll}
            disabled={isGenerating}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all
              ${isGenerating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-500 active:bg-blue-100'
              }`}
          >
            {isGenerating ? 'AI生成中...' : 'AI生成口诀'}
          </button>
        </div>

        <span className="text-xs text-gray-300 shrink-0">{position}</span>
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
        {enhancedCurrent && (
          <KanaCard
            key={current!.romaji}
            kana={enhancedCurrent}
            onSpeak={playAudio}
            isLoading={isGenerating}
            autoSpeak
            onRegenerate={regenerateOne}
          />
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
