import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  HIRAGANA_TO_ROMAJI,
  KATAKANA_TO_ROMAJI,
  armLearnedLoadedProbe,
  openPage,
  resetDatabase,
  waitForLearnedLoaded,
} from '../../e2e/helpers'
import { RAW_DIR, VIEWPORT } from './constants'

/**
 * 录制期专用的交互工具（移动端版）。
 *
 * 与 e2e/helpers.ts 的分工：那里是「跑断言」，这里是「让观感可读」——
 * 触摸点要真的滑过去、动作之间要留停顿、中间态要被放大到看得清。
 * mymenu 的 demo 用桌面箭头光标；本应用是移动优先，改成「手指触点」：
 * 一个跟随移动的半透明圆点 + 按下涟漪。
 */

/** 固定停顿，给观众看画面的时间。 */
export function pause(page: Page, ms: number) {
  return page.waitForTimeout(ms)
}

// ---------------------------------------------------------------------------
// 录制开关
// ---------------------------------------------------------------------------

/** page → 片段 id，用来在 stop 时知道该报哪个文件。 */
const recording = new Map<Page, string>()

/**
 * 开始录这条片段。
 *
 * 用 page.screencast 显式开关，而不是配置里的 use.video：后者从 context
 * 建好就开始录，准备步骤与开场白屏都会进视频；而且它给每个动作加的
 * 展示高亮会在录制时引入明显延迟。
 */
export async function startClip(page: Page, clipId: string) {
  await mkdir(RAW_DIR, { recursive: true })
  await page.screencast.start({
    path: resolve(RAW_DIR, `${clipId}.webm`),
    size: VIEWPORT,
  })
  recording.set(page, clipId)
}

/** 停止录制并落盘。没在录的话是空操作，用例中途失败也能靠它保住视频。 */
export async function stopClip(page: Page) {
  const clipId = recording.get(page)
  if (!clipId) return
  recording.delete(page)
  await page.screencast.stop()
  console.log(`[demo] 已录到 ${resolve(RAW_DIR, `${clipId}.webm`)}`)
}

// ---------------------------------------------------------------------------
// 自绘触摸点
// ---------------------------------------------------------------------------

/**
 * 自绘触摸点层。
 *
 * Playwright 录的是页面像素，本来没有系统光标/触点，所以自己画一层：
 * 监听真实 mousemove / mousedown 更新位置、按压缩放与点击涟漪。
 *
 * 整层 pointer-events: none，否则会吃掉点击。函数体里不能引用外部变量
 * （addInitScript 是序列化后注入的），所以只能自包含。
 */
