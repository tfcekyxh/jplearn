import { generateText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { kanaData } from '../data/kanaData'

const glm = createOpenAICompatible({
  name: 'glm',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: import.meta.env.VITE_GLM_API_KEY,
})

// 假名→罗马音映射，用于归一化 AI 返回的 key
const kanaToRomaji: Record<string, string> = {}
for (const k of kanaData) {
  kanaToRomaji[k.hiragana] = k.romaji
  kanaToRomaji[k.katakana] = k.romaji
}
kanaToRomaji['a'] = 'a' // 防止 AI 用罗马音做 key

function parseJSON(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  return cleaned
}

const SYSTEM = `你是日语假名速记专家。为每个假名写一条口诀，格式：「像X → 读Y」。
核心规则：先描述假名的形状像什么，再把读音嵌进去。形似优先，谐音辅助。
每条控制在20字以内，让零基础学习者一眼记住。

优秀范例：
- あ(a): 像"安"字草书，读a
- い(i): 两根柱子一人高，读i
- う(u): 像"宇"字下半，宇宙读u
- か(ka): 像"加"字右边，读ka
- し(shi): 一根拐杖弯又弯，读shi
- つ(tsu): 小钩子钩东西，读ci
- の(no): 像英文no写草书，读no
- へ(he): 箭头指方向，读he

反面范例（不要这样写）：
- ✗ "阿婆阿公，发音a溜溜" — 没有描述形状，记不住假名长什么样
- ✗ "吃吃饭" — 纯谐音，不知道假名长什么样`

export async function generateAllMnemonics(): Promise<Record<string, string>> {
  const prompt = `${SYSTEM}

请为以下全部46个假名各写一条口诀。返回纯JSON（key=罗马音，value=口诀）：

あ(a) い(i) う(u) え(e) お(o)
か(ka) き(ki) く(ku) け(ke) こ(ko)
さ(sa) し(shi) す(su) せ(se) そ(so)
た(ta) ち(chi) つ(tsu) て(te) と(to)
な(na) に(ni) ぬ(nu) ね(ne) の(no)
は(ha) ひ(hi) ふ(fu) へ(he) ほ(ho)
ま(ma) み(mi) む(mu) め(me) も(mo)
や(ya) ゆ(yu) よ(yo)
ら(ra) り(ri) る(ru) れ(re) ろ(ro)
わ(wa) を(wo) ん(n)

只返回JSON，不要额外说明。`

  const { text } = await generateText({
    model: glm('glm-4-flash'),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  const jsonStr = parseJSON(text)
  const raw = JSON.parse(jsonStr) as Record<string, string>

  // 归一化 key：AI 可能返回假名或罗马音，统一转为罗马音
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const romaji = kanaToRomaji[key] || key
    result[romaji] = value
  }
  return result
}

export async function regenerateOneMnemonic(
  romaji: string,
  hiragana: string,
  katakana: string,
): Promise<string> {
  const prompt = `${SYSTEM}

请为假名「${hiragana}」（片假名「${katakana}」）写一条速记口诀。
罗马音：${romaji}
要求：先描述「${hiragana}」的形状像什么，再关联读音「${romaji}」。20字以内。
只返回口诀文本，不要额外说明。`

  const { text } = await generateText({
    model: glm('glm-4-flash'),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  return text.trim()
}
