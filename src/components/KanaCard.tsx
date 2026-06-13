import type { Kana } from '../data/kanaData'

interface Props {
  kana: Kana
  onSpeak: (text: string) => void
}

export default function KanaCard({ kana, onSpeak }: Props) {
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
      {kana.mnemonic ? (
        <p className="text-sm text-gray-400 text-center leading-relaxed mt-1">
          {kana.mnemonic}
        </p>
      ) : (
        <p className="text-sm text-gray-200 text-center italic mt-1">
          口诀待生成
        </p>
      )}

      {/* 发音按钮 */}
      <button
        onClick={() => onSpeak(kana.hiragana)}
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
