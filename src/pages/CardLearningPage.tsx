import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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
  const rowNavRef = useRef<HTMLElement>(null)
  // 标签横滑行两侧是否还有未露出的内容，用于控制边缘渐隐提示
  const [rowNavEdge, setRowNavEdge] = useState({ left: false, right: true })

  useEffect(() => {
    const el = rowNavRef.current
    if (!el) return
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      setRowNavEdge({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

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

      <div className="relative shrink-0">
        {/* touch-pan-x：斜向滑动也优先识别为横滑，避免与垂直橡皮筋手势冲突；
            overscroll-x-contain：滑到尽头不触发浏览器前进/后退手势。
            左右 padding 放在滚动内容上，保证末端留白在任何 WebKit 下都能滚入 */}
        <nav
          ref={rowNavRef}
          className="overflow-x-auto scrollbar-hide touch-pan-x overscroll-x-contain"
        >
          <div className="flex gap-2 min-w-max px-5 py-2.5">
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
        {/* 边缘渐隐：提示该方向还有标签可滑，到边自动消失；不拦截触摸 */}
        {rowNavEdge.left && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
        )}
        {rowNavEdge.right && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
        )}
      </div>

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
