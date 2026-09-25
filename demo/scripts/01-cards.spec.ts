import { expect, test } from './fixtures'
import { mockMnemonicsApi } from '../../e2e/helpers'
import {
  moveAndClick,
  moveTo,
  pause,
  prepareClip,
  resetAndSeed,
  startClip,
} from './demo-utils'

/**
 * 片段 1：卡片学习。
 *
 * 首页入口 → 翻卡（平/片假名 + 罗马音 + 发音）→ 按行筛选 →
 * AI 批量生成口诀（接口 mock，延迟放大「生成中」中间态）→ 单条重新生成。
 * 先把首页打开、数据播种完再开录，视频第一帧就是首页而不是白屏。
 */

// mock 返回的あ行口诀（批量）与单条重新生成文案
const BATCH = {
  a: '「あ」像安字的草书，张嘴读「啊」',
  i: '「い」像两根立柱，一人多高读 i',
  u: '「う」像撅嘴吹气，读「呜」',
  e: '「え」像元字下半身，问好读 e',
  o: '「お」像才子戴帽，礼貌读 o',
}
const SINGLE = 'あ取自「安」的草书部分，发音同中文的「啊」'

test('01-cards：卡片学习（翻卡 · 行筛选 · AI口诀）', async ({ page, context }) => {
  await prepareClip(context)
  // 严禁打真实 GLM：批量 / 单条都 mock，1.3s 延迟让「AI生成中...」看得清
  await mockMnemonicsApi(page, BATCH, SINGLE, 1300)

  // 空库起点：首卡恒为あ、口诀恒为「待生成」
  await resetAndSeed(page, {})
  await expect(page.getByRole('heading', { name: '五十音速成' })).toBeVisible()

  await startClip(page, '01-cards')

  // 首页入口 → 卡片学习
  await moveAndClick(
    page,
    page.getByRole('button').filter({ hasText: '卡片学习' }),
    1000,
  )
  await expect(page.getByText('1 / 46', { exact: true })).toBeVisible()

  // あ 卡听发音，翻到い、う
  await moveAndClick(page, page.getByRole('button', { name: '播放 a 的发音' }), 700)
  await moveAndClick(page, page.getByRole('button', { name: '下一张' }), 700)
  await expect(page.getByText('2 / 46', { exact: true })).toBeVisible()
  await moveAndClick(page, page.getByRole('button', { name: '下一张' }), 700)
  await expect(page.getByText('3 / 46', { exact: true })).toBeVisible()

  // 筛到あ行 → AI 批量生成口诀
  await moveAndClick(page, page.getByRole('button', { name: 'あ行', exact: true }), 800)
  await expect(page.getByText('1 / 5', { exact: true })).toBeVisible()

  await moveAndClick(page, page.getByRole('button', { name: 'AI生成口诀' }), 200)
  await expect(page.getByRole('button', { name: 'AI生成中...' })).toBeVisible()
  await expect(page.getByText(BATCH.a)).toBeVisible()
  await expect(page.getByRole('button', { name: 'AI生成口诀' })).toBeEnabled()
  await pause(page, 900)

  // 单条重新生成 → 翻卡看い 的口诀收尾
  await moveAndClick(page, page.getByRole('button', { name: '重新生成' }), 200)
  await expect(page.getByRole('button', { name: 'AI生成中...' })).toBeVisible()
  await expect(page.getByText(SINGLE)).toBeVisible()
  await pause(page, 800)

  await moveAndClick(page, page.getByRole('button', { name: '下一张' }), 700)
  await expect(page.getByText('2 / 5', { exact: true })).toBeVisible()
  await expect(page.getByText(BATCH.i)).toBeVisible()
  await moveTo(page, page.getByRole('button', { name: '播放 i 的发音' }), 1000)
})
