import { defineConfig } from '@playwright/test'
import { BASE_URL, PORT, VIEWPORT } from './scripts/constants'

/**
 * 演示动图录制的独立配置。
 *
 * 与 e2e 彻底隔离：这里的 testDir 是 demo/scripts，根配置是 ./e2e，
 * 所以 `bun run test:e2e` 永远看不到这些用例。
 *
 * 一个 test = 一个 context = 一条 webm，三个片段天然就是三个独立文件。
 */
export default defineConfig({
  testDir: './scripts',
  // 注意：不能把 outputDir 指到 RAW_DIR——Playwright 每次启动会清空
  // outputDir，分条补录时会把之前录好的 webm 一起删掉。测试失败产物
  // 走默认 test-results/（根 .gitignore 已覆盖），webm 单独存 output/raw。
  globalSetup: './scripts/assert-env.ts',

  // 纯前端应用，串行更稳；重试会留下多份视频，故不重试
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: 'list',

  use: {
    baseURL: BASE_URL,
    // 这两个尺寸必须一致，否则录出来的画面会被缩放、文字发虚
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    // 移动触屏模拟：测验页靠 matchMedia('(pointer: coarse)') 切换自绘键盘，
    // isMobile + hasTouch 缺一不可。UA 也用 iPhone 的，观感与真机一致。
    isMobile: true,
    hasTouch: true,
    // 刻意不配 use.video：录制改由各条 spec 用 page.screencast 显式开关
    // （见 demo-utils 的 startClip），准备步骤与开场白屏不会进视频，
    // 也避开了 use.video 给每个动作加的高亮延迟。
    actionTimeout: 20_000,
    trace: 'off',
  },

  projects: [
    {
      name: 'demo',
      // 复用系统已安装的 Chrome，与 e2e 保持一致。
      // 不能直接展开 devices['iPhone 13']：它带 defaultBrowserType: 'webkit'
      // 会把 project 带到 webkit（channel: 'chrome' 随即报错）；触摸模拟
      // 真正需要的只是 isMobile + hasTouch（测验页据此渲染自绘键盘）。
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  // 本地已启动 dev 时直接复用（与 e2e 共用 5199 端口约定）；否则自动拉起
  webServer: {
    command: `bun run dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
