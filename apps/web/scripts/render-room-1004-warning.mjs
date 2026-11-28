import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { promisify } from 'node:util'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const run = promisify(execFile)
const web = fileURLToPath(new URL('..', import.meta.url))
const root = path.resolve(web, '../..')
const output = path.join(root, 'output/room-1004')
const pagePath = 'demos/fighting-laplace-reveal/warning.html'
const inspect = process.argv.includes('--inspect')
const split = process.argv.includes('--split')
const fps = 24
const work = await mkdtemp(path.join(tmpdir(), 'room-1004-warning-'))
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: web,
  publicDir: 'static',
  cacheDir: path.join(work, 'vite'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(web, 'src/lib') } },
  optimizeDeps: { entries: [pagePath], holdUntilCrawlEnd: false },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-unsafe-swiftshader', '--disable-gpu-shader-disk-cache'],
})
async function seek(page, seconds) {
  await page.evaluate((value) => window.warningFilm.seek(value), seconds)
  await page.clock.runFor(Math.round(1000 / fps))
}

async function capture(page, info, picture) {
  const cdp = await page.context().newCDPSession(page)
  await page.clock.install()
  await page.clock.pauseAt(new Date(Date.now() + 800))
  if (inspect) {
    const samples = split ? [1, 2.8, 3.1, 5.5, 9] : [1, 7, 10, 14, 16, 23, 30, 33]
    for (const seconds of samples) {
      await seek(page, seconds)
      const sample = `warning-check-${path.basename(picture, '.mp4')}-${seconds}.jpg`
      await page.screenshot({ path: path.join(output, sample), type: 'jpeg' })
    }
    return
  }
  const encoder = spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-v',
      'error',
      '-y',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      '-framerate',
      String(fps),
      '-i',
      'pipe:0',
      '-an',
      '-c:v',
      'libx264',
      '-threads',
      '3',
      '-preset',
      'veryfast',
      '-crf',
      '17',
      '-pix_fmt',
      'yuv420p',
      picture,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  )
  const done = once(encoder, 'exit')
  encoder.stdin.on('error', () => {})
  try {
    for (let frame = 0; frame < info.duration * fps; frame++) {
      await seek(page, frame / fps)
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 94,
        fromSurface: true,
      })
      if (!encoder.stdin.write(Buffer.from(data, 'base64'))) await once(encoder.stdin, 'drain')
      if (frame % (fps * 5) === 0)
        process.stdout.write(`Captured ${frame / fps}s / ${info.duration}s\n`)
    }
  } finally {
    encoder.stdin.end()
  }
  assert.equal((await done)[0], 0, 'Picture encode failed')
}

async function finish(page, info, picture) {
  const audio = path.join(work, 'native-audio.wav')
  const concert = path.join(root, 'output/melody-clash-tiktok/melody-clash-tiktok-9x16.mp4')
  const destination = path.join(output, 'room-1004-day-02-warning-tiktok-en.mp4')
  const { start, duration } = info.melodyCut
  await writeFile(
    audio,
    Buffer.from(await page.evaluate(() => window.warningFilm.audio()), 'base64'),
  )
  await run('ffmpeg', [
    '-hide_banner',
    '-v',
    'error',
    '-y',
    '-filter_complex_threads',
    '2',
    '-i',
    picture,
    '-i',
    audio,
    '-ss',
    '27',
    '-t',
    String(duration),
    '-i',
    concert,
    '-filter_complex',
    `[2:v]setpts=PTS-STARTPTS+${start}/TB[melody];[0:v][melody]overlay=enable='gte(t,${start})*lt(t,${start + duration})',fade=t=out:st=${info.duration - 0.6}:d=0.6[v];[1:a]volume=0.82[room];[2:a]volume=0.8,afade=t=in:d=0.12,afade=t=out:st=${duration - 0.28}:d=0.28,adelay=${start * 1000}:all=1[flute];[room][flute]amix=inputs=2:normalize=0,alimiter=limit=0.9[a]`,
    '-map',
    '[v]',
    '-map',
    '[a]',
    '-t',
    String(info.duration),
    '-c:v',
    'libx264',
    '-threads',
    '3',
    '-preset',
    'veryfast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '256k',
    '-movflags',
    '+faststart',
    destination,
  ])
  process.stdout.write(`${destination}\n`)
}

