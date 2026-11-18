import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { once } from 'node:events'
import { spawn, execFileSync } from 'node:child_process'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(root, '../../output/laplace-reveal')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['demos/fighting-laplace-reveal/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({
  executablePath: existsSync(chrome) ? chrome : undefined,
  headless: true,
  args: ['--use-angle=metal', '--autoplay-policy=no-user-gesture-required'],
})
const errors = []
let encoder
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 810 },
    deviceScaleFactor: 1,
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.setDefaultTimeout(120000)
  await page.clock.install()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  await page.goto(`${origin}/demos/fighting-laplace-reveal/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.laplaceDemo && document.querySelector('canvas'))
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 4000)))
  const report = await page.evaluate(() => window.laplaceDemo.report())
  process.stdout.write(JSON.stringify(report, null, 2) + '\n')
  assert.ok(report.killed > 0, 'The image must die to a real attack')
  assert.ok(report.reveal > report.killed, 'The real prince must be revealed later')
  assert.equal(report.realHealth, report.setupHealth, 'The real prince must avoid the lethal shot')
  assert.equal(report.realWins, 0)
  assert.equal(report.realPhase, 'fighting')
  await writeFile(path.join(output, 'combat-report.json'), JSON.stringify(report, null, 2))
  if (process.argv.includes('--inspect')) {
    for (const [name, frame] of Object.entries({
      start: 0,
      aim: report.killed - 10,
      victory: report.killed + 80,
      reveal: report.reveal + 30,
    })) {
      await page.evaluate((frame) => window.laplaceDemo.seek(frame), frame)
      await page.clock.runFor(50)
      await page.screenshot({ path: path.join(output, `${name}.png`) })
    }
  } else {
    const picture = path.join(output, 'laplace-picture.mp4')
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
      { stdio: ['pipe', 'inherit', 'inherit'] },
    )
    const finished = once(encoder, 'exit')
    for (let frame = 0; frame < report.frames; frame += 2) {
      await page.evaluate((frame) => window.laplaceDemo.seek(frame), frame)
      await page.clock.runFor(1000 / 30)
      assert.equal(
        await page.locator('[data-camera-event^="tserriednich."]').count(),
        0,
        'A private Laplace close-up must never warn the opponent',
      )
      if (frame === Math.ceil(report.skip / 2) * 2)
        await page.getByRole('button', { name: 'Passer', exact: false }).click()
      const bytes = await page.screenshot({ type: 'jpeg', quality: 94 })
      if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain')
      if (frame % 120 === 0) process.stdout.write(`Video ${frame / 60}/${report.duration}s\n`)
      if (
        [report.killed + 100, report.skip + 30, report.reveal + 30].some(
          (age) => Math.abs(age - frame) < 1,
        )
      )
        await writeFile(path.join(output, `frame-${frame}.jpg`), bytes)
    }
    encoder.stdin.end()
    assert.equal((await finished)[0], 0)
    const audioPage = await browser.newPage()
    audioPage.on('pageerror', (error) => errors.push(error.message))
    await audioPage.goto(`${origin}/demos/fighting-laplace-reveal/audio.html`)
    await audioPage.waitForFunction(() => window.laplaceAudio)
    const encoded = await audioPage.evaluate(() => window.laplaceAudio())
    const wav = path.join(output, 'combat.wav')
    await writeFile(wav, Buffer.from(encoded, 'base64'))
    const destination = path.join(output, 'Clash-Laplace-Demon-Revelation.mp4')
    execFileSync('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      picture,
      '-i',
      wav,
      '-i',
      path.join(root, 'static/clash-victories/theta.m4a'),
      '-filter_complex',
      `[2:a]atrim=duration=${(report.skip - report.killed) / 60},asetpts=PTS-STARTPTS,afade=t=out:st=${(report.skip - report.killed) / 60 - 0.06}:d=0.06,adelay=${Math.round((report.killed * 1000) / 60)}:all=1,volume=0.75[victory];[1:a][victory]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[sound]`,
      '-map',
      '0:v',
      '-map',
      '[sound]',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-shortest',
      '-movflags',
      '+faststart',
      destination,
    ])
    process.stdout.write(`Saved ${destination}\n`)
  }
  assert.deepEqual(errors, [])
} finally {
  encoder?.kill()
  await browser.close()
  await server.close()
}
