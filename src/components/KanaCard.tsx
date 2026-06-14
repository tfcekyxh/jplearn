import { useEffect } from 'react'
import type { Kana } from '../data/kanaData'

interface Props {
  kana: Kana
  onSpeak: (url: string) => void
  isLoading?: boolean
  onRegenerate?: (romaji: string, hiragana: string, katakana: string) => void
  autoSpeak?: boolean
}

export default function KanaCard({ kana, onSpeak, isLoading, onRegenerate, autoSpeak }: Props) {
  useEffect(() => {
    if (autoSpeak) {
      onSpeak(`${import.meta.env.BASE_URL}audio/${kana.romaji}.mp3`)
    }
  }, [])
  return (
    <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg px-8 py-12
                    flex flex-col items-center gap-5 animate-card-in">
      {/* 平假名大字 */}
      <span className="text-[7rem] font-light text-gray-900 leading-none select-none">
        {kana.hiragana}
      </span>

      {/* 片假名 */}
      <span className="text-2xl text-gray-300 select-none">
        {kana.katakana}
      </span>

      {/* 罗马音 */}
      <span className="text-lg text-gray-500 font-mono tracking-wider">
        {kana.romaji}
      </span>

      {/* 速记口诀 */}
      {isLoading ? (
        <div className="flex items-center gap-2 mt-1 text-sm text-blue-400">
          <span className="inline-block w-4 h-4 border-2 border-blue-300 border-t-blue-500
                          rounded-full animate-spin" />
          生成中...
        </div>
      ) : kana.mnemonic ? (
        <div className="flex flex-col items-center gap-1 mt-1">
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            {kana.mnemonic}
          </p>
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(kana.romaji, kana.hiragana, kana.katakana)}
              className="text-xs text-blue-400 underline underline-offset-2
                         active:text-blue-600 transition-colors"
            >
              重新生成
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-200 text-center italic mt-1">
          口诀待生成
        </p>
      )}

      {/* 发音按钮 */}
      <button
        onClick={() => onSpeak(`${import.meta.env.BASE_URL}audio/${kana.romaji}.mp3`)}
        className="mt-3 w-14 h-14 rounded-full bg-blue-50 text-blue-500
                   flex items-center justify-center text-xl
                   active:bg-blue-100 active:scale-95 transition-all"
        aria-label={`播放 ${kana.romaji} 的发音`}
      >
        🔊
      </button>
    </div>
  )
}