async function openPage(view) {
  const page = await browser.newPage({ viewport: { width: 1080, height: view ? 960 : 1920 } })
  page.on('pageerror', (error) => process.stderr.write(`${error.stack}\n`))
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const url = new URL(pagePath, origin)
  if (view) url.searchParams.set('split', view)
  await page.goto(url.href, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.warningFilm?.ready(), undefined, { timeout: 90_000 })
  const info = await page.evaluate(() => window.warningFilm.info())
  if (inspect) process.stdout.write(`${JSON.stringify(info, null, 2)}\n`)
  assert.equal(info.failed, false, 'Room 1004 renderer could not mount')
  assert.ok(info.killed > 0 && info.reveal > info.killed, 'Missing perceived hit and reveal')
  assert.equal(info.realHealth, info.setupHealth, 'The prince must survive without damage')
  assert.equal(info.realWins, 0, 'The projected outcome cannot award a real round')
  return { page, info }
}

async function captureSplit(view, audio) {
  const { page, info } = await openPage(view)
  const picture = path.join(work, `${view}.mp4`)
  try {
    await capture(page, info, picture)
    if (audio && !inspect) {
      const wav = await page.evaluate(() => window.warningFilm.audio())
      await writeFile(audio, Buffer.from(wav, 'base64'))
    }
    return picture
  } finally {
    await page.close()
  }
}

async function finishSplit() {
  const audio = path.join(work, 'split-audio.wav')
  const top = await captureSplit('theta', audio)
  const bottom = await captureSplit('prince')
  if (inspect) return
  const original = path.join(output, 'room-1004-day-02-warning-tiktok-en.mp4')
  const destination = path.join(output, 'room-1004-day-02-warning-split-tiktok-en.mp4')
  const filters = [
    '[0:v]trim=end=9,setpts=PTS-STARTPTS[intro]',
    '[1:v][2:v]vstack=inputs=2:shortest=1,setsar=1,drawbox=y=957:w=iw:h=6:color=0x17120e:t=fill[split]',
    '[0:v]trim=start=17:end=20,setpts=PTS-STARTPTS[melody]',
    '[0:v]trim=start=28:end=34,setpts=PTS-STARTPTS[ending]',
    '[intro][split][melody][ending]concat=n=4:v=1:a=0[v]',
    '[0:a]atrim=end=9,asetpts=PTS-STARTPTS[openSound]',
    '[3:a]atrim=end=10,asetpts=PTS-STARTPTS[impactSound]',
    '[0:a]atrim=start=17:end=20,asetpts=PTS-STARTPTS[fluteSound]',
    '[0:a]atrim=start=28:end=34,asetpts=PTS-STARTPTS[endSound]',
    '[openSound][impactSound][fluteSound][endSound]concat=n=4:v=0:a=1[a]',
  ]
  await run('ffmpeg', [
    '-hide_banner',
    '-v',
    'error',
    '-y',
    '-filter_complex_threads',
    '2',
    '-i',
    original,
    '-i',
    top,
    '-i',
    bottom,
    '-i',
    audio,
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[v]',
    '-map',
    '[a]',
    '-c:v',
    'libx264',
    '-threads',
    '3',
    '-preset',
    'veryfast',
    '-crf',
    '17',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '256k',
    '-movflags',
    '+faststart',
    destination,
  ])
  process.stdout.write(`${destination}\n`)
}

async function renderFull() {
  const { page, info } = await openPage()
  const picture = path.join(work, 'picture.mp4')
  await capture(page, info, picture)
  if (!inspect) await finish(page, info, picture)
}

try {
  if (split) await finishSplit()
  else await renderFull()
} finally {
  await browser.close()
  await server.close()
  await rm(work, { recursive: true })
}
