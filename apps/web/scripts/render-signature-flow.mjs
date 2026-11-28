// Pre-rolled vertical renderer: signature flow (default) and Feitan's every-combo film.
// node apps/web/scripts/render-signature-flow.mjs [--demo=feitan-combos] [--stills=0,48]
// Separate from render-fighting-combo-edit.mjs: every shot is pre-rolled uncaptured so the
// scene's own attack clocks are mid-strike at the cut, as they would be in the live game.
// node apps/web/scripts/render-signature-flow.mjs [--inspect] [--stills=0,48] [--only=a,b]
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const inspect = process.argv.includes('--inspect')
const demo = process.argv.find((a) => a.startsWith('--demo='))?.slice(7) ?? 'signature-flow'
/** Vertical films that share this pre-rolled renderer. */
const FILMS = {
  'signature-flow': ['Black-Whale-Clash-Signature-Flow.mp4', 'Signature flow'],
  'feitan-combos': ['Black-Whale-Clash-Feitan-Every-Combo.mp4', 'Feitan, every combo'],
  'nen-edit': ['Black-Whale-Clash-Six-Types-Of-Nen.mp4', 'Six types of Nen', 'nen-edit-music.py'],
  'viral-edit': [
    'Black-Whale-Clash-Who-Hits-Hardest.mp4',
    'Who hits hardest',
    'viral-edit-music.py',
  ],
}
assert.ok(FILMS[demo], `Unknown film ${demo}`)
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7)
const stills = process.argv.find((a) => a.startsWith('--stills='))?.slice(9)
const output = process.env.COMBO_EDIT_OUTPUT ?? path.join(root, `output/fighting-${demo}`)
const silent = path.join(output, 'video.mp4')
await mkdir(path.join(output, 'stills'), { recursive: true })

