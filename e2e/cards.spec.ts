import { expect, test } from '@playwright/test'
import {
  expectIdbFieldContains,
  mockMnemonicsApi,
  openPage,
  resetDatabase,
} from './helpers'

/** 卡片学习：翻卡、按行筛选、已学记录、AI 口诀（接口全部 mock）。 */

test.beforeEach(async ({ page }) => {
  await openPage(page, 'cards')
  // 清空 learned/mnemonics 等残留，保证首卡恒为あ、口诀恒为待生成
  await resetDatabase(page)
  await expect(page.getByText('1 / 46', { exact: true })).toBeVisible()
})

test('默认展示首张卡片：平/片假名、罗马音、待生成口诀与发音按钮', async ({ page }) => {
  // 横向筛选 chips：全部 + 11 行，共 12 个
  await expect(page.locator('nav button')).toHaveCount(12)

  const card = page.locator('main')
  await expect(card.getByText('あ', { exact: true })).toBeVisible()
  await expect(card.getByText('ア', { exact: true })).toBeVisible()
  await expect(card.getByText('a', { exact: true })).toBeVisible()
  await expect(card.getByText('口诀待生成')).toBeVisible()
  await expect(page.getByRole('button', { name: '播放 a 的发音' })).toBeVisible()
})

test('上一张/下一张翻卡，首尾互相循环', async ({ page }) => {
  // 第一张点「上一张」循环到最后一张（ん）
  await page.getByRole('button', { name: '上一张' }).click()
  await expect(page.getByText('46 / 46', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('ん', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('ン', { exact: true })).toBeVisible()

  // 最后一张点「下一张」循环回第一张（あ）
  await page.getByRole('button', { name: '下一张' }).click()
  await expect(page.getByText('1 / 46', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('あ', { exact: true })).toBeVisible()

  // 再点一次「下一张」到第二张（い）
  await page.getByRole('button', { name: '下一张' }).click()
  await expect(page.getByText('2 / 46', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('い', { exact: true })).toBeVisible()
})

test('按行筛选后卡片数随行变化并回到该行第一张，切回全部恢复 46 张', async ({ page }) => {
  const cases = [
    { chip: 'あ行', total: 5, hiragana: 'あ', katakana: 'ア' },
    { chip: 'ん', total: 1, hiragana: 'ん', katakana: 'ン' },
    { chip: 'や行', total: 3, hiragana: 'や', katakana: 'ヤ' },
  ] as const

  for (const c of cases) {
    await page.getByRole('button', { name: c.chip, exact: true }).click()
    await expect(page.getByText(`1 / ${c.total}`, { exact: true })).toBeVisible()
    await expect(page.locator('main').getByText(c.hiragana, { exact: true })).toBeVisible()
    await expect(page.locator('main').getByText(c.katakana, { exact: true })).toBeVisible()
  }

  await page.getByRole('button', { name: '全部', exact: true }).click()
  await expect(page.getByText('1 / 46', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('あ', { exact: true })).toBeVisible()
})

test('浏览过的假名写入已学记录（IndexedDB learned store）', async ({ page }) => {
  // 首卡 あ 在挂载时自动标记（StrictMode 双触发为幂等写入，断言存在即可）
  await expectIdbFieldContains(page, 'learned', 'romaji', 'a')

  await page.getByRole('button', { name: '下一张' }).click()
  await expect(page.getByText('2 / 46', { exact: true })).toBeVisible()
  await expectIdbFieldContains(page, 'learned', 'romaji', 'i')
})

test('AI 批量生成口诀：生成中按钮禁用，完成后口诀与重新生成入口出现', async ({ page }) => {
  await mockMnemonicsApi(
    page,
    { a: '像安字草书读a', i: '两根柱子一人高读i' },
    '不应在批量用例中被调用',
    400,
  )

  await page.getByRole('button', { name: 'AI生成口诀' }).click()

  // 生成中：文案变化且按钮禁用
  const generating = page.getByRole('button', { name: 'AI生成中...' })
  await expect(generating).toBeVisible()
  await expect(generating).toBeDisabled()

  // 完成后恢复可点，当前卡片展示 mock 返回的口诀
  await expect(page.getByRole('button', { name: 'AI生成口诀' })).toBeEnabled()
  await expect(page.getByText('像安字草书读a')).toBeVisible()
  await expect(page.getByText('口诀待生成')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '重新生成' })).toBeVisible()

  // 翻到第二张，其口诀同样来自批量结果
  await page.getByRole('button', { name: '下一张' }).click()
  await expect(page.getByText('两根柱子一人高读i')).toBeVisible()
})

test('对当前假名重新生成口诀：纯文本返回后替换旧口诀', async ({ page }) => {
  await mockMnemonicsApi(page, { a: '批量生成的旧口诀' }, '重新生成的全新口诀', 200)

  // 先批量生成，让卡片进入「有口诀」状态
  await page.getByRole('button', { name: 'AI生成口诀' }).click()
  await expect(page.getByText('批量生成的旧口诀')).toBeVisible()

  // 单条重新生成，期间同样展示生成中状态
  await page.getByRole('button', { name: '重新生成' }).click()
  await expect(page.getByRole('button', { name: 'AI生成中...' })).toBeVisible()

  await expect(page.getByText('重新生成的全新口诀')).toBeVisible()
  await expect(page.getByText('批量生成的旧口诀')).toHaveCount(0)
})
