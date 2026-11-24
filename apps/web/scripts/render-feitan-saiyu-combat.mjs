import assert from 'node:assert/strict'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
import { tiktokDuration, tiktokFilters } from './feitan-tiktok-montage.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const portrait = process.argv.includes('--tiktok')
const output =
  process.env.FEITAN_SAIYU_VIDEO_OUTPUT ??
  path.resolve(root, '../../output', portrait ? 'feitan-saiyu-tiktok' : 'clash-feitan-saiyu-video')
await mkdir(output, { recursive: true })

async function run(command, args) {
  const process = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
  let error = ''
  process.stderr.on('data', (bytes) => {
    error += bytes.toString()
  })
  const [code] = await once(process, 'close')
  assert.equal(code, 0, error)
}

const server = await createServer({
  configFile: false,
  root,
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'static'),
  optimizeDeps: { entries: ['ui-tests/fighting-feitan-saiyu-video/index.html'] },
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
  const pageOptions = {
    viewport: portrait ? { width: 720, height: 1280 } : { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  }
  const errors = []
  async function openScene() {
    const page = await browser.newPage(pageOptions)
    page.on('pageerror', (error) => errors.push(error.message))
    await page.clock.install()
    await page.goto(
      `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-feitan-saiyu-video/${portrait ? '?portrait' : ''}`,
      { waitUntil: 'commit', timeout: 180000 },
    )
    await page.locator('.fight-scene.ready, .fight-scene.failed').waitFor({ timeout: 180000 })
    assert.equal(await page.locator('.fight-scene.failed').count(), 0, errors.join(' | '))
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 5000)
    await page.clock.runFor(300)
    return page
  }
  let page = await openScene()

  const prefix = path.join(output, 'feitan-vs-saiyu-silent.mp4')
  const resume = portrait && process.argv.includes('--resume')
  const firstFrame = resume
    ? Number(
        execFileSync(
          'ffprobe',
          [
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=nb_frames',
            '-of',
            'default=nw=1:nk=1',
            prefix,
          ],
          { encoding: 'utf8' },
        ).trim(),
      )
    : 0
  assert.ok(Number.isInteger(firstFrame) && firstFrame >= 0 && firstFrame < 480)
  const capture = resume ? path.join(output, 'feitan-tail.mp4') : prefix
  const silent = resume ? path.join(output, 'feitan-complete-silent.mp4') : prefix
  const soundtrack = path.join(output, 'feitan-vs-saiyu-soundtrack.m4a')
  const video = path.join(
    output,
    portrait ? 'Feitan-vs-Saiyu-TikTok.mp4' : 'feitan-vs-saiyu-corrections.mp4',
  )
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
      portrait ? 'mjpeg' : 'png',
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
      capture,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  )
  const completed = once(encoder, 'close')
  let encoderError = ''
  encoder.stderr.on('data', (bytes) => {
    encoderError += bytes.toString()
  })
  async function warmScene(frame) {
    const warmupFrames = Math.min(12, frame)
    await page.evaluate(
      (count) => window.feitanSaiyuVideo.advance(count),
      (frame - warmupFrames) * 2,
    )
    for (let warmup = 0; warmup < warmupFrames; warmup++) {
      await page.evaluate(() => window.feitanSaiyuVideo.advance(2))
      await page.clock.runFor(33)
    }
  }
  if (resume) await warmScene(firstFrame)
  for (let frame = firstFrame; frame < 480; frame++) {
    // The montage cuts here. Rebuild the scene across the cut to release WebGL resources.
    if (portrait && !resume && frame === 303) {
      await page.close()
      page = await openScene()
      await warmScene(frame)
    }
    await page.evaluate(() => window.feitanSaiyuVideo.advance(2))
    await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
    const screenshot = await page.screenshot(portrait ? { type: 'jpeg', quality: 94 } : {})
    if ([20, 65, 105, 135, 185, 245, 295, 355, 430, 470].includes(frame))
      await writeFile(path.join(output, `frame-${frame}.${portrait ? 'jpg' : 'png'}`), screenshot)
    if (!encoder.stdin.write(screenshot)) await once(encoder.stdin, 'drain')
    if (frame % 80 === 0) process.stdout.write(`Captured ${frame}/480 frames\n`)
  }
  encoder.stdin.end()
  const [code] = await completed
  assert.equal(code, 0, encoderError)
  if (resume)
    await run('ffmpeg', [
      '-y',
      '-loglevel',
      'error',
      '-i',
      prefix,
      '-i',
      capture,
      '-filter_complex',
      'concat=n=2:v=1:a=0',
      '-an',
      '-c:v',
      'libx264',
      '-crf',
      '17',
      '-pix_fmt',
      'yuv420p',
      silent,
    ])

  const audit = await page.evaluate(() => window.feitanSaiyuVideo.diagnostics())
  process.stdout.write(`Audit: ${JSON.stringify(audit)}\n`)
  assert.ok(audit.dash > 0 && audit.hidden > 0, 'Dash echoes and shutter gaps must occur')
  assert.ok(
    audit.umbrella > 0 && audit.umbrellaStarted && audit.spikeFired,
    'Umbrella and spike must occur',
  )
  assert.ok(audit.wounded > 0 && audit.armour > 0, 'Wounded pose and Pain Packer must occur')
  assert.ok(audit.sun > 0 && audit.heat > 0 && audit.sunCommanded, 'Rising Sun must heat Saiyu')
  if (portrait)
    assert.deepEqual(audit.comboRecords, [4, 5], 'Both blade routes must land as true combos')
  assert.deepEqual(errors, [])

  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=52:duration=16:sample_rate=48000',
    '-f',
    'lavfi',
    '-i',
    'anoisesrc=color=brown:duration=16:sample_rate=48000:amplitude=0.08',
    '-f',
    'lavfi',
    '-i',
    'anoisesrc=color=white:duration=2.5:sample_rate=48000:amplitude=0.22',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=1350:duration=0.14:sample_rate=48000',
    '-f',
    'lavfi',
    '-i',
    'anoisesrc=color=white:duration=0.55:sample_rate=48000:amplitude=0.3',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=170:duration=1.8:sample_rate=48000',
    '-f',
    'lavfi',
    '-i',
    'anoisesrc=color=brown:duration=3.8:sample_rate=48000:amplitude=0.35',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=72:duration=3.8:sample_rate=48000',
    '-filter_complex',
    '[0:a]volume=0.035[drone];[1:a]lowpass=f=650,volume=0.22[room];[2:a]highpass=f=1200,afade=t=in:d=0.08,afade=t=out:st=2.1:d=0.4,adelay=1500|1500,volume=0.6[speed];[3:a]adelay=4100|4100,volume=0.22[blade1];[3:a]adelay=4850|4850,volume=0.18[blade2];[3:a]adelay=5550|5550,volume=0.2[blade3];[4:a]highpass=f=900,adelay=6500|6500,volume=0.55[umbrella];[5:a]afade=t=in:d=0.35,afade=t=out:st=1.35:d=0.45,adelay=10500|10500,volume=0.13[packer];[6:a]lowpass=f=1400,afade=t=in:d=0.7,adelay=12250|12250,volume=0.65[fire];[7:a]afade=t=in:d=0.7,adelay=12250|12250,volume=0.12[sun];[drone][room][speed][blade1][blade2][blade3][umbrella][packer][fire][sun]amix=inputs=10:normalize=0,alimiter=limit=0.92[a]',
    '-map',
    '[a]',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    soundtrack,
  ])
  if (portrait) {
    await run('ffmpeg', [
      '-y',
      '-loglevel',
      'error',
      '-i',
      silent,
      '-i',
      soundtrack,
      '-f',
      'lavfi',
      '-i',
      'anoisesrc=color=white:duration=0.1:sample_rate=48000:seed=11',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=67:duration=0.12:sample_rate=48000',
      '-f',
      'lavfi',
      '-i',
      "aevalsrc=exprs='0.22*(between(t,1.5,9)+between(t,12.4,15.8))*exp(-19*mod(t-1.5,0.375))*sin(2*PI*(47*mod(t-1.5,0.375)+2*(1-exp(-30*mod(t-1.5,0.375)))))':sample_rate=48000:duration=16",
      '-filter_complex',
      tiktokFilters(audit.impacts),
      '-map',
      '[video]',
      '-map',
      '[audio]',
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '17',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-ac',
      '2',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      video,
    ])
  } else {
    await run('ffmpeg', [
      '-y',
      '-loglevel',
      'error',
      '-i',
      silent,
      '-i',
      soundtrack,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-shortest',
      '-movflags',
      '+faststart',
      video,
    ])
  }

  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        ...audit,
        video,
        soundtrack,
        stage: 'princes-burial-chamber',
        duration: portrait ? Math.round(tiktokDuration * 100) / 100 : 16,
        fps: 30,
        audio: true,
        errors,
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Feitan vs Saiyu video ready with sound: ${video}\n`)
} finally {
  encoder?.stdin.destroy()
  if (encoder && encoder.exitCode === null) encoder.kill()
  await browser?.close()
  await server.close()
}
