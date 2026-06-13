export interface Kana {
  hiragana: string
  katakana: string
  romaji: string
  row: string
  mnemonic: string
}

export type RowKey = 'a' | 'ka' | 'sa' | 'ta' | 'na' | 'ha' | 'ma' | 'ya' | 'ra' | 'wa' | 'n'

// 五十音全表：平假名、片假名、罗马音、所属行、速记口诀（后续 AI 生成）
export const kanaData: Kana[] = [
  // === あ行 ===
  { hiragana: 'あ', katakana: 'ア', romaji: 'a',  row: 'a',  mnemonic: '' },
  { hiragana: 'い', katakana: 'イ', romaji: 'i',  row: 'a',  mnemonic: '' },
  { hiragana: 'う', katakana: 'ウ', romaji: 'u',  row: 'a',  mnemonic: '' },
  { hiragana: 'え', katakana: 'エ', romaji: 'e',  row: 'a',  mnemonic: '' },
  { hiragana: 'お', katakana: 'オ', romaji: 'o',  row: 'a',  mnemonic: '' },

  // === か行 ===
  { hiragana: 'か', katakana: 'カ', romaji: 'ka', row: 'ka', mnemonic: '' },
  { hiragana: 'き', katakana: 'キ', romaji: 'ki', row: 'ka', mnemonic: '' },
  { hiragana: 'く', katakana: 'ク', romaji: 'ku', row: 'ka', mnemonic: '' },
  { hiragana: 'け', katakana: 'ケ', romaji: 'ke', row: 'ka', mnemonic: '' },
  { hiragana: 'こ', katakana: 'コ', romaji: 'ko', row: 'ka', mnemonic: '' },

  // === さ行 ===
  { hiragana: 'さ', katakana: 'サ', romaji: 'sa', row: 'sa', mnemonic: '' },
  { hiragana: 'し', katakana: 'シ', romaji: 'shi', row: 'sa', mnemonic: '' },
  { hiragana: 'す', katakana: 'ス', romaji: 'su', row: 'sa', mnemonic: '' },
  { hiragana: 'せ', katakana: 'セ', romaji: 'se', row: 'sa', mnemonic: '' },
  { hiragana: 'そ', katakana: 'ソ', romaji: 'so', row: 'sa', mnemonic: '' },

  // === た行 ===
  { hiragana: 'た', katakana: 'タ', romaji: 'ta', row: 'ta', mnemonic: '' },
  { hiragana: 'ち', katakana: 'チ', romaji: 'chi', row: 'ta', mnemonic: '' },
  { hiragana: 'つ', katakana: 'ツ', romaji: 'tsu', row: 'ta', mnemonic: '' },
  { hiragana: 'て', katakana: 'テ', romaji: 'te', row: 'ta', mnemonic: '' },
  { hiragana: 'と', katakana: 'ト', romaji: 'to', row: 'ta', mnemonic: '' },

  // === な行 ===
  { hiragana: 'な', katakana: 'ナ', romaji: 'na', row: 'na', mnemonic: '' },
  { hiragana: 'に', katakana: 'ニ', romaji: 'ni', row: 'na', mnemonic: '' },
  { hiragana: 'ぬ', katakana: 'ヌ', romaji: 'nu', row: 'na', mnemonic: '' },
  { hiragana: 'ね', katakana: 'ネ', romaji: 'ne', row: 'na', mnemonic: '' },
  { hiragana: 'の', katakana: 'ノ', romaji: 'no', row: 'na', mnemonic: '' },

  // === は行 ===
  { hiragana: 'は', katakana: 'ハ', romaji: 'ha', row: 'ha', mnemonic: '' },
  { hiragana: 'ひ', katakana: 'ヒ', romaji: 'hi', row: 'ha', mnemonic: '' },
  { hiragana: 'ふ', katakana: 'フ', romaji: 'fu', row: 'ha', mnemonic: '' },
  { hiragana: 'へ', katakana: 'ヘ', romaji: 'he', row: 'ha', mnemonic: '' },
  { hiragana: 'ほ', katakana: 'ホ', romaji: 'ho', row: 'ha', mnemonic: '' },

  // === ま行 ===
  { hiragana: 'ま', katakana: 'マ', romaji: 'ma', row: 'ma', mnemonic: '' },
  { hiragana: 'み', katakana: 'ミ', romaji: 'mi', row: 'ma', mnemonic: '' },
  { hiragana: 'む', katakana: 'ム', romaji: 'mu', row: 'ma', mnemonic: '' },
  { hiragana: 'め', katakana: 'メ', romaji: 'me', row: 'ma', mnemonic: '' },
  { hiragana: 'も', katakana: 'モ', romaji: 'mo', row: 'ma', mnemonic: '' },

  // === や行 ===
  { hiragana: 'や', katakana: 'ヤ', romaji: 'ya', row: 'ya', mnemonic: '' },
  { hiragana: 'ゆ', katakana: 'ユ', romaji: 'yu', row: 'ya', mnemonic: '' },
  { hiragana: 'よ', katakana: 'ヨ', romaji: 'yo', row: 'ya', mnemonic: '' },

  // === ら行 ===
  { hiragana: 'ら', katakana: 'ラ', romaji: 'ra', row: 'ra', mnemonic: '' },
  { hiragana: 'り', katakana: 'リ', romaji: 'ri', row: 'ra', mnemonic: '' },
  { hiragana: 'る', katakana: 'ル', romaji: 'ru', row: 'ra', mnemonic: '' },
  { hiragana: 'れ', katakana: 'レ', romaji: 're', row: 'ra', mnemonic: '' },
  { hiragana: 'ろ', katakana: 'ロ', romaji: 'ro', row: 'ra', mnemonic: '' },

  // === わ行 ===
  { hiragana: 'わ', katakana: 'ワ', romaji: 'wa', row: 'wa', mnemonic: '' },
  { hiragana: 'を', katakana: 'ヲ', romaji: 'wo', row: 'wa', mnemonic: '' },

  // === ん ===
  { hiragana: 'ん', katakana: 'ン', romaji: 'n',  row: 'n',  mnemonic: '' },
]

// 行标签映射
export const rowLabels: Record<RowKey, string> = {
  a:  'あ行', ka: 'か行', sa: 'さ行', ta: 'た行',
  na: 'な行', ha: 'は行', ma: 'ま行', ya: 'や行',
  ra: 'ら行', wa: 'わ行', n:  'ん',
}

// 所有行的 key 列表（用于筛选器）
export const rows: RowKey[] = Object.keys(rowLabels) as RowKey[]
