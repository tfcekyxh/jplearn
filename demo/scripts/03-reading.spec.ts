import { expect, test } from './fixtures'
import { openPage } from '../../e2e/helpers'
import {
  moveAndClick,
  moveTo,
  pause,
  prepareClip,
  resetAndSeed,
  startClip,
  tapAt,
} from './demo-utils'

/**
 * 片段 3：拼读练习。
 *
 * 28 个单词不能逐个慢演（动图会过长）：前两张完整展示「发音 + 我会了/
 * 不会」分流，从第 3 张起触点停在按钮上快速连点（只保留按压涟漪与卡片
 * 入场动画），直达完成页看统计，最后「再来一轮」收尾。
 */

const TOTAL = 28

test('03-reading：拼读练习（单词认读）', async ({ page, context }) => {
  await prepareClip(context)
  await resetAndSeed(page, {})
  await openPage(page, 'read')
  await expect(page.getByText('1 / 28', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('いえ', { exact: true })).toBeVisible()

  await startClip(page, '03-reading')
  await pause(page, 600)

  // 第 1 张 いえ：听发音 → 我会了
  await moveAndClick(page, page.getByRole('button', { name: '播放 いえ 的发音' }), 800)
  await moveAndClick(page, page.getByRole('button', { name: '我会了' }), 700)
  await expect(page.getByText('2 / 28', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('くるま', { exact: true })).toBeVisible()

  // 第 2 张 くるま：展示卡片 → 不会
  await pause(page, 900)
  await moveAndClick(page, page.getByRole('button', { name: '不会' }), 700)
  await expect(page.getByText('3 / 28', { exact: true })).toBeVisible()

  // 第 3 张完整点一次，之后触点不动、原地快速点完剩余 25 张（4..28 → 完成）
  await pause(page, 600)
  const known = page.getByRole('button', { name: '我会了' })
  const box = await moveTo(page, known, 300)
  await page.mouse.down()
  await pause(page, 55)
  await page.mouse.up()
  await pause(page, 350)
  // 320ms：卡片入场动画 250ms，间隔太短（如 170ms）时每次都切在淡入中途，
  // 12fps 的动图里会变成约 6 次/秒的白闪；放慢到动画播完后再切下一张
  await tapAt(page, box.x + box.width / 2, box.y + box.height / 2, TOTAL - 3, 320)

  // 完成页：27 会 / 1 不会
  await expect(page.getByText('本轮完成')).toBeVisible()
  await expect(page.getByText(/我会了：27/)).toBeVisible()
  await expect(page.getByText(/不会：1/)).toBeVisible()
  await expect(page.getByText(`共 ${TOTAL} 个单词`)).toBeVisible()
  await pause(page, 1300)

  // 再来一轮：进度归零，回到第一张
  await moveAndClick(page, page.getByRole('button', { name: '再来一轮' }), 900)
  await expect(page.getByText('1 / 28', { exact: true })).toBeVisible()
  await expect(page.locator('main').getByText('いえ', { exact: true })).toBeVisible()
  await pause(page, 1000)
})