const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: [`demos/fighting-${demo}/index.html`] },
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const run = async (cmd, args) => {
  const p = spawn(cmd, args, { stdio: 'inherit' })
  const [code] = await once(p, 'exit')
  assert.equal(code, 0, `${cmd} failed`)
}
let browser, encoder
const errors = []
try {
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu'],
  })
  const page = await browser.newPage({
    viewport: { width: 720, height: 1280 },
    deviceScaleFactor: 1.5,
  })
  page.setDefaultTimeout(600000)
  page.on('pageerror', (e) => {
    errors.push(e.message)
    process.stderr.write(`${e.message}\n`)
  })
  page.on('console', (m) => {
    if (m.type() === 'error') process.stderr.write(`Browser: ${m.text().slice(0, 400)}\n`)
  })
  await page.clock.install()
  const query = '?' + ['export', only ? `only=${only}` : ''].filter(Boolean).join('&')
  const port = server.httpServer.address().port
  await page.goto(`http://127.0.0.1:${port}/demos/fighting-${demo}/${query}`)
  await page.waitForFunction(() => window.comboEdit, { timeout: 600000 })
  await page.clock.pauseAt(Date.now() + 1000)
  await page.evaluate(() => {
    let sequence = 0
    const queued = new Map()
    window.requestAnimationFrame = (callback) => {
      queued.set(++sequence, callback)
      return sequence
    }
    window.cancelAnimationFrame = (id) => queued.delete(id)
    window.renderFrame = () => {
      const callbacks = [...queued.values()]
      queued.clear()
      for (const callback of callbacks) callback(performance.now())
    }
  })
  const report = await page.evaluate(() => window.comboEdit.report())
  await writeFile(path.join(output, 'edit-report.json'), JSON.stringify(report, null, 2))
  process.stdout.write(
    `${report.clips.length} clips, ${report.duration.toFixed(1)} s, failures: ${report.failures.length}\n`,
  )
  for (const c of report.clips)
    process.stdout.write(
      c.ending
        ? `  ${c.id.padEnd(14)} ${c.ending.padEnd(7)} ${(c.signature ? '*' : ' ') + c.finish.slice(0, 30).padEnd(31)} ko=${c.koFrames} ryu=${c.ryuFrames} ${c.hits} hits ${c.damage} dmg\n`
        : `  ${c.id.padEnd(14)} ${c.stage.padEnd(24)} ${c.frames}f hits=${c.impacts} [${c.observed.join(' ')}] {${c.events.join(' ')}}${c.error ? ' ERROR ' + c.error : ''}\n`,
    )
  if (report.lit)
    process.stdout.write(`lit: ${report.lit.join(' ')}\nmissing: ${report.missing.join(' ')}\n`)
  for (const f of report.failures) process.stdout.write(`  FAIL ${f}\n`)

  // The scene's transitions and stride clocks must see the simulated time, not a fixed 33 ms.
  let carry = 0
  const clockFor = (frame) => {
    const exact = (report.clock?.[frame] ?? 1000 / report.fps) + carry
    const ms = Math.max(1, Math.round(exact))
    carry = exact - ms
    return ms
  }
  const advance = async (ms) => {
    await page.clock.runFor(ms)
    await page.evaluate(() => window.renderFrame())
  }
  const session = await page.context().newCDPSession(page)
  const capture = async () =>
    Buffer.from(
      (
        await session.send('Page.captureScreenshot', {
          format: 'jpeg',
          quality: 92,
          fromSurface: true,
          optimizeForSpeed: true,
        })
      ).data,
      'base64',
    )
  const cuts = new Set(report.cuts)
  /**
   * The scene derives pose transitions and strides frame by frame, so every simulation frame
   * between two captures is rendered once (uncaptured) at its own 1/60 s, like the live game.
   */
  let fed = -1
  const feed = async (frame) => {
    const sim = report.sims?.[frame]
    let total = clockFor(frame)
    if (sim == null) {
      fed = -1
      return advance(total)
    }
    for (let s = fed + 1; s < Math.floor(sim) && total > 17; s++) {
      await page.evaluate(([i, k]) => window.comboEdit.seekSim(i, k), [frame, s])
      await advance(17)
      total -= 17
    }
    fed = Math.floor(sim)
    await page.evaluate((i) => window.comboEdit.seek(i), frame)
    await advance(Math.max(1, Math.round(total)))
  }
  const waitReady = async () => {
    // A split-screen shot has two scenes: wait until every one of them is ready.
    const counts = async () => [
      await page.locator('.fight-scene.ready').count(),
      await page.locator('.fight-scene').count(),
    ]
    for (let i = 0; i < 300; i++) {
      const [ready, total] = await counts()
      if (total > 0 && ready === total) break
      await new Promise((r) => setTimeout(r, 100))
      await advance(16)
    }
    const [ready, total] = await counts()
    assert.ok(total > 0 && ready === total, 'scene failed to load')
    await advance(300)
  }
  /** Load the shot a little earlier and play up to its first frame, without capturing. */
  const enterShot = async (cut) => {
    const first = report.sims[cut]
    const start = report.prerolls[report.cuts.indexOf(cut)]
    await page.evaluate(([i, k]) => window.comboEdit.seekSim(i, k), [cut, start])
    await waitReady()
    for (let s = start + 1; s < first; s++) {
      await page.evaluate(([i, k]) => window.comboEdit.seekSim(i, k), [cut, s])
      await advance(17)
    }
    fed = first - 1
  }
  const wanted = stills ? stills.split(',').map(Number) : null
  if (inspect || wanted) {
    const frames = wanted ?? report.cuts.slice(0, 4).map((c) => c + 30)
    for (const f of frames) {
      const cut = Math.max(...report.cuts.filter((c) => c <= f), -1)
      if (cut >= 0) await enterShot(cut)
      for (let i = Math.max(0, cut); i <= f; i++) {
        await page.evaluate((k) => window.comboEdit.seek(k), i)
        await feed(i)
      }
      await writeFile(path.join(output, 'stills', `frame-${f}.jpg`), await capture())
    }
    process.stdout.write(`Stills in ${path.join(output, 'stills')}\n`)
  } else {
    encoder = spawn(
      'ffmpeg',
      [
        ...['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'mjpeg'],
        ...[
          '-framerate',
          String(report.fps),
          '-i',
          'pipe:0',
          '-vf',
          'scale=1080:1920:flags=lanczos',
        ],
        ...['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', silent],
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] },
    )
    const finished = once(encoder, 'exit')
    const started = Date.now()
    for (let frame = 0; frame < report.frames; frame++) {
      if (cuts.has(frame)) await enterShot(frame)
      await page.evaluate((i) => window.comboEdit.seek(i), frame)
      await feed(frame)
      const bytes = await capture()
      if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain')
      if (frame % 60 === 0) {
        const rate = (Date.now() - started) / 1000 / (frame + 1)
        process.stdout.write(
          `frame ${frame}/${report.frames} (${rate.toFixed(2)} s/frame, ~${Math.round(((report.frames - frame) * rate) / 60)} min left)\n`,
        )
      }
    }
    encoder.stdin.end()
    const [code] = await finished
    assert.equal(code, 0)
    encoder = null
    const wav = path.join(output, 'music.wav')
    await run('python3', [
      path.join(root, 'apps/web/scripts', FILMS[demo][2] ?? 'combo-edit-music.py'),
      path.join(output, 'edit-report.json'),
      wav,
    ])
    const final = path.join(output, FILMS[demo][0])
    await run('ffmpeg', [
      ...['-hide_banner', '-loglevel', 'error', '-y', '-i', silent, '-i', wav],
      ...['-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart'],
      ...['-metadata', `title=Black Whale Clash — ${FILMS[demo][1]}`, final],
    ])
    process.stdout.write(`Final: ${final}\n`)
  }
  assert.deepEqual(errors, [])
} finally {
  encoder?.kill()
  await browser?.close()
  await server.close()
}
