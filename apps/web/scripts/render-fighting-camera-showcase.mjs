import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile, access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const long = process.argv.includes('--long')
const output =
  process.env.CAMERA_VIDEO_OUTPUT ??
  path.join(
    root,
    long ? 'output/fighting-camera-showcase-1080p-long' : 'output/fighting-camera-showcase',
  )
const width = long ? 1920 : 1280
const height = long ? 1080 : 720
const versionQuery = long ? '?version=long' : ''
await mkdir(path.join(output, 'chapters'), { recursive: true })
await mkdir(path.join(output, 'stills'), { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(
    output,
    `vite-cache${process.env.CAMERA_VIDEO_WORKER ? '-' + process.env.CAMERA_VIDEO_WORKER : ''}`,
  ),
  optimizeDeps: {
    entries: [
      'demos/fighting-camera-showcase/index.html',
      'demos/fighting-camera-showcase/audio.html',
    ],
  },
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
let browser, encoder
const errors = []
const exists = async (p) =>
  access(p).then(
    () => true,
    () => false,
  )
const run = async (args) => {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  })
  const [code] = await once(p, 'exit')
  assert.equal(code, 0)
}
try {
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  })
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  })
  const audioPage = await browser.newPage()
  page.setDefaultNavigationTimeout(120000)
  page.setDefaultTimeout(120000)
  audioPage.setDefaultNavigationTimeout(120000)
  audioPage.setDefaultTimeout(120000)
  const captureSession = long ? await page.context().newCDPSession(page) : null
  page.on('pageerror', (e) => {
    errors.push(e.message)
    process.stderr.write(`${e.message}\n`)
  })
  page.on('console', (m) => {
    if (m.type() === 'error') process.stderr.write(`Browser: ${m.text().slice(0, 600)}\n`)
  })
  await page.clock.install()
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-camera-showcase/${versionQuery}`,
  )
  await page.waitForFunction(() => window.cameraShowcase, { timeout: 120000 })
  await page.locator('.fight-scene.ready').waitFor({ timeout: 30000 })
  await page.clock.pauseAt(Date.now() + 1000)
  // Export exactly one production render per output image instead of rendering two hidden RAFs.
  if (long)
    await page.evaluate(() => {
      let sequence = 0
      const queued = new Map()
      window.requestAnimationFrame = (callback) => {
        queued.set(++sequence, callback)
        return sequence
      }
      window.cancelAnimationFrame = (id) => {
        queued.delete(id)
      }
      window.renderFightFrame = () => {
        const callbacks = [...queued.values()]
        queued.clear()
        for (const callback of callbacks) callback(performance.now())
      }
    })
  const advance = async (milliseconds) => {
    await page.clock.runFor(milliseconds)
    if (long) await page.evaluate(() => window.renderFightFrame())
  }
  const report = await page.evaluate(() => window.cameraShowcase.report())
  await writeFile(path.join(output, 'combat-report.json'), JSON.stringify(report, null, 2))
  process.stdout.write(
    JSON.stringify(
      report.chapters.map((c) => ({
        id: c.id,
        duration: c.duration,
        impacts: c.impacts,
        events: c.events,
        commands: c.commands,
      })),
      null,
      2,
    ) + '\n',
  )
  assert.equal(report.chapters.length, 40)
  assert.ok(report.chapters.every((c) => !c.backwards))
  if (process.argv.includes('--audit')) {
    await page.screenshot({ path: path.join(output, 'stills/initial.png') })
  } else {
    const selected = process.env.CAMERA_VIDEO_FIGHTERS?.split(',')
    const captures = []
    for (const [index, c] of report.chapters.entries()) {
      if (selected && !selected.includes(c.id)) continue
      const stem = `${String(index + 1).padStart(2, '0')}-${c.id}`
      const dest = path.join(output, 'chapters', `${stem}.mp4`)
      const manifest = path.join(output, 'chapters', `${stem}.json`)
      const cached = (await exists(manifest)) ? JSON.parse(await readFile(manifest, 'utf8')) : null
      const scenarioKey = JSON.stringify(c)
      const matches = cached?.scenarioKey
        ? cached.scenarioKey === scenarioKey
        : cached?.frames === c.frames && !(long && c.id === 'biscuit')
      if ((await exists(dest)) && matches && !process.argv.includes('--force')) {
        process.stdout.write(`Reuse ${stem}\n`)
        continue
      }
      await page.evaluate((i) => window.cameraShowcase.select(i), index)
      await advance(200)
      // Stage and model assets load in real time, while the simulation remains on frame zero.
      for (
        let attempt = 0;
        attempt < 200 && !(await page.locator('.fight-scene.ready').count());
        attempt++
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        await advance(50)
      }
      assert.equal(await page.locator('.fight-scene.ready').count(), 1, `${c.id}: scene failed`)
      await advance(700)
      const wav = path.join(output, 'chapters', `${stem}.wav`)
      await audioPage.goto(
        `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-camera-showcase/audio.html?id=${c.id}${long ? '&version=long' : ''}`,
      )
      await audioPage.waitForFunction(() => window.cameraFilmAudio)
      const audio = await audioPage.evaluate(() => window.cameraFilmAudio())
      await writeFile(wav, Buffer.from(audio, 'base64'))
      encoder = spawn(
        'ffmpeg',
        [
          '-hide_banner',
          '-loglevel',
          'error',
          '-y',
          '-f',
          'image2pipe',
          '-vcodec',
          'mjpeg',
          '-framerate',
          '30',
          '-i',
          'pipe:0',
          '-i',
          wav,
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-crf',
          '18',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'aac',
          '-b:a',
          '160k',
          '-ar',
          '48000',
          '-movflags',
          '+faststart',
          '-shortest',
          dest,
        ],
        { stdio: ['pipe', 'inherit', 'inherit'] },
      )
      const finished = once(encoder, 'exit')
      const panels = new Set()
      const panelRuns = []
      let still = false
      for (let frame = 0; frame < c.frames; frame++) {
        await page.evaluate((i) => window.cameraShowcase.seek(i), frame)
        await advance(Math.floor(((frame + 1) * 1000) / 30) - Math.floor((frame * 1000) / 30))
        const bytes = captureSession
          ? Buffer.from(
              (
                await captureSession.send('Page.captureScreenshot', {
                  format: 'jpeg',
                  quality: 91,
                  fromSurface: true,
                  optimizeForSpeed: true,
                })
              ).data,
              'base64',
            )
          : await page.screenshot({ type: 'jpeg', quality: 91, animations: 'allow' })
        if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain')
        if (long || frame % 3 === 0) {
          const detail = await page
            .locator('[data-camera-event]')
            .evaluateAll((els) =>
              els.map((e) => ({ id: e.dataset.cameraEvent, source: e.dataset.cameraSource })),
            )
          for (const d of detail) panels.add(d.id)
          if (long) {
            const id = detail[0]?.id ?? null
            const previous = panelRuns.at(-1)
            if (previous?.id === id) previous.frames++
            else panelRuns.push({ id, firstFrame: frame, frames: 1 })
          }
          if (!still && detail.some((d) => d.source === c.id) && frame > 40) {
            await writeFile(path.join(output, 'stills', `${stem}.jpg`), bytes)
            still = true
          }
        }
        if (frame % 90 === 0)
          process.stdout.write(`${stem}: ${(frame / 30).toFixed(1)}/${c.duration.toFixed(1)}s\n`)
      }
      encoder.stdin.end()
      const [code] = await finished
      assert.equal(code, 0)
      encoder = null
      assert.equal(await page.locator('.failed').count(), 0)
      const framing = await page.evaluate(() => window.cameraShowcase.framingReport())
      const capture = {
        scenarioKey,
        id: c.id,
        panels: [...panels],
        frames: c.frames,
        panelRuns,
        framing: {
          outside: framing.actorEnvelopeOutsideViewport.filter((e) => e.chapter === index),
          missing: framing.missingActors?.filter((e) => e.chapter === index) ?? [],
        },
      }
      captures.push(capture)
      await writeFile(
        path.join(output, 'chapters', `${stem}.json`),
        JSON.stringify(capture, null, 2),
      )
      assert.ok(panels.size > 0, `${c.id}: no close-up displayed`)
      assert.deepEqual(capture.framing.outside, [])
      assert.deepEqual(capture.framing.missing, [])
      process.stdout.write(`Saved ${stem} (${panels.size} close-ups)\n`)
    }
    if (!selected) {
      const parts = report.chapters
        .map(
          (c, i) =>
            `file '${path.join(output, 'chapters', `${String(i + 1).padStart(2, '0')}-${c.id}.mp4`)}'`,
        )
        .join('\n')
      await writeFile(path.join(output, 'chapters.txt'), parts)
      const destination = path.join(
        output,
        long
          ? 'Black-Whale-Clash-40-Personnages-1080p-Version-Longue.mp4'
          : 'Black-Whale-Clash-40-Personnages-Gros-Plans.mp4',
      )
      await run([
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        path.join(output, 'chapters.txt'),
        '-c',
        'copy',
        '-movflags',
        '+faststart',
        '-metadata',
        'title=Black Whale Clash — Gros plans des 40 personnages',
        destination,
      ])
      process.stdout.write(`Final: ${destination}\n`)
    }
    const allCaptures = []
    for (const [i, c] of report.chapters.entries()) {
      const p = path.join(output, 'chapters', `${String(i + 1).padStart(2, '0')}-${c.id}.json`)
      if (await exists(p)) allCaptures.push(JSON.parse(await readFile(p, 'utf8')))
    }
    const framing = await page.evaluate(() => window.cameraShowcase.framingReport())
    await writeFile(path.join(output, 'framing-report.json'), JSON.stringify(framing, null, 2))
    assert.deepEqual(framing.actorEnvelopeOutsideViewport, [])
    await writeFile(
      path.join(output, 'capture-report.json'),
      JSON.stringify({ errors, captures: allCaptures }, null, 2),
    )
    assert.deepEqual(errors, [])
  }
} finally {
  encoder?.kill()
  await browser?.close()
  await server.close()
}
