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
const vertical = process.argv.includes('--tiktok')
const output =
  process.env.HISOKA_MACHI_VIDEO_OUTPUT ??
  path.resolve(
    root,
    vertical ? '../../output/hisoka-machi-tiktok' : '../../output/clash-hisoka-machi-video',
  )
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
    viewport: vertical ? { width: 720, height: 1280 } : { width: 1920, height: 1080 },
    deviceScaleFactor: vertical ? 1.5 : 1,
  })
  page.setDefaultTimeout(90000)
  page.setDefaultNavigationTimeout(180000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('pageerror', (error) => process.stderr.write(error.message + '\n'))
  await page.clock.install()
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-hisoka-machi-video/${vertical ? '?tiktok' : ''}`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.hisokaMachiVideo)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 100)
  await page.clock.runFor(300)

  const suffix = vertical ? 'tiktok' : 'cinematic'
  const picture = path.join(output, `hisoka-vs-machi-${suffix}-picture.mp4`)
  const video = path.join(output, `hisoka-vs-machi-${suffix}.mp4`)
  const edit = vertical ? await page.evaluate(() => window.hisokaMachiVideo.report()) : null
  if (edit) process.stdout.write(JSON.stringify(edit) + '\n')
  const captures = edit ? Math.ceil(edit.frames / 2) : 720
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
      'mjpeg',
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
  for (let frame = 0; frame < captures; frame++) {
    if (edit) await page.evaluate((i) => window.hisokaMachiVideo.seek(i), frame * 2)
    else await page.evaluate(() => window.hisokaMachiVideo.advance(2))
    await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
    const frameBytes = await page.screenshot({ type: 'jpeg', quality: 94 })
    if ([24, 60, 155, 200, 245, 310, 360, 470, 560, 660, 710].includes(frame))
      await writeFile(path.join(output, `cinematic-frame-${frame}.jpg`), frameBytes)
    if (!encoder.stdin.write(frameBytes)) await once(encoder.stdin, 'drain')
    if (frame % 90 === 0) process.stdout.write(`Captured ${frame}/${captures} frames\n`)
  }
  encoder.stdin.end()
  const [code] = await completed
  assert.equal(code, 0, encoderError)
  const audit = edit ?? (await page.evaluate(() => window.hisokaMachiVideo.diagnostics()))
  if (!edit) {
    assert.ok(audit.cardThrows >= 1, 'The video must show an accepted physical card throw')
    assert.ok(audit.hits >= 3, 'The video must include actual combat contacts')
    assert.ok(audit.gumAttached && audit.gumFrames >= 20, 'Bungee Gum must attach on screen')
    assert.ok(audit.gumPulled && audit.gumRebounded, 'The pull and rebound must be attempted')
    assert.ok(audit.textureFrames >= 30, 'Texture Surprise must remain visible on screen')
    assert.ok(audit.dashFrames > 0, 'Hisoka must use finite dash movement')
  }
  assert.deepEqual(errors, [])

  process.stdout.write('Rendering native game audio…\n')
  const audioPage = edit ? page : await browser.newPage()
  if (!edit) {
    audioPage.setDefaultTimeout(120000)
    audioPage.on('pageerror', (error) => errors.push(error.message))
    await audioPage.goto(
      `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-hisoka-machi-video/audio.html`,
    )
    await audioPage.waitForFunction(() => window.hisokaMachiAudio)
  }
  const encodedAudio = await audioPage.evaluate(
    (tiktok) => (tiktok ? window.hisokaMachiVideo.audio() : window.hisokaMachiAudio()),
    vertical,
  )
  const wav = path.join(output, 'hisoka-vs-machi-game-audio.wav')
  await writeFile(wav, Buffer.from(encodedAudio, 'base64'))
  await audioPage.close()
  const bytes = await readFile(wav)
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
  assert.ok(bytes.length > 100_000, 'The native game soundtrack must not be empty')

  const music = path.join(output, 'beat.wav')
  if (edit) {
    const cues = path.join(output, 'edit-report.json')
    await writeFile(cues, JSON.stringify(edit, null, 2))
    const score = spawn('python3', [path.join(root, 'scripts/combo-edit-music.py'), cues, music], {
      stdio: 'inherit',
    })
    assert.equal((await once(score, 'close'))[0], 0)
  }
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
      ...(edit ? ['-i', music] : []),
      '-c:v',
      'copy',
      ...(edit
        ? [
            '-filter_complex',
            '[1:a]volume=10dB[game];[2:a]volume=0.52[beat];[game][beat]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.88[mix]',
            '-map',
            '0:v',
            '-map',
            '[mix]',
          ]
        : ['-filter:a', 'volume=6dB']),
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
      { ...audit, video, picture, audio: wav, duration: captures / 30, fps: 30, errors },
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
