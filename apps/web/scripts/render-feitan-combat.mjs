import assert from 'node:assert/strict'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output =
  process.env.FEITAN_VIDEO_OUTPUT ?? path.resolve(root, '../../output/clash-feitan-video')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'static'),
  optimizeDeps: { entries: ['ui-tests/fighting-feitan-video/index.html'] },
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
let browser, encoder
try {
  browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  })
  page.setDefaultTimeout(90000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.clock.install()
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-feitan-video/`,
  )
  await page.waitForFunction(() => window.feitanVideo)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 100)
  await page.clock.runFor(300)
  const video = path.join(output, 'feitan-combat.mp4')
  encoder = spawn(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-f',
      'image2pipe',
      '-framerate',
      '30',
      '-vcodec',
      'png',
      '-i',
      'pipe:0',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      video,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  )
  const completed = once(encoder, 'close')
  let encoderError = ''
  encoder.stderr.on('data', (bytes) => {
    encoderError += bytes.toString()
  })
  for (let frame = 0; frame < 720; frame++) {
    await page.evaluate(() => window.feitanVideo.advance(2))
    await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
    const png = await page.screenshot()
    if ([30, 90, 210, 245, 260, 270, 330, 510, 660].includes(frame))
      await writeFile(path.join(output, `frame-${frame}.png`), png)
    if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain')
    if (frame % 90 === 0) process.stdout.write(`Captured ${frame}/720 frames\n`)
  }
  encoder.stdin.end()
  const [code] = await completed
  assert.equal(code, 0, encoderError)
  const audit = await page.evaluate(() => window.feitanVideo.diagnostics())
  assert.ok(audit.hits >= 3, 'The video must include actual combat contacts')
  assert.ok(audit.airborneFrames > 0 && audit.dashFrames > 0, 'The video must show real movement')
  assert.ok(
    audit.umbrellaFrames >= 40 && audit.umbrellaCounterShown,
    'The umbrella must open on screen and lead into an actual blade attack',
  )
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ ...audit, video, duration: 24, fps: 30, errors }, null, 2),
  )
  process.stdout.write(`Video ready: ${video}\n`)
} finally {
  encoder?.stdin.destroy()
  if (encoder && encoder.exitCode === null) encoder.kill()
  await browser?.close()
  await server.close()
}
