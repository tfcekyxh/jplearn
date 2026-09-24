import { defineConfig, devices } from '@playwright/test'

// 应用部署在 base 路径 /jplearn/ 下（vite base + BrowserRouter basename），
// baseURL 必须带 base 路径；用例内一律用相对路径或完整 /jplearn/xxx 跳转。
// 本机常同时开多个 Vite 项目（默认都抢 5173），而任意 SPA 对 /jplearn/ 这种
// 深路径都会回 index.html（200），webServer 健康检查无法区分应用——
// 固定专用端口，避免 Playwright 把别的项目的 dev server 当成本应用复用。
const PORT = Number(process.env.E2E_PORT ?? 5199)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}/jplearn/`

export default defineConfig({
  testDir: './e2e',
  // 纯前端应用，用例共享同一 IndexedDB 语义，串行执行更稳
  workers: 1,
  reporter: 'list',

  timeout: 60_000,

  expect: {
    // 自动等待类断言（toBeVisible 等）超时，默认 5s，放宽到 15s
    timeout: 15_000,
  },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // click / fill 等动作的自动等待超时
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      // 复用系统已安装的 Chrome，避免额外下载 Playwright 自带浏览器
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  // 本地已启动 dev 时直接复用；否则用专用端口自动拉起
  webServer: {
    command: `bun run dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
