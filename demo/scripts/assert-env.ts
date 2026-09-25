import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

/**
 * 录制前置检查（playwright.config.ts 的 globalSetup）。
 *
 * page.screencast 依赖 Playwright 自带的那份 ffmpeg，没装的话录制会在
 * 第一条片段上直接报错，所以在这里提前拦住并给出安装命令。
 */
export default function assertEnv() {
  const cacheDir = resolve(homedir(), 'Library/Caches/ms-playwright')
  const found =
    existsSync(cacheDir) && readdirSync(cacheDir).some((name) => name.startsWith('ffmpeg-'))
  if (!found) {
    throw new Error(
      '缺少 Playwright 自带的 ffmpeg（录制视频必需），先执行：bunx playwright install ffmpeg',
    )
  }
}
