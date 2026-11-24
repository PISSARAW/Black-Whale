import assert from 'node:assert/strict'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output =
  process.env.HISOKA_MACHI_VIDEO_OUTPUT ??
  path.resolve(root, '../../output/clash-hisoka-machi-video')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'static'),
  optimizeDeps: {
    entries: [
      'ui-tests/fighting-hisoka-machi-video/index.html',
      'ui-tests/fighting-hisoka-machi-video/audio.html',
    ],
  },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-hisoka-machi-video/`,
  )
  await page.waitForFunction(() => window.hisokaMachiVideo)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 100)
  await page.clock.runFor(300)

  const picture = path.join(output, 'hisoka-vs-machi-corrections-picture.mp4')
  const video = path.join(output, 'hisoka-vs-machi-corrections.mp4')
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
      picture,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  )
  const completed = once(encoder, 'close')
  let encoderError = ''
  encoder.stderr.on('data', (bytes) => {
    encoderError += bytes.toString()
  })
  for (let frame = 0; frame < 720; frame++) {
    await page.evaluate(() => window.hisokaMachiVideo.advance(2))
    await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
    const png = await page.screenshot()
    if ([24, 60, 155, 200, 245, 310, 360, 470, 560, 660, 710].includes(frame))
      await writeFile(path.join(output, `frame-${frame}.png`), png)
    if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain')
    if (frame % 90 === 0) process.stdout.write(`Captured ${frame}/720 frames\n`)
  }
  encoder.stdin.end()
  const [code] = await completed
  assert.equal(code, 0, encoderError)
  const audit = await page.evaluate(() => window.hisokaMachiVideo.diagnostics())
  assert.ok(audit.cardThrows >= 1, 'The video must show an accepted physical card throw')
  assert.ok(audit.hits >= 3, 'The video must include actual combat contacts')
  assert.ok(audit.gumAttached && audit.gumFrames >= 20, 'Bungee Gum must attach on screen')
  assert.ok(audit.gumPulled && audit.gumRebounded, 'The pull and rebound must be attempted')
  assert.ok(audit.textureFrames >= 30, 'Texture Surprise must remain visible on screen')
  assert.ok(audit.dashFrames > 0, 'Hisoka must use finite dash movement')
  assert.deepEqual(errors, [])

  process.stdout.write('Rendering native game audio…\n')
  const audioPage = await browser.newPage()
  audioPage.setDefaultTimeout(120000)
  audioPage.on('pageerror', (error) => errors.push(error.message))
  await audioPage.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-hisoka-machi-video/audio.html`,
  )
  await audioPage.waitForFunction(() => window.hisokaMachiAudio)
  const encodedAudio = await audioPage.evaluate(() => window.hisokaMachiAudio())
  const wav = path.join(output, 'hisoka-vs-machi-game-audio.wav')
  await writeFile(wav, Buffer.from(encodedAudio, 'base64'))
  await audioPage.close()
  const bytes = await readFile(wav)
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
  assert.ok(bytes.length > 100_000, 'The native game soundtrack must not be empty')

  const mux = spawn(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-i',
      picture,
      '-i',
      wav,
      '-c:v',
      'copy',
      '-filter:a',
      'volume=6dB',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-shortest',
      '-movflags',
      '+faststart',
      video,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let muxError = ''
  mux.stderr.on('data', (chunk) => {
    muxError += chunk.toString()
  })
  const [muxCode] = await once(mux, 'close')
  assert.equal(muxCode, 0, muxError)
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      { ...audit, video, picture, audio: wav, duration: 24, fps: 30, errors },
      null,
      2,
    ),
  )
  process.stdout.write(`Video ready: ${video}\n`)
} finally {
  encoder?.stdin.destroy()
  if (encoder && encoder.exitCode === null) encoder.kill()
  await browser?.close()
  await server.close()
}
