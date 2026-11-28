import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const app = path.join(root, 'apps/web')
const out = process.env.KAKIN_OUTPUT ?? path.join(root, 'output/kakin-princes')
const preview = process.argv.includes('--preview')
const vertical = process.argv.includes('--vertical')
const viewport = vertical ? { width: 810, height: 1440 } : { width: 1440, height: 810 }
const resolution = vertical ? '1080:1920' : '1920:1080'
const filmName = vertical ? 'les-14-princes-de-kakin-vertical' : 'les-14-princes-de-kakin'
const fps = 24
const work = await mkdtemp(path.join(tmpdir(), 'kakin-film-'))
const server = await createServer({
  configFile: false,
  root: app,
  cacheDir: path.join(work, 'vite'),
  resolve: { alias: { $lib: path.join(app, 'src/lib') } },
  server: { fs: { allow: [root] }, host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await mkdir(out, { recursive: true })
await server.listen()

async function openPage(browser) {
  const page = await browser.newPage({ viewport })
  page.on('pageerror', (error) => process.stderr.write(`${error.stack}\n`))
  page.on('console', (message) => {
    if (message.type() === 'error') process.stderr.write(`${message.text()}\n`)
  })
  const address = server.httpServer.address()
  const layout = vertical ? '?vertical' : ''
  await page.goto(`http://127.0.0.1:${address.port}/demos/kakin-princes/index.html${layout}`)
  await page.waitForFunction(() => window.kakinFilm, { timeout: 90_000 })
  return page
}

async function capture(page, index, progress) {
  const jpeg = await page.evaluate(
    ({ index, progress }) => window.kakinFilm.render(index, progress, progress * 4),
    { index, progress },
  )
  return Buffer.from(jpeg, 'base64')
}

function makeEncoder(destination, duration) {
  return spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'image2pipe',
      '-framerate',
      String(fps),
      '-vcodec',
      'mjpeg',
      '-i',
      'pipe:0',
      '-stream_loop',
      '-1',
      '-i',
      path.join(root, 'Musique', 'Quatorze places.mp3'),
      '-map',
      '0:v',
      '-map',
      '1:a',
      '-vf',
      `scale=${resolution}:flags=lanczos,format=yuv420p`,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '18',
      '-threads',
      '5',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-af',
      `volume=0.68,afade=t=in:d=0.8,afade=t=out:st=${duration - 2.2}:d=2.2`,
      '-t',
      String(duration),
      '-movflags',
      '+faststart',
      destination,
    ],
    { stdio: ['pipe', 'ignore', 'inherit'] },
  )
}

async function exportMovie(page, frames) {
  const duration = frames.reduce((total, cut) => total + cut.count, 0) / fps
  const draft = path.join(out, `.${filmName}-rendering.mp4`)
  const encoder = makeEncoder(draft, duration)
  const finished = once(encoder, 'close')
  try {
    for (const { index, count } of frames) {
      for (let frame = 0; frame < count; frame++) {
        const buffer = await capture(page, index, frame / (count - 1))
        if (!encoder.stdin.write(buffer)) await once(encoder.stdin, 'drain')
      }
      process.stdout.write(`Plan Kakin ${index + 1} rendu\n`)
    }
    encoder.stdin.end()
    const [code] = await finished
    assert.equal(code, 0, 'FFmpeg could not encode the movie')
    const final = path.join(out, `${filmName}.mp4`)
    await rename(draft, final)
    process.stdout.write(`${final}\n`)
  } finally {
    if (encoder.exitCode === null) encoder.kill()
    await rm(draft, { force: true })
  }
}

let browser
try {
  browser = await chromium.launch({
    channel: 'chrome',
    args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu'],
  })
  const page = await openPage(browser)
  const frames = await page.evaluate(
    (rate) => window.kakinFilm.lengths.map((n) => Math.round(n * rate)),
    fps,
  )
  const chronological = frames.map((count, offset) => ({ count, index: offset - 1 }))
  const cuts = vertical
    ? [
        { index: 2, count: frames[3] + 44 },
        ...chronological
          .filter(({ index }) => index >= 0 && index !== 2)
          .map((cut) => (cut.index === 9 ? { ...cut, count: cut.count + 16 } : cut)),
      ]
    : chronological
  if (preview) {
    for (const { index } of cuts) {
      const offset = index + 1
      const prefix = String(offset).padStart(2, '0')
      await writeFile(path.join(out, `${prefix}.jpg`), await capture(page, index, 0.39))
      if (offset > 0)
        await writeFile(path.join(out, `${prefix}-close.jpg`), await capture(page, index, 0.78))
    }
    await writeFile(path.join(out, '10-guardian.jpg'), await capture(page, 9, 0.78))
  } else {
    await exportMovie(page, cuts)
  }
} finally {
  await browser?.close()
  await server.close()
  await rm(work, { recursive: true, force: true })
}
