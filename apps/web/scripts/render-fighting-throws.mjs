import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.THROW_RENDER_OUTPUT ?? '/tmp/black-whale-throw-films'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false, root, publicDir: 'static',
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-throws/index.html'], holdUntilCrawlEnd: false },
  cacheDir: path.join(output, 'vite-cache'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ headless: true, args: [
  '--no-proxy-server', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
] })
const page = await browser.newPage({ viewport: { width: 960, height: 540 } })
page.setDefaultTimeout(90000)
const errors = [], clips = []
page.on('pageerror', (error) => errors.push(error.message))
function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr || 'ffmpeg failed')
}
try {
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-throws/`)
  await page.waitForSelector('.fight-scene.ready')
  const ids = process.env.THROW_ROSTER_BATCH === 'fourth'
    ? ['shizuku', 'hinrigh', 'mizaistom', 'leorio', 'hanzo']
    : process.env.THROW_ROSTER_BATCH === 'third'
    ? ['franklin', 'machi', 'illumi', 'kalluto', 'bonolenov']
    : process.env.THROW_ROSTER_BATCH === 'second'
    ? ['feitan', 'saiyu', 'theta', 'biscuit', 'phinks']
    : ['kurapika', 'hisoka', 'chrollo', 'benjamin', 'tserriednich']
  const selected = process.env.THROW_RENDER_IDS?.split(',') ?? ids
  for (const id of ids.filter((id) => selected.includes(id))) {
    for (const powered of [false, true]) {
      const name = `${id}-${powered ? 'super' : 'normal'}`
      const frames = path.join(output, name)
      await mkdir(frames, { recursive: true })
      await page.evaluate((options) => window.throwFixture.reset(options), {
        id, powered, prologue: id === 'bonolenov' && powered, trueForm: id === 'biscuit' && powered, opponentId: id === 'hisoka' ? 'kurapika' : 'hisoka',
      })
      await page.waitForTimeout(120)
      const count = powered ? 36 : 24
      for (let index = 0; index < count; index++) {
        await page.evaluate((age) => window.throwFixture.seek(age), index / (count - 1) * 23.99)
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        await page.screenshot({ path: path.join(frames, `${String(index).padStart(4, '0')}.png`) })
      }
      const clip = path.join(output, `${name}.mp4`)
      ffmpeg(['-framerate', '24', '-i', path.join(frames, '%04d.png'), '-vf',
        'tpad=start_mode=clone:start_duration=0.15:stop_mode=clone:stop_duration=0.3',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', clip])
      clips.push(clip)
      console.log(`Rendered ${name}`)
    }
    const normal = path.join(output, `${id}-normal.mp4`), superClip = path.join(output, `${id}-super.mp4`)
    const paired = path.join(output, `${id}-pair.mp4`)
    ffmpeg(['-i', normal, '-i', superClip, '-filter_complex',
      '[0:v]scale=480:270,tpad=stop_mode=clone:stop_duration=0.5[n];[1:v]scale=480:270[s];[n][s]hstack=shortest=1[v]',
      '-map', '[v]', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', paired])
    ffmpeg(['-i', paired, '-filter_complex',
      'fps=12,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
      '-loop', '0', path.join(output, `${id}.gif`)])
  }
  if (errors.length) throw new Error(errors.join('\n'))
  const list = path.join(output, 'clips.txt')
  const exported = ids.flatMap((id) => ['normal', 'super'].map((kind) => path.join(output, `${id}-${kind}.mp4`))).filter(existsSync)
  await writeFile(list, exported.map((clip) => `file '${clip.replaceAll("'", "'\\''")}'`).join('\n'))
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', path.join(output, 'les-dix-projections.mp4')])
  await writeFile(path.join(output, 'render.json'), JSON.stringify({ clips: exported, errors }, null, 2))
  console.log(`Complete: ${output}`)
} finally { await browser.close(); await server.close() }
