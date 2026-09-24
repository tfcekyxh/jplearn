import { expect, type Page } from '@playwright/test'
import { kanaData } from '../src/data/kanaData'

/**
 * 纯前端应用的 e2e 公共助手：
 * - 相对 base 路径的页面跳转封装（应用挂在 /jplearn/ 下）
 * - 假名字符 → 罗马音反查表（测验页只能看到大字，需反推答案）
 * - IndexedDB 清库与只读断言工具
 * - GLM 口诀接口 mock（禁止打真实模型）
 */

const BASE_PATH = '/jplearn'

const GLM_API_PATTERN = '**/open.bigmodel.cn/**'

/** 平/片假名字符 → 罗马音，直接复用业务数据源，避免手抄 46 假名 */
export const HIRAGANA_TO_ROMAJI = new Map(kanaData.map((k) => [k.hiragana, k.romaji]))
export const KATAKANA_TO_ROMAJI = new Map(kanaData.map((k) => [k.katakana, k.romaji]))

/** あ行五个罗马音，用于测验题库限定断言 */
export const A_ROW_ROMAJI = new Set(
  kanaData.filter((k) => k.row === 'a').map((k) => k.romaji),
)

export type AppRoute = '' | 'cards' | 'quiz' | 'read'

/**
 * 打开应用内页面。
 *
 * 注意不能用 '/' 开头但不带 base 的路径（如 '/cards'），那会绕开
 * vite base / BrowserRouter basename 导致 404；这里统一拼完整 /jplearn/xxx。
 */
export async function openPage(page: Page, route: AppRoute = '') {
  await page.goto(route ? `${BASE_PATH}/${route}` : `${BASE_PATH}/`)
}

/**
 * 删除整个 jplearn 库，给每个用例一个干净起点。
 *
 * 应用持有长连接（db.ts 每次 openDB 后不主动 close），在已加载的页面上直接
 * deleteDatabase 会一直 blocked。可靠做法：先在同源页面上发起删库请求（入队
 * 后立即返回），再 reload —— 旧页面卸载时连接关闭，浏览器按 IndexedDB 全局
 * 队列先完成删库，新页面随后以空库启动。
 *
 * 调用前必须先 openPage（保证页面已在应用同源下）。
 */
export async function resetDatabase(page: Page) {
  await page.evaluate(() => {
    void indexedDB.deleteDatabase('jplearn')
  })
  await page.reload({ waitUntil: 'load' })
}

/** 读取 IndexedDB（库名 jplearn）中某个 object store 的全部记录。 */
export function getIdbStore<T = unknown>(page: Page, store: string): Promise<T[]> {
  return page.evaluate(
    (storeName) =>
      new Promise<T[]>((resolve, reject) => {
        const request = indexedDB.open('jplearn')
        request.onsuccess = () => {
          const tx = request.result.transaction(storeName, 'readonly')
          const getAll = tx.objectStore(storeName).getAll()
          getAll.onsuccess = () => resolve(getAll.result as T[])
          getAll.onerror = () => reject(getAll.error)
        }
        request.onerror = () => reject(request.error)
      }),
    store,
  )
}

/** 读取某 store 内全部记录的某个字符串字段（常用于「存在性」断言）。 */
export async function getIdbField(
  page: Page,
  store: string,
  field: string,
): Promise<string[]> {
  const rows = await getIdbStore<Record<string, unknown>>(page, store)
  return rows.map((row) => String(row[field]))
}

/** 测验页当前题目：大字字符 + 按平/片假名标注反查出的罗马音。 */
export async function readQuizQuestion(page: Page): Promise<{ char: string; romaji: string }> {
  // main 下第一个 span 即假名大字（其后是「平假名/片假名」标注）
  const char = ((await page.locator('main > span').first().textContent()) ?? '').trim()
  const isHiragana = await page.getByText('平假名', { exact: true }).isVisible()
  const romaji = (isHiragana ? HIRAGANA_TO_ROMAJI : KATAKANA_TO_ROMAJI).get(char)
  if (!romaji) throw new Error(`无法从大字「${char}」反查罗马音`)
  return { char, romaji }
}

/** 在测验页输入答案并点「确认」。 */
export async function answerCurrentQuestion(page: Page, romaji: string) {
  await page.getByPlaceholder('输入罗马音...').fill(romaji)
  await page.getByRole('button', { name: '确认', exact: true }).click()
}

/**
 * mock GLM 口诀接口（非流式 OpenAI 兼容响应）。
 *
 * 按请求体里的用户 prompt 区分两类调用：
 * - 批量生成（prompt 含「全部46」）：返回 JSON 字符串，key 为罗马音
 * - 单条重新生成：返回纯文本口诀
 *
 * @param batch  批量生成返回的口诀子集（缺失的 key 不影响，用例只断言给出的几条）
 * @param single 单条重新生成返回的口诀文本
 * @param delayMs 响应延迟，用于观察「AI生成中...」状态
 */
export async function mockMnemonicsApi(
  page: Page,
  batch: Record<string, string>,
  single: string,
  delayMs = 0,
) {
  await page.route(GLM_API_PATTERN, async (route) => {
    const body = route.request().postDataJSON() as {
      messages?: Array<{ content?: string }>
    }
    const userText = body.messages?.at(-1)?.content ?? ''
    const content = userText.includes('全部46') ? JSON.stringify(batch) : single

    if (delayMs > 0) await page.waitForTimeout(delayMs)

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { role: 'assistant', content } }],
      }),
    })
  })
}

/**
 * 安装「已学列表加载完成」探针，必须在跳转测验页之前调用。
 *
 * 背景：测验页挂载时题库先是全量 46，getLearnedRomaji() 异步返回后才收敛
 * 到已学子集。收敛前全量题库也可能恰好抽到子集内的题，仅凭「当前题在子集
 * 内」无法判断收敛是否完成，存在竞态。
 *
 * 探针拦截 learned store 的只读事务（测验页挂载时拉取已学列表；卡片页只有
 * readwrite 写入，不受影响），事务完成即置 window.__jplearnLearnedLoaded，
 * 作为题库收敛的确定性信号。init script 在每个新文档重置标记。
 */
export async function armLearnedLoadedProbe(page: Page) {
  await page.addInitScript(() => {
    ;(window as unknown as Record<string, unknown>).__jplearnLearnedLoaded = false
    const originalTransaction = IDBDatabase.prototype.transaction
    IDBDatabase.prototype.transaction = function (
      this: IDBDatabase,
      storeNames: string | string[],
      ...rest: unknown[]
    ): IDBTransaction {
      const tx = originalTransaction.call(this, storeNames, ...rest)
      const names = Array.isArray(storeNames) ? storeNames : [storeNames]
      if (names.includes('learned') && tx.mode === 'readonly') {
        tx.addEventListener('complete', () => {
          ;(window as unknown as Record<string, unknown>).__jplearnLearnedLoaded = true
        })
      }
      return tx
    }
  })
}

/** 等待探针确认测验页已拉取完已学列表（题库收敛触发点已过）。 */
export async function waitForLearnedLoaded(page: Page) {
  await page.waitForFunction(
    () => (window as unknown as Record<string, unknown>).__jplearnLearnedLoaded === true,
  )
}

/** 等待某 IndexedDB store 中出现期望字段值（轮询，兼容 StrictMode 双写）。 */
export async function expectIdbFieldContains(
  page: Page,
  store: string,
  field: string,
  expected: string,
) {
  await expect
    .poll(async () => getIdbField(page, store, field), {
      message: `等待 ${store}.${field} 出现 ${expected}`,
    })
    .toContain(expected)
}