function touchOverlay() {
  const marker = window as unknown as { __demoTouchInstalled?: boolean }
  if (marker.__demoTouchInstalled) return
  marker.__demoTouchInstalled = true

  const host = document.createElement('div')
  host.id = '__demo-touch-layer'
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;pointer-events:none;overflow:hidden;contain:strict'

  // 触点：44px 圆（贴合移动端 44pt 最小点击目标的视觉印象），圆心即点击点
  const dot = document.createElement('div')
  dot.style.cssText =
    'position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;' +
    'border-radius:50%;opacity:0;pointer-events:none;will-change:transform;' +
    'background:rgba(59,130,246,.28);border:2px solid rgba(59,130,246,.85);' +
    'box-sizing:border-box;transition:transform 300ms linear,opacity 150ms linear'

  const ring = document.createElement('div')
  ring.style.cssText =
    'position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;' +
    'border:3px solid rgba(59,130,245,.8);border-radius:50%;opacity:0;pointer-events:none'

  const style = document.createElement('style')
  style.textContent =
    '@keyframes demo-ripple{from{width:44px;height:44px;margin:-22px 0 0 -22px;opacity:.85}' +
    'to{width:88px;height:88px;margin:-44px 0 0 -44px;opacity:0}}'

  host.append(style, ring, dot)
  // addInitScript 在 document-start 就跑了，那时 document.body 还不存在，
  // 直接挂会静默失败（整层触点就没了），必须等 DOM 建好
  const attach = () => document.body?.appendChild(host)
  if (document.body) attach()
  else document.addEventListener('DOMContentLoaded', attach, { once: true })

  const place = (x: number, y: number, scale: number) => {
    dot.style.opacity = '1'
    dot.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`
    ring.style.left = `${x}px`
    ring.style.top = `${y}px`
  }

  window.addEventListener(
    'mousemove',
    (e) => place(e.clientX, e.clientY, 1),
    { capture: true, passive: true },
  )

  window.addEventListener(
    'mousedown',
    (e) => {
      place(e.clientX, e.clientY, 0.82)
      // 重启动画：先置 none 再强制读一次 offsetWidth
      ring.style.animation = 'none'
      void ring.offsetWidth
      ring.style.animation = 'demo-ripple 420ms ease-out'
    },
    { capture: true, passive: true },
  )

  window.addEventListener(
    'mouseup',
    (e) => place(e.clientX, e.clientY, 1),
    { capture: true, passive: true },
  )
}

/** 每条片段的起手式：装上自绘触点层。 */
export async function prepareClip(context: BrowserContext) {
  await context.addInitScript(touchOverlay)
}

// ---------------------------------------------------------------------------
// 鼠标 / 触摸操作
// ---------------------------------------------------------------------------

/** 把触点滑到元素中心并停顿，让观众看清要操作哪里。返回元素位置。 */
export async function moveTo(page: Page, target: Locator, settleMs = 260) {
  const box = await target.boundingBox()
  if (!box) throw new Error('目标不可见，拿不到 boundingBox')

  // 步数刻意压得少：每步都是一次 CDP 往返，而位移有 CSS 过渡补间，
  // 6 步看起来一样顺
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 })
  await pause(page, settleMs)
  return box
}

/**
 * 滑过去 → 停顿 → 按下抬起。
 *
 * 演示里所有点击都必须走这里：直接 locator.click() 只派发一次跳跃式的
 * mousemove，自绘触点会瞬移而不是滑过去。
 */
export async function moveAndClick(page: Page, target: Locator, afterMs = 500) {
  await moveTo(page, target)
  await page.mouse.down()
  await pause(page, 60)
  await page.mouse.up()
  await pause(page, afterMs)
}

/**
 * 在固定坐标上重复「按下抬起」，触点不做滑动。
 *
 * 拼读页快速过完剩余单词时用：按钮位置固定，只需涟漪 + :active 按压态
 * 反复出现，26 次滑动反而看得人晕。
 */
export async function tapAt(
  page: Page,
  x: number,
  y: number,
  times: number,
  intervalMs = 170,
) {
  // 自包含定位：调用方不必保证触点已在目标坐标
  await page.mouse.move(x, y)
  for (let i = 0; i < times; i++) {
    await page.mouse.down()
    await pause(page, 55)
    await page.mouse.up()
    await pause(page, intervalMs)
  }
}

// ---------------------------------------------------------------------------
// 测验页：自绘罗马音键盘
// ---------------------------------------------------------------------------

/** 点自绘键盘上的一个字母键（QWERTY 布局，按钮可访问名就是字母本身）。 */
export async function tapKey(page: Page, letter: string, afterMs = 140) {
  const key = page.getByRole('button', { name: letter, exact: true })
  await moveTo(page, key, 120)
  await page.mouse.down()
  await pause(page, 55)
  await page.mouse.up()
  await pause(page, afterMs)
}

/** 在自绘键盘上逐键敲出罗马音。 */
export async function tapRomaji(page: Page, romaji: string) {
  for (const ch of romaji) {
    await tapKey(page, ch)
  }
}

/**
 * 读测验页当前题目：大字字符 + 按平/片假名标注反查罗马音。
 *
 * e2e/helpers 的 readQuizQuestion 用 `main > span`，录制脚本里改用
 * text-9xl 这个大字专属类，选择意图更明确。
 */
export async function readCurrentKana(page: Page): Promise<{ char: string; romaji: string }> {
  const char = ((await page.locator('span.text-9xl').textContent()) ?? '').trim()
  const isHiragana = await page.getByText('平假名', { exact: true }).isVisible()
  const romaji = (isHiragana ? HIRAGANA_TO_ROMAJI : KATAKANA_TO_ROMAJI).get(char)
  if (!romaji) throw new Error(`无法从大字「${char}」反查罗马音`)
  return { char, romaji }
}

// ---------------------------------------------------------------------------
// IndexedDB 演示数据
// ---------------------------------------------------------------------------

export interface DemoSeed {
  /** learned store：romaji 列表（测验题库据此收敛） */
  learned?: string[]
  /** quiz_stats store：逐次答题对错（完成页之外的「累计 x/y」来源） */
  quizStats?: Array<{ correct: boolean }>
  /** mnemonics store：预置口诀 romaji → 文本 */
  mnemonics?: Record<string, string>
}

/**
 * 给每条片段一个干净且确定的 IndexedDB 起点。
 *
 * 纯前端应用没有后端账号，mymenu 那套 globalSetup + storageState 不适用：
 * Playwright 每个 context 都是临时 profile，IndexedDB 不跨片段共享，
 * 所以种子数据在浏览器内逐片段播种。流程：先让应用把库升级建好，再删
 * 库 reload 得到空库（复用 e2e 的 resetDatabase），最后另开连接写入。
 */
export async function resetAndSeed(page: Page, seed: DemoSeed = {}): Promise<void> {
  await openPage(page, '')
  await resetDatabase(page)

  await page.evaluate((data) => {
    return new Promise<void>((resolve, reject) => {
      // 首页从不打开数据库，reset 后的空库场景下不能假设 store 已存在：
      // 自己以 v2 打开并在 onupgradeneeded 建全 5 个 store（与 db.ts 一致）。
      // 注意 transaction() 的 NotFoundError 是在 onsuccess 回调里同步抛的，
      // 不在 Promise executor 调用栈内——必须 try/catch，否则 Promise 永挂。
      const request = indexedDB.open('jplearn', 2)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('learned')) {
          db.createObjectStore('learned', { keyPath: 'romaji' })
        }
        if (!db.objectStoreNames.contains('wrong_kana')) {
          db.createObjectStore('wrong_kana', { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('wrong_words')) {
          db.createObjectStore('wrong_words', { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('quiz_stats')) {
          db.createObjectStore('quiz_stats', { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('mnemonics')) {
          db.createObjectStore('mnemonics', { keyPath: 'romaji' })
        }
      }
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error('jplearn 库打开被阻塞，请关闭其他持有连接的标签页'))
      request.onsuccess = () => {
        try {
          const db = request.result
          const storeNames: string[] = []
          if (data.learned?.length) storeNames.push('learned')
          if (data.quizStats?.length) storeNames.push('quiz_stats')
          if (data.mnemonics && Object.keys(data.mnemonics).length) {
            storeNames.push('mnemonics')
          }

          if (storeNames.length === 0) {
            db.close()
            resolve()
            return
          }

          const tx = db.transaction(storeNames, 'readwrite')
          const now = Date.now()
          if (data.learned) {
            const store = tx.objectStore('learned')
            for (const romaji of data.learned) store.put({ romaji, learnedAt: now })
          }
          if (data.quizStats) {
            const store = tx.objectStore('quiz_stats')
            for (const row of data.quizStats) {
              store.add({ correct: row.correct, timestamp: now })
            }
          }
          if (data.mnemonics) {
            const store = tx.objectStore('mnemonics')
            for (const [romaji, mnemonic] of Object.entries(data.mnemonics)) {
              store.put({ romaji, mnemonic })
            }
          }
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        } catch (err) {
          reject(err)
        }
      }
    })
  }, seed)
}

/**
 * 进入测验页并确定性等待「已学列表加载 → 题库收敛」完成。
 *
 * 探针必须在跳转测验页之前安装（对后续每个文档生效），复用 e2e 的同款
 * 探针；这里把「播种 → 装探针 → 跳转 → 等收敛」收成一步。
 */
export async function openQuizWithSeed(page: Page, seed: DemoSeed) {
  await armLearnedLoadedProbe(page)
  await resetAndSeed(page, seed)
  await openPage(page, 'quiz')
  await waitForLearnedLoaded(page)
}

/** 断言当前 context 确实是触摸模式（自绘键盘出现的前提）。 */
export async function expectTouchMode(page: Page) {
  const coarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)
  expect(coarse, '当前 context 不是触摸模式，测验页不会渲染自绘键盘').toBe(true)
  await expect(page.getByRole('button', { name: /确认/ })).toBeVisible()
}
