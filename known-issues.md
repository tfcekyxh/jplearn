# 已知问题

> 更新时间：2026-06-13

---

## ~~发音依赖系统语音包~~ ✅ 已解决

**现象**：浏览器 `SpeechSynthesis` API 需要操作系统安装对应语言的语音包才能正确发音。如果系统没有日语 (ja-JP) 语音，发音会静默失败。

**解决方案**：放弃 Web Speech API，改用预置音频文件方案。

- 使用 Edge TTS (`ja-JP-NanamiNeural`) 一次性生成 46 个假名 + 28 个单词的 mp3 音频
- 音频文件存放于 `public/audio/`，共 74 个文件，约 708KB
- 播放改用 `new Audio(url).play()`，完全离线可用，不依赖系统语音包
- 生成脚本：`scripts/generate_audio.py`（可重新运行以更新音频）

**相关文件**：`src/hooks/useAudio.ts`、`public/audio/`、`scripts/generate_audio.py`
