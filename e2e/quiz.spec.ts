import { expect, test } from '@playwright/test'
import {
  A_ROW_ROMAJI,
  answerCurrentQuestion,
  armLearnedLoadedProbe,
  expectIdbFieldContains,
  getIdbStore,
  openPage,
  readQuizQuestion,
  resetDatabase,
  waitForLearnedLoaded,
} from './helpers'

/** 假名测验：作答反馈、计分、错题/统计落库、键盘操作、已学题库限定。 */

test.beforeEach(async ({ page }) => {
  await openPage(page, 'quiz')
  // 清空 learned/quiz_stats/wrong_kana：累计统计与「已学限定题库」都依赖空库起点
  await resetDatabase(page)
  await expect(page.getByPlaceholder('输入罗马音...')).toBeVisible()
})

test('空答案不能确认，输入内容后按钮可用', async ({ page }) => {
  const confirm = page.getByRole('button', { name: '确认', exact: true })
  await expect(confirm).toBeDisabled()

  await page.getByPlaceholder('输入罗马音...').fill('   ')
  await expect(confirm).toBeDisabled()

  await page.getByPlaceholder('输入罗马音...').fill('a')
  await expect(confirm).toBeEnabled()
})

test('答对显示正确反馈与本轮计分，下一题后清空重置', async ({ page }) => {
  const { romaji } = await readQuizQuestion(page)
  await answerCurrentQuestion(page, romaji)

  await expect(page.getByText('✓ 正确', { exact: true })).toBeVisible()
  await expect(page.getByText(/本轮 1\/1/)).toBeVisible()
  await expect(page.getByText('100%', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '🔊 听发音' })).toBeVisible()
  await expect(page.getByRole('button', { name: '下一题' })).toBeVisible()
  await expect(page.getByRole('button', { name: '确认', exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: '下一题' }).click()
  await expect(page.getByText('✓ 正确')).toHaveCount(0)
  await expect(page.getByPlaceholder('输入罗马音...')).toHaveValue('')
  await expect(page.getByRole('button', { name: '确认', exact: true })).toBeDisabled()
})

test('答错显示正确读音，错题与统计写入 IndexedDB', async ({ page }) => {
  const { romaji } = await readQuizQuestion(page)
  await answerCurrentQuestion(page, 'zzz')

  await expect(page.getByText('✗ 错误', { exact: true })).toBeVisible()
  await expect(page.getByText(`正确读音：${romaji}`)).toBeVisible()
  await expect(page.getByText(/本轮 0\/1/)).toBeVisible()
  await expect(page.getByText('0%', { exact: true })).toBeVisible()

  await expectIdbFieldContains(page, 'wrong_kana', 'romaji', romaji)
  await expect
    .poll(async () => {
      const rows = await getIdbStore<{ correct: boolean }>(page, 'quiz_stats')
      return { count: rows.length, firstCorrect: rows[0]?.correct }
    })
    .toEqual({ count: 1, firstCorrect: false })

  await page.getByRole('button', { name: '下一题' }).click()
  await expect(page.getByText('✗ 错误')).toHaveCount(0)
  await expect(page.getByPlaceholder('输入罗马音...')).toHaveValue('')
})

test('Enter 键：无反馈时提交答案，有反馈时进入下一题', async ({ page }) => {
  const input = page.getByPlaceholder('输入罗马音...')
  const { romaji } = await readQuizQuestion(page)

  await input.fill(romaji)
  await input.press('Enter')
  await expect(page.getByText('✓ 正确', { exact: true })).toBeVisible()

  await input.press('Enter')
  await expect(page.getByText('✓ 正确')).toHaveCount(0)
  await expect(input).toHaveValue('')
  // 新题已出：平/片假名标注二者必有其一
  await expect(page.getByText(/^(平假名|片假名)$/)).toHaveCount(1)
})

test('累计统计持久化：刷新页面后累计仍在、本轮重置', async ({ page }) => {
  const { romaji } = await readQuizQuestion(page)
  await answerCurrentQuestion(page, romaji)
  await expect(page.getByText(/本轮 1\/1/)).toBeVisible()

  // 统计写入是异步的，刷新前先确认落库，避免 reload 打断 IndexedDB 事务
  await expect
    .poll(async () => (await getIdbStore(page, 'quiz_stats')).length)
    .toBe(1)

  // 累计统计在挂载时从 quiz_stats 读取，作答当页不实时刷新；重新加载后出现
  await page.reload()
  await expect(page.getByPlaceholder('输入罗马音...')).toBeVisible()
  await expect(page.getByText(/累计 1\/1/)).toBeVisible()
  // 刷新后本轮计分清零（total 为 0 时整行不渲染）
  await expect(page.getByText(/本轮/)).toHaveCount(0)
})

test('已学假名非空时，测验只从已学假名（あ行 5 个）出题', async ({ page }) => {
  // 先装探针再跳卡片页（探针在后续每个新文档生效，卡片页只有 readwrite
  // 事务，不会误触发），用于确定性等待测验页「已学列表加载 → 题库收敛」
  await armLearnedLoadedProbe(page)

  // 先去卡片页选「あ行」，翻完该行 5 张，让它们全部进入 learned store
  await openPage(page, 'cards')
  await page.getByRole('button', { name: 'あ行', exact: true }).click()
  await expect(page.getByText('1 / 5', { exact: true })).toBeVisible()
  for (const romaji of ['i', 'u', 'e', 'o']) {
    await page.getByRole('button', { name: '下一张' }).click()
    await expectIdbFieldContains(page, 'learned', 'romaji', romaji)
  }
  await expectIdbFieldContains(page, 'learned', 'romaji', 'a')

  await openPage(page, 'quiz')

  // 确定性等到 learned 只读加载完成（题库收敛触发点已过）；
  // 之后题目必在あ行，轮询仅为等待 React 把收敛后的新题渲染出来
  await waitForLearnedLoaded(page)
  const readArowQuestion = async () => {
    let question = await readQuizQuestion(page)
    for (let guard = 0; guard < 50 && !A_ROW_ROMAJI.has(question.romaji); guard++) {
      await page.waitForTimeout(50)
      question = await readQuizQuestion(page)
    }
    return question
  }

  // 连续答 6 题，每题大字都必须落在あ行 5 个假名内
  const rounds = 6
  for (let round = 1; round <= rounds; round++) {
    const question = await readArowQuestion()
    expect(A_ROW_ROMAJI.has(question.romaji), `第 ${round} 题「${question.char}」不在あ行`).toBe(true)

    await answerCurrentQuestion(page, question.romaji)
    await expect(page.getByText('✓ 正确', { exact: true })).toBeVisible()

    if (round < rounds) {
      await page.getByRole('button', { name: '下一题' }).click()
    }
  }

  await expect(page.getByText(new RegExp(`本轮 ${rounds}\\/${rounds}`))).toBeVisible()
  await expect(page.getByText('100%', { exact: true })).toBeVisible()
})
