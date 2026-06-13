export interface Word {
  id: number
  kana: string
  kanji: string
  meaning: string
}

// 基础单词库：假名、汉字（如有）、中文意思
export const wordData: Word[] = [
  // 名词·日常
  { id: 0,  kana: 'いえ',     kanji: '家',     meaning: '家、房子' },
  { id: 1,  kana: 'くるま',   kanji: '車',     meaning: '车' },
  { id: 2,  kana: 'さかな',   kanji: '魚',     meaning: '鱼' },
  { id: 3,  kana: 'ねこ',     kanji: '猫',     meaning: '猫' },
  { id: 4,  kana: 'いぬ',     kanji: '犬',     meaning: '狗' },
  { id: 5,  kana: 'やま',     kanji: '山',     meaning: '山' },
  { id: 6,  kana: 'みず',     kanji: '水',     meaning: '水' },
  { id: 7,  kana: 'さくら',   kanji: '桜',     meaning: '樱花' },
  { id: 8,  kana: 'はな',     kanji: '花',     meaning: '花' },
  { id: 9,  kana: 'そら',     kanji: '空',     meaning: '天空' },
  { id: 10, kana: 'かわ',     kanji: '川',     meaning: '河流' },
  { id: 11, kana: 'つき',     kanji: '月',     meaning: '月亮、月份' },
  { id: 12, kana: 'ほし',     kanji: '星',     meaning: '星星' },
  { id: 13, kana: 'ひと',     kanji: '人',     meaning: '人' },
  { id: 14, kana: 'こども',   kanji: '子供',   meaning: '孩子' },
  { id: 15, kana: 'がっこう', kanji: '学校',   meaning: '学校' },
  { id: 16, kana: 'えき',     kanji: '駅',     meaning: '车站' },
  { id: 17, kana: 'ほん',     kanji: '本',     meaning: '书' },
  { id: 18, kana: 'てがみ',   kanji: '手紙',   meaning: '信' },
  { id: 19, kana: 'でんわ',   kanji: '電話',   meaning: '电话' },
  { id: 20, kana: 'ともだち', kanji: '友達',   meaning: '朋友' },

  // 问候·常用
  { id: 21, kana: 'ありがとう',   kanji: '', meaning: '谢谢' },
  { id: 22, kana: 'こんにちは',   kanji: '', meaning: '你好' },
  { id: 23, kana: 'おはよう',     kanji: '', meaning: '早安' },
  { id: 24, kana: 'こんばんは',   kanji: '', meaning: '晚安（问候）' },
  { id: 25, kana: 'すみません',   kanji: '', meaning: '对不起、不好意思' },
  { id: 26, kana: 'さようなら',   kanji: '', meaning: '再见' },
  { id: 27, kana: 'はじめまして', kanji: '', meaning: '初次见面' },
]
