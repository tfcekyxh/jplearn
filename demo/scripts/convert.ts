import { existsSync, statSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { CLIPS_DIR, CLIPS, RAW_DIR } from './constants'

/**
 * 把录到的 webm 转成 GIF 与 MP4（竖屏手机录制）。
 *
 * GIF 走 ffmpeg 解码 + 管道喂 gifski：gifski 用跨帧调色板，
 * 对这种大面积静止的 UI 录屏体积小、无 256 色色带，
 * 比 ffmpeg 的 palettegen/paletteuse 明显好。
 * MP4 留给 ffmpeg，用 libx264。
 */

const FPS = 12
/** 竖屏本来就窄，360px 宽足够清晰，也是 GIF 体积的第一杠杆 */
const GIF_WIDTH = 360
/** 单条 GIF 超过这个体积就不适合内嵌到文档里了 */
const GIF_BUDGET_MB = 3

/** 跑一条命令，非 0 退出就带上 stderr 抛错。 */
async function run(cmd: string[]) {
  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' })
  const [code, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stderr).text(),
  ])
  if (code !== 0) {
    throw new Error(`${cmd[0]} 失败（退出码 ${code}）：\n${stderr.trim()}`)
  }
}

/** 转码前检查本机依赖（录制只依赖 Playwright 自带 ffmpeg，转码还要这俩）。 */
function assertTools() {
  for (const bin of ['ffmpeg', 'gifski']) {
    const proc = Bun.spawnSync(['which', bin])
    if (proc.exitCode !== 0) {
      throw new Error(`找不到 ${bin}，请先安装：brew install ffmpeg gifski`)
    }
  }
}

/** ffmpeg 解码并缩放，产物经管道交给 gifski 编码。 */
async function toGif(webm: string, out: string) {
  const ff = Bun.spawn(
    [
      'ffmpeg', '-v', 'error', '-i', webm,
      '-vf', `fps=${FPS},scale=${GIF_WIDTH}:-2:flags=lanczos`,
      '-f', 'yuv4mpegpipe', '-',
    ],
    { stdout: 'pipe', stderr: 'pipe' },
  )
  const gif = Bun.spawn(
    [
      'gifski',
      '--fps', String(FPS),
      '--width', String(GIF_WIDTH),
      '--quality', '85',
      '--motion-quality', '70',
      '--lossy-quality', '70',
      '-o', out,
      '-',
    ],
    { stdin: ff.stdout, stdout: 'pipe', stderr: 'pipe' },
  )

  const [ffCode, gifCode, ffErr, gifErr] = await Promise.all([
    ff.exited,
    gif.exited,
    new Response(ff.stderr).text(),
    new Response(gif.stderr).text(),
  ])
  if (ffCode !== 0) throw new Error(`ffmpeg 失败（退出码 ${ffCode}）：\n${ffErr.trim()}`)
  if (gifCode !== 0) throw new Error(`gifski 失败（退出码 ${gifCode}）：\n${gifErr.trim()}`)
}

function sizeMb(path: string) {
  return statSync(path).size / 1024 / 1024
}

async function convertClip(clip: (typeof CLIPS)[number]) {
  const webm = resolve(RAW_DIR, `${clip.id}.webm`)
  if (!existsSync(webm)) {
    throw new Error(
      `缺少 ${webm}\n先录这条：bun run demo -- --grep ${clip.id.slice(0, 2)}`,
    )
  }

  const gif = resolve(CLIPS_DIR, `${clip.id}.gif`)
  const mp4 = resolve(CLIPS_DIR, `${clip.id}.mp4`)

  // MP4：交付用，无音轨、faststart 便于网页嵌入
  await run([
    'ffmpeg', '-y', '-v', 'error', '-i', webm,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart',
    mp4,
  ])

  await toGif(webm, gif)

  const gifMb = sizeMb(gif)
  const over =
    gifMb > GIF_BUDGET_MB ? `  ⚠️ 超过 ${GIF_BUDGET_MB}MB，可下调 GIF_WIDTH` : ''
  console.log(
    `${clip.id.padEnd(14)} ${clip.title.padEnd(30)} gif ${gifMb.toFixed(2)}MB  mp4 ${sizeMb(mp4).toFixed(2)}MB${over}`,
  )
}

async function main() {
  assertTools()
  await mkdir(CLIPS_DIR, { recursive: true })
  for (const clip of CLIPS) {
    await convertClip(clip)
  }
  console.log(`\n产物目录：${CLIPS_DIR}`)
}

await main()
