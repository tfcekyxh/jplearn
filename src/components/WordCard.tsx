import type { Word } from '../data/wordData'

interface Props {
  word: Word
  onSpeak: (text: string) => void
}

export default function WordCard({ word, onSpeak }: Props) {
  return (
    <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg px-8 py-10
                    flex flex-col items-center gap-4">
      {/* 单词假名大字 */}
      <span className="text-5xl font-light text-gray-900 leading-none select-none tracking-wider">
        {word.kana}
      </span>

      {/* 汉字（如有） */}
      {word.kanji && (
        <span className="text-xl text-gray-400 select-none">
          {word.kanji}
        </span>
      )}

      {/* 中文意思 */}
      <span className="text-lg text-gray-500">
        {word.meaning}
      </span>

      {/* 发音按钮 */}
      <button
        onClick={() => onSpeak(word.kana)}
        className="mt-2 w-12 h-12 rounded-full bg-blue-50 text-blue-500
                   flex items-center justify-center text-lg
                   active:bg-blue-100 transition-colors"
        aria-label={`播放 ${word.kana} 的发音`}
      >
        🔊
      </button>
    </div>
  )
}
