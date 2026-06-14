import type { Word } from '../data/wordData'

interface Props {
  word: Word
  onSpeak: (url: string) => void
}

export default function WordCard({ word, onSpeak }: Props) {
  return (
    <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg px-8 py-12
                    flex flex-col items-center gap-5 animate-card-in">
      {/* 单词假名大字 */}
      <span className="text-[3.5rem] font-light text-gray-900 leading-none select-none tracking-wider">
        {word.kana}
      </span>

      {/* 汉字 */}
      {word.kanji && (
        <span className="text-2xl text-gray-400 select-none">
          {word.kanji}
        </span>
      )}

      {/* 中文意思 */}
      <span className="text-lg text-gray-500">
        {word.meaning}
      </span>

      {/* 发音按钮 */}
      <button
        onClick={() => onSpeak(`${import.meta.env.BASE_URL}audio/w_${word.id}.mp3`)}
        className="mt-3 w-14 h-14 rounded-full bg-blue-50 text-blue-500
                   flex items-center justify-center text-xl
                   active:bg-blue-100 active:scale-95 transition-all"
        aria-label={`播放 ${word.kana} 的发音`}
      >
        🔊
      </button>
    </div>
  )
}
