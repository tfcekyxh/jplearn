import { expect, test } from './fixtures'
import { A_ROW_ROMAJI } from '../../e2e/helpers'
import {
  expectTouchMode,
  moveAndClick,
  openQuizWithSeed,
  pause,
  prepareClip,
  readCurrentKana,
  startClip,
  tapKey,
  tapRomaji,
} from './demo-utils'

/**
 * 片段 2：假名测验（移动端自绘罗马音键盘）。
 *
 * 种子：已学あ行 5 个（题库据此收敛到 5 个单字母假名）+ 累计 8/10 统计。
 * 三段故事：答对（绿）→ 故意答错看正确读音（红）+ 听发音 → 再答对收尾。
 * 题库收敛是挂载后的异步过程，openQuizWithSeed 已用探针确定性等待。
 */

/** 收敛后第一轮渲染可能仍是旧题，轮询拿到あ行内的题再开始录。 */
async function waitArowQuestion(page: import('@playwright/test').Page) {
  let q = await readCurrentKana(page)
  for (let guard = 0; guard < 50 && !A_ROW_ROMAJI.has(q.romaji); guard++) {
    await pause(page, 50)
    q = await readCurrentKana(page)
  }
  expect(A_ROW_ROMAJI.has(q.romaji), `首题「${q.char}」不在あ行，题库未收敛`).toBe(true)
  return q
}

test('02-quiz：假名测验（自绘键盘答题）', async ({ page, context }) => {
  await prepareClip(context)

  await openQuizWithSeed(page, {
    learned: ['a', 'i', 'u', 'e', 'o'],
    // 预置 8 对 2 错，让顶部「累计 8/10」一开始就有内容
    quizStats: [
      ...Array.from({ length: 8 }, () => ({ correct: true })),
      ...Array.from({ length: 2 }, () => ({ correct: false })),
    ],
  })
  await expectTouchMode(page)
  const first = await waitArowQuestion(page)

  await startClip(page, '02-quiz')
  await pause(page, 600)

  // 第一题：逐键敲出正确罗马音 → 确认 → 绿色正确反馈
  await tapRomaji(page, first.romaji)
  await moveAndClick(page, page.getByRole('button', { name: '确认 ↵' }), 400)
  await expect(page.getByText('✓ 正确', { exact: true })).toBeVisible()
  await expect(page.getByText(/本轮 1\/1/)).toBeVisible()
  await expect(page.getByText('100%', { exact: true })).toBeVisible()
  await expect(page.getByText(/累计 8\/10/)).toBeVisible()
  await pause(page, 700)

  // 第二题：正确字母后补一个 x 必然拼错 → 红色错误反馈 + 正确读音
  await moveAndClick(page, page.getByRole('button', { name: '下一题 ↵' }), 700)
  const second = await waitArowQuestion(page)
  await tapRomaji(page, second.romaji)
  await tapKey(page, 'x', 250)
  await moveAndClick(page, page.getByRole('button', { name: '确认 ↵' }), 400)
  // 触摸版把「✗ 错误」和「正确读音」渲染在同一个 <p>，不能 exact 匹配
  await expect(page.getByText(/✗ 错误/)).toBeVisible()
  await expect(page.getByText(new RegExp(`正确读音：${second.romaji}`))).toBeVisible()
  await expect(page.getByText(/本轮 1\/2/)).toBeVisible()
  await expect(page.getByText('50%', { exact: true })).toBeVisible()
  await pause(page, 600)

  // 听发音 → 下一题
  await moveAndClick(page, page.getByRole('button', { name: '🔊 听发音' }), 900)
  await moveAndClick(page, page.getByRole('button', { name: '下一题 ↵' }), 700)

  // 第三题答对收尾：2/3，67%
  const third = await waitArowQuestion(page)
  await tapRomaji(page, third.romaji)
  await moveAndClick(page, page.getByRole('button', { name: '确认 ↵' }), 400)
  await expect(page.getByText('✓ 正确', { exact: true })).toBeVisible()
  await expect(page.getByText(/本轮 2\/3/)).toBeVisible()
  await expect(page.getByText('67%', { exact: true })).toBeVisible()
  await pause(page, 1000)
})
