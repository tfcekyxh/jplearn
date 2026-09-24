import { expect, test } from '@playwright/test'
import { expectIdbFieldContains, openPage, resetDatabase } from './helpers'

/** 拼读练习：单词卡内容、会/不会分流、完成页统计与重置。 */

const TOTAL = 28

test.beforeEach(async ({ page }) => {
  await openPage(page, 'read')
  // 清空 wrong_words 等残留，错词断言只反映本用例行为
  await resetDatabase(page)
  await expect(page.getByText('1 / 28', { exact: true })).toBeVisible()
})

test('首张单词卡展示假名、汉字、中文意思与发音按钮', async ({ page }) => {
  const card = page.locator('main')
  await expect(card.getByText('いえ', { exact: true })).toBeVisible()
  await expect(card.getByText('家', { exact: true })).toBeVisible()
  await expect(card.getByText('家、房子')).toBeVisible()
  await expect(page.getByRole('button', { name: '播放 いえ 的发音' })).toBeVisible()
})

test('逐张点「我会了」走完全部，完成页统计与操作按钮正确', async ({ page }) => {
  await page.getByRole('button', { name: '我会了' }).click()
  await expect(page.getByText('2 / 28', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('くるま', { exact: true })).toBeVisible()

  // 再点 27 次走完全部 28 张
  for (let i = 0; i < TOTAL - 1; i++) {
    await page.getByRole('button', { name: '我会了' }).click()
  }

  await expect(page.getByText('本轮完成')).toBeVisible()
  await expect(page.getByText(/我会了：28/)).toBeVisible()
  await expect(page.getByText(/不会：0/)).toBeVisible()
  await expect(page.getByText(`共 ${TOTAL} 个单词`)).toBeVisible()
  await expect(page.getByRole('button', { name: '再来一轮' })).toBeVisible()
  await expect(page.getByRole('button', { name: '返回首页' })).toBeVisible()
})

test('点「不会」进入下一张并写错词库；无汉字的问候词不渲染汉字', async ({ page }) => {
  // 首张点「不会」：进入第二张，いえ 写入 wrong_words
  await page.getByRole('button', { name: '不会' }).click()
  await expect(page.getByText('2 / 28', { exact: true })).toBeVisible()
  await expectIdbFieldContains(page, 'wrong_words', 'kana', 'いえ')

  // 再点 20 次「我会了」到第 22 张：ありがとう（无汉字）
  for (let i = 0; i < 20; i++) {
    await page.getByRole('button', { name: '我会了' }).click()
  }
  await expect(page.getByText('22 / 28', { exact: true })).toBeVisible()
  const card = page.locator('main')
  await expect(card.getByText('ありがとう', { exact: true })).toBeVisible()
  await expect(card.getByText('谢谢')).toBeVisible()
  // WordCard 仅在有汉字时渲染 text-gray-400 的汉字行
  await expect(page.locator('main span.text-gray-400')).toHaveCount(0)

  // 走完剩余 7 张：27 会 + 1 不会
  for (let i = 0; i < 7; i++) {
    await page.getByRole('button', { name: '我会了' }).click()
  }
  await expect(page.getByText('本轮完成')).toBeVisible()
  await expect(page.getByText(/我会了：27/)).toBeVisible()
  await expect(page.getByText(/不会：1/)).toBeVisible()
})

test('完成页「再来一轮」重置进度，再完成后「返回首页」回首页', async ({ page }) => {
  for (let i = 0; i < TOTAL; i++) {
    await page.getByRole('button', { name: '我会了' }).click()
  }
  await expect(page.getByText('本轮完成')).toBeVisible()

  // 再来一轮：进度与计数清零，回到第一张
  await page.getByRole('button', { name: '再来一轮' }).click()
  await expect(page.getByText('本轮完成')).toHaveCount(0)
  await expect(page.getByText('1 / 28', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('いえ', { exact: true })).toBeVisible()

  // 再走一轮后返回首页
  for (let i = 0; i < TOTAL; i++) {
    await page.getByRole('button', { name: '我会了' }).click()
  }
  await page.getByRole('button', { name: '返回首页' }).click()
  await expect(page).toHaveURL(/\/jplearn\/?$/)
  await expect(page.getByRole('heading', { name: '五十音速成' })).toBeVisible()
})
