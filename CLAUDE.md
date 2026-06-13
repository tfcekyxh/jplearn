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
```

## 技术栈

- **构建**: Vite + Bun 包管理器
- **框架**: React 19 函数组件 + Hooks
- **语言**: TypeScript (strict 模式, `bundler` 模块解析)
- **样式**: Tailwind CSS v4 (通过 `@tailwindcss/vite` 插件, `@import "tailwindcss"` 方式引入)
- **路由**: React Router v7
- **语音**: Web Speech API (`SpeechSynthesis`)
- **持久化**: IndexedDB (待实现, 将封装于 `src/db/`)

## 目录结构

```
src/
├── main.tsx          # 入口: BrowserRouter 包裹
├── App.tsx           # 路由定义: / /cards /quiz /read
├── index.css         # Tailwind 引入 + 全局样式 (html/body/#root height:100%)
├── pages/            # 页面组件 (每个路由对应一个)
├── components/       # KanaCard (假名卡片)
├── data/             # kanaData.ts (46假名+行标签), wordData.ts (28单词)
├── hooks/            # 自定义 hooks (待填充)
└── db/               # IndexedDB 封装 (待填充)
```

## 架构约定

- **路由**: `/` 首页三个卡片入口 → `/cards` / `/quiz` / `/read`。无需布局组件，每个页面独立。
- **样式**: 移动端优先, 375-430px 为设计目标。按钮/可点击元素最小 44×44px。黑白灰主色调, 淡蓝点缀。
- **全屏布局**: `html/body/#root` 链式 `height: 100%`, 页面用 `h-full flex flex-col` 填满窗口。
- **数据模型**: `Kana { hiragana, katakana, romaji, row, mnemonic }` (mnemonic 先留空, 后续 AI 生成); `Word { kana, kanji, meaning }`。
- **测验范围**: 从 IndexedDB 中「已学过」的假名抽选 (阶段 6 之前先用全量假名)。

## 当前进度

阶段 1-3 已完成。当前进入阶段 4: 假名测验模块。
