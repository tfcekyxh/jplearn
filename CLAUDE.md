# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

五十音速成 — 移动端优先的浏览器日语假名学习工具。纯前端 SPA，离线可用，数据存 IndexedDB。

## 常用命令

```bash
bun run dev          # 启动开发服务器 (localhost:5173)
bun run build        # 生产构建
bun run lint         # ESLint
bun run tsc --noEmit # TypeScript 类型检查 (strict)
bun run test:e2e     # 跑 Playwright 端到端测试（自动起 5199 端口的 dev）
bun run test:e2e:ui  # 可视化 UI 模式
```

## 技术栈

- **构建**: Vite + Bun 包管理器
- **框架**: React 19 函数组件 + Hooks
- **语言**: TypeScript (strict 模式, `bundler` 模块解析)
- **样式**: Tailwind CSS v4 (通过 `@tailwindcss/vite` 插件, `@import "tailwindcss"` 方式引入)
- **路由**: React Router v7
- **语音**: 预置 mp3 音频 (Edge TTS 生成, `new Audio()` 播放)
- **持久化**: IndexedDB (5 个 object store, 封装于 `src/db/`)

## 目录结构

```
src/
├── main.tsx          # 入口: BrowserRouter 包裹
├── App.tsx           # 路由定义: / /cards /quiz /read
├── index.css         # Tailwind 引入 + 全局样式 (html/body/#root height:100%)
├── pages/            # 页面组件 (每个路由对应一个)
├── components/       # KanaCard (假名卡片, 含口诀), WordCard (单词卡片)
├── data/             # kanaData.ts (46假名+行标签), wordData.ts (28单词)
├── hooks/            # useAudio (发音), useQuiz (出题判题计分), useMnemonics (口诀生成/加载)
├── db/               # IndexedDB: learned/wrong_kana/wrong_words/quiz_stats/mnemonics
└── lib/              # glm.ts (Vercel AI SDK 封装, GLM-4-Flash 生成口诀)
public/
└── audio/            # 46 假名 + 28 单词 mp3 (Edge TTS 生成, 708KB)
scripts/
└── generate_audio.py # Edge TTS 音频批量生成脚本 (ja-JP-NanamiNeural)
e2e/                   # Playwright 端到端测试（helpers.ts 公共助手 + 各页面 spec）
playwright.config.ts    # Playwright 配置（专用 5199 端口、系统 Chrome、串行）
```

## 架构约定

- **路由**: `/` 首页三个卡片入口 → `/cards` / `/quiz` / `/read`。无需布局组件，每个页面独立。
- **样式**: 移动端优先, 375-430px 为设计目标。按钮/可点击元素最小 44×44px。黑白灰主色调, 淡蓝点缀。
- **全屏布局**: `html/body/#root` 链式 `height: 100%`, 页面用 `h-full flex flex-col` 填满窗口。
- **AI 口诀**: Vercel AI SDK (`@ai-sdk/openai-compatible`) 直连智谱 GLM-4-Flash，批量或单条生成速记口诀，存 IndexedDB `mnemonics` store。
- **发音方案**: `useAudio` hook 播放 `public/audio/` 下预置 mp3，不依赖浏览器 TTS。音频由 `scripts/generate_audio.py` 通过 Edge TTS 生成。
- **测验范围**: 从 IndexedDB 中「已学过」的假名抽选，已学假名非空时自动限定题库。

## E2E 测试

- 框架：Playwright（`@playwright/test`，仓库根 devDependency）。测试在 `e2e/`，配置在 `playwright.config.ts`。
- **测试编写与运行验证交给 `e2e-tester` agent**：功能新增或改动后，由 e2e-tester 子代理完成 spec 编写并跑通，不要自己手跑代替。
- **只写端到端**：真实浏览器 + 真实 IndexedDB，断言聚焦用户可见行为；不写单元/接口级测试。
- **一个用例只讲一件事，避免重复**：同一行为的多种路径用循环合进一个用例，不拆多个。
- **复用系统 Chrome**：配置用 `channel: 'chrome'`，不下载 Playwright 自带 Chromium。
- **专用端口 5199**（`E2E_PORT` 可覆盖）：本机可能同时开着别的 Vite 项目，而任意 SPA 对 `/jplearn/` 这类深路径都回 200，webServer 健康检查区分不了应用，用默认 5173 会把别的项目误当成本应用。`reuseExistingServer: true`，dev 已起则复用。
- **base 路径**：应用挂在 `/jplearn/`（vite base + BrowserRouter basename），baseURL 为 `http://localhost:5199/jplearn/`。页面跳转一律用 `e2e/helpers.ts` 的 `openPage(page, 'cards'|'quiz'|'read'|'')`，不要直接 `goto('/cards')`——会绕开 basename。
- **串行 + 每例清库**：`workers: 1`；每个用例 `beforeEach` 调 `resetDatabase(page)` 清空 IndexedDB `jplearn` 库，避免 learned / quiz_stats 等跨用例污染。应用持有长连接（`openDB` 后不关），不能在已加载页面直接 `deleteDatabase`（会一直阻塞），helper 的做法是先发起删库再 `reload`，靠 IndexedDB 全局队列保证删完再以空库启动。
- **AI 口诀必须 mock**：`cards.spec.ts` 用 `mockMnemonicsApi(page, batch, single)` 拦截 `**/open.bigmodel.cn/**`，按 prompt 含「全部46」区分批量（返回 JSON）与单条重新生成（返回纯文本）。**严禁打真实 GLM 接口**。
- **随机出题与异步收敛**：测验题随机，答案靠 `readQuizQuestion` 按大字 + 平/片假名标注反查罗马音（映射表复用业务数据 `kanaData`，不手抄）。断言「题库限定已学假名」时，题库是挂载后异步收敛的，必须先 `armLearnedLoadedProbe` 再 `waitForLearnedLoaded` 确定性等待收敛完成，不能靠「当前题恰好在子集内」概率轮询。
- **IndexedDB 断言**：用 helpers 的 `getIdbStore` / `expectIdbFieldContains`（只读事务 + `expect.poll`），兼容 StrictMode 双写与异步事务；刷新前先确认数据落库，避免 reload 打断 IndexedDB 事务。
- 关键选择器：按钮文案「上一张」「下一张」「确认」「下一题」「我会了」「不会」「再来一轮」「返回首页」「← 首页」；输入框 placeholder「输入罗马音...」；发音按钮 aria-label「播放 xxx 的发音」；位置计数「1 / 46」「1 / 28」；行筛选 chip 文案「あ行」「全部」等。
- 音频 `new Audio().play()` 在无头环境可能 reject，代码已 catch，e2e 不做音频断言。
- 新增/改动功能时，按 `e2e/home.spec.ts` 的写法补对应 spec（首页导航、卡片、测验、拼读、手机视口各一份）。

## 当前进度

阶段 1-8 全部完成。v1.0 可交付。
