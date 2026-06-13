import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { kanaData, rows, rowLabels, type RowKey } from '../data/kanaData'
import KanaCard from '../components/KanaCard'

export default function CardLearningPage() {
  const navigate = useNavigate()
  const [selectedRow, setSelectedRow] = useState<RowKey | null>(null)
  const [index, setIndex] = useState(0)

  // 按行筛选
  const filtered = useMemo(
    () => (selectedRow ? kanaData.filter((k) => k.row === selectedRow) : kanaData),
    [selectedRow],
  )

  // 安全修正 index（切换筛选条件时可能越界）
  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1))

  const current = filtered[safeIndex]

  // 翻页
  const goPrev = useCallback(() => {
    setIndex((i) => {
      const ni = i - 1
      return ni < 0 ? filtered.length - 1 : ni
    })
  }, [filtered.length])

  const goNext = useCallback(() => {
    setIndex((i) => {
      const ni = i + 1
      return ni >= filtered.length ? 0 : ni
    })
  }, [filtered.length])

  // 切换行时重置 index
  const handleRowChange = useCallback((row: RowKey | null) => {
    setSelectedRow(row)
    setIndex(0)
  }, [])

  // 发音
  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }, [])

  // 当前在筛选列表中的位置显示
  const position = filtered.length > 0 ? `${safeIndex + 1} / ${filtered.length}` : '0 / 0'

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 顶部导航 */}
      <header className="pt-6 pb-2 px-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-500"
        >
          ← 首页
        </button>
        <span className="text-xs text-gray-300">{position}</span>
      </header>

      {/* 行筛选器 */}
      <nav className="px-5 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
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

      {/* 卡片区域 */}
      <main className="flex-1 flex items-center justify-center px-5 py-4">
        {current && (
          <KanaCard kana={current} onSpeak={speak} />
        )}
      </main>

      {/* 底部导航按钮 */}
      <footer className="pb-8 px-5 flex justify-between items-center gap-4">
        <button
          onClick={goPrev}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700
                     font-medium text-base active:bg-gray-200 transition-colors"
        >
          上一张
        </button>
        <button
          onClick={goNext}
          className="flex-1 py-3 rounded-xl bg-blue-500 text-white
                     font-medium text-base active:bg-blue-600 transition-colors"
        >
          下一张
        </button>
      </footer>
    </div>
  )
}

// 筛选小标签
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
      className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
        ${active
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-500 active:bg-gray-200'
        }`}
    >
      {children}
    </button>
  )
}
