import assert from 'node:assert/strict'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output =
  process.env.KURAPIKA_VIDEO_OUTPUT ?? path.resolve(root, '../../output/clash-kurapika-mizaistom')
await mkdir(output, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}

async function addSoundtrack(picture, destination) {
  const music = path.join(root, 'static/audio/clash/banquet-hall.mp3')
  const layers = []
  const delay = (seconds) => `adelay=${Math.round(seconds * 1000)}:all=1`
  const add = (label, chain) => layers.push({ label, chain })
  add(
    'music',
    '[1:a]atrim=0:24,asetpts=N/SR/TB,volume=0.24,highpass=f=45,afade=t=in:d=0.4,afade=t=out:st=22.8:d=1.2',
  )
  add('pressure', 'aevalsrc=0.022*(sin(2*PI*43*t)+0.28*sin(2*PI*67*t))*sin(PI*t/24)^2:s=48000:d=24')
  for (const [index, at] of [0.5, 1.43, 1.72].entries())
    add(
      `dash${index}`,
      `anoisesrc=c=pink:a=0.15:d=0.42:r=48000:seed=${31 + index},highpass=f=900,lowpass=f=6500,afade=t=in:d=0.04,afade=t=out:st=0.12:d=0.3,${delay(at)}`,
    )
  for (const [index, at] of [2.57, 4.5, 5.17, 5.93, 6.83, 15.5, 17.1, 19.25, 21.4].entries()) {
    add(
      `hit${index}`,
      `aevalsrc=0.24*(sin(2*PI*(105*t-32*t*t))+0.35*sin(2*PI*210*t))*exp(-18*t):s=48000:d=0.32,${delay(at)}`,
    )
    add(
      `body${index}`,
      `anoisesrc=c=brown:a=0.13:d=0.18:r=48000:seed=${71 + index},highpass=f=180,lowpass=f=3800,afade=t=out:d=0.18,${delay(at)}`,
    )
  }
  add(
    'gun',
    `anoisesrc=c=white:a=0.48:d=0.13:r=48000:seed=119,highpass=f=500,lowpass=f=9000,afade=t=out:d=0.13,${delay(8.58)}`,
  )
  add('gun-low', `aevalsrc=0.34*sin(2*PI*82*t)*exp(-17*t):s=48000:d=0.45,${delay(8.58)}`)
  for (const [index, at] of [9.75, 11, 12.67, 14.17].entries()) {
    add(
      `chain${index}`,
      `aevalsrc=0.105*(sin(2*PI*${1450 + index * 170}*t)+0.42*sin(2*PI*${2920 + index * 210}*t))*exp(-20*t):s=48000:d=0.48,${delay(at)}`,
    )
    add(
      `chain-air${index}`,
      `anoisesrc=c=pink:a=0.075:d=0.7:r=48000:seed=${151 + index},highpass=f=1800,afade=t=in:d=0.06,afade=t=out:st=0.18:d=0.5,${delay(at - 0.12)}`,
    )
  }
  add(
    'emperor',
    `anoisesrc=c=pink:a=0.055:d=4.4:r=48000:seed=191,highpass=f=420,lowpass=f=4200,afade=t=in:d=0.7,afade=t=out:st=3.5:d=0.9,${delay(12)}`,
  )
  const filter = [
    ...layers.map(({ label, chain }) => `${chain}[${label}]`),
    `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,apad=whole_dur=24,atrim=0:24,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.94:level=0:latency=1[audio]`,
  ].join(';')
  await writeFile(path.join(output, 'sound-design.ffscript'), filter)
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    picture,
    '-stream_loop',
    '-1',
    '-i',
    music,
    '-filter_complex',
    filter,
    '-map',
    '0:v',
    '-map',
    '[audio]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-t',
    '24',
    '-movflags',
    '+faststart',
    destination,
  ])
}
const server = await createServer({
  configFile: false,
  root,
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'static'),
  optimizeDeps: { entries: ['ui-tests/fighting-kurapika-video/index.html'] },
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
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  page.setDefaultTimeout(90000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.clock.install()
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-kurapika-video/`,
  )
  await page.waitForFunction(() => window.kurapikaVideo)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 100)
  await page.clock.runFor(300)

  const picture = path.join(output, 'Kurapika-vs-Mizaistom-corrections-picture.mp4')
  const video = path.join(output, 'Kurapika-vs-Mizaistom-corrections.mp4')
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
  encoder.stderr.on('data', (bytes) => (encoderError += bytes.toString()))
  for (let frame = 0; frame < 720; frame++) {
    await page.evaluate(() => window.kurapikaVideo.advance(2))
    await page.clock.runFor(frame % 3 === 0 ? 34 : 33)
    const png = await page.screenshot()
    if ([25, 55, 82, 145, 205, 265, 335, 430, 545, 665].includes(frame))
      await writeFile(path.join(output, `frame-${frame}.png`), png)
    if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain')
    if (frame % 90 === 0) process.stdout.write(`Captured ${frame}/720 frames\n`)
  }
  encoder.stdin.end()
  const [code] = await completed
  assert.equal(code, 0, encoderError)
  const audit = await page.evaluate(() => window.kurapikaVideo.diagnostics())
  assert.ok(audit.dashFrames > 8, 'The film must show Kurapika dashing')
  assert.ok(audit.blockedFrames > 0, 'Mizaistom must trigger the raised-forearm block')
  assert.ok(audit.pistolFrames > 0, 'The Black Whale handgun pose must appear')
  assert.ok(audit.chainFrames > 20, 'The film must show legal chain commands')
  assert.ok(audit.emperorFrames > 60, 'Emperor Time must remain visible')
  assert.equal(audit.chainJailTargetEligible, false)
  assert.deepEqual(errors, [])
  await addSoundtrack(picture, video)
  const probe = JSON.parse(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', video],
      { encoding: 'utf8' },
    ),
  )
  assert.equal(Number(probe.format.duration), 24)
  assert.deepEqual(probe.streams.map(({ codec_type }) => codec_type).sort(), ['audio', 'video'])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        ...audit,
        video,
        picture,
        duration: 24,
        fps: 30,
        audio: {
          music: 'static/audio/clash/banquet-hall.mp3',
          effects: ['dash', 'guard and body impacts', 'handgun', 'chains', 'Emperor Time'],
        },
        errors,
      },
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
