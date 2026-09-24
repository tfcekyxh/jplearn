import { expect, test } from '@playwright/test'
import { openPage, resetDatabase } from './helpers'

/** 首页：品牌展示、三个功能入口、离线声明。 */

test.beforeEach(async ({ page }) => {
  await openPage(page)
  // 每个用例从空库开始，避免其他页面用例残留的已学/统计数据干扰
  await resetDatabase(page)
})

test('首页展示标题、三个入口与离线提示', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '五十音速成', level: 1 })).toBeVisible()

  // 三个入口按钮（按钮内同时含标题与描述，用标题做子串匹配）
  await expect(page.getByRole('button', { name: '卡片学习' })).toBeVisible()
  await expect(page.getByRole('button', { name: '假名测验' })).toBeVisible()
  await expect(page.getByRole('button', { name: '拼读练习' })).toBeVisible()

  await expect(page.getByText('离线可用 · 数据不上传')).toBeVisible()
})

test('三个入口分别进入对应页面，左上角返回按钮回首页', async ({ page }) => {
  const entries = [
    { name: '卡片学习', route: 'cards', marker: '下一张' },
    { name: '假名测验', route: 'quiz', marker: '确认' },
    { name: '拼读练习', route: 'read', marker: '我会了' },
  ] as const

  for (const entry of entries) {
    await page.getByRole('button', { name: entry.name }).click()

    await expect(page).toHaveURL(new RegExp(`/jplearn/${entry.route}$`))
    await expect(page.getByRole('button', { name: entry.marker })).toBeVisible()

    await page.getByRole('button', { name: '← 首页' }).click()
    await expect(page).toHaveURL(/\/jplearn\/?$/)
    await expect(page.getByRole('heading', { name: '五十音速成' })).toBeVisible()
  }
})
