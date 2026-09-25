import { resolve } from 'node:path'

/**
 * 演示动图录制的公共常量。
 *
 * 所有 demo 脚本一律从仓库根执行（package.json scripts 就是这么定义的）。
 */
const ROOT = process.cwd()

export const DEMO_DIR = resolve(ROOT, 'demo')
export const SCRIPTS_DIR = resolve(DEMO_DIR, 'scripts')

/** 中间产物与成品，已 gitignore。 */
export const OUTPUT_DIR = resolve(DEMO_DIR, 'output')
/** 原始 webm */
export const RAW_DIR = resolve(OUTPUT_DIR, 'raw')
/** 转码后的 GIF / MP4 */
export const CLIPS_DIR = resolve(OUTPUT_DIR, 'clips')

/**
 * 录制端口 / base 路径与 e2e 保持一致：
 * 专用 5199 避免把本机其他 Vite 项目误当成本应用，应用挂在 /jplearn/ 下。
 */
export const PORT = Number(process.env.E2E_PORT ?? 5199)
export const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}/jplearn/`

/**
 * 录制视口：iPhone 12/13/14 逻辑分辨率，项目以 375-430px 为设计目标。
 * 必须与 playwright.config.ts 的 viewport、screencast 的 size 三者一致，
 * 否则画面会被缩放、文字发虚。
 */
export const VIEWPORT = { width: 390, height: 844 }

/** 片段清单，顺序即录制 / 转码顺序。 */
export const CLIPS = [
  { id: '01-cards', title: '卡片学习：翻卡 · 行筛选 · AI口诀' },
  { id: '02-quiz', title: '假名测验：自绘键盘答题' },
  { id: '03-reading', title: '拼读练习：单词认读' },
] as const
