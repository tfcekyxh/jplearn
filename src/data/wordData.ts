export interface Word {
  kana: string
  kanji: string
  meaning: string
}

// 基础单词库：假名、汉字（如有）、中文意思
export const wordData: Word[] = [
  // 名词·日常
  { kana: 'いえ',     kanji: '家',     meaning: '家、房子' },
  { kana: 'くるま',   kanji: '車',     meaning: '车' },
  { kana: 'さかな',   kanji: '魚',     meaning: '鱼' },
  { kana: 'ねこ',     kanji: '猫',     meaning: '猫' },
  { kana: 'いぬ',     kanji: '犬',     meaning: '狗' },
  { kana: 'やま',     kanji: '山',     meaning: '山' },
  { kana: 'みず',     kanji: '水',     meaning: '水' },
  { kana: 'さくら',   kanji: '桜',     meaning: '樱花' },
  { kana: 'はな',     kanji: '花',     meaning: '花' },
  { kana: 'そら',     kanji: '空',     meaning: '天空' },
  { kana: 'かわ',     kanji: '川',     meaning: '河流' },
  { kana: 'つき',     kanji: '月',     meaning: '月亮、月份' },
  { kana: 'ほし',     kanji: '星',     meaning: '星星' },
  { kana: 'ひと',     kanji: '人',     meaning: '人' },
  { kana: 'こども',   kanji: '子供',   meaning: '孩子' },
  { kana: 'がっこう', kanji: '学校',   meaning: '学校' },
  { kana: 'えき',     kanji: '駅',     meaning: '车站' },
  { kana: 'ほん',     kanji: '本',     meaning: '书' },
  { kana: 'てがみ',   kanji: '手紙',   meaning: '信' },
  { kana: 'でんわ',   kanji: '電話',   meaning: '电话' },
  { kana: 'ともだち', kanji: '友達',   meaning: '朋友' },

  // 问候·常用
  { kana: 'ありがとう',   kanji: '', meaning: '谢谢' },
  { kana: 'こんにちは',   kanji: '', meaning: '你好' },
  { kana: 'おはよう',     kanji: '', meaning: '早安' },
  { kana: 'こんばんは',   kanji: '', meaning: '晚安（问候）' },
  { kana: 'すみません',   kanji: '', meaning: '对不起、不好意思' },
  { kana: 'さようなら',   kanji: '', meaning: '再见' },
  { kana: 'はじめまして', kanji: '', meaning: '初次见面' },
]
