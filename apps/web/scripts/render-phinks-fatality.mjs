import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(root, '../../output/fighting-phinks-fatality')
const timings = JSON.parse(
  await readFile(
    new URL('../src/lib/fighting/victory/phinksFilmTiming.json', import.meta.url),
    'utf8',
  ),
)
const inspect = process.argv.includes('--inspect')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: ['demos/fighting-showcase/phinks-fatality.html'],
  },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
let browser, encoder
const errors = []
try {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  browser = await chromium.launch({
    executablePath: existsSync(chrome) ? chrome : undefined,
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  })
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  })
  page.setDefaultTimeout(120000)
  page.on('pageerror', (error) => {
    errors.push(error.message)
    process.stderr.write(error.stack + '\n')
  })
  page.on('console', (message) => {
    const url = message.location().url
    if (message.type() !== 'error' || url.endsWith('/favicon.ico')) return
    if (/THREE\.WebGLProgram|Clash victory/.test(message.text())) errors.push(message.text())
    process.stderr.write(`${message.text()} (${url})\n`)
  })
  await page.clock.install()
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-showcase/phinks-fatality.html`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(
    () => window.fightingShowcase?.ready() || document.body.innerText.includes('Error'),
  )
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  const report = await page.evaluate(() => window.fightingShowcase.report())
  assert.equal(report.failed, false)
  assert.equal(report.frameCount, 480)
  assert.equal(report.duration, 8)
  assert.equal(report.character, 'Phinks')
  assert.equal(report.victory.impactFrame, timings.contact)
  assert.equal(report.victory.verdictFrame, timings.verdict)
  assert.ok(report.victory.parryFrame < report.victory.rotationsEndFrame)
  assert.ok(report.victory.stepPlantFrame < report.victory.impactFrame)
  assert.ok(report.victory.debrisHitFrame > report.victory.disintegratedFrame)
  assert.ok(report.victory.debrisHitFrame < report.victory.debrisSettleFrame)
  assert.ok(report.victory.floorCrackFrame > report.victory.impactFrame)
  assert.ok(report.victory.fractureFrame > report.victory.impactFrame)
  assert.ok(report.victory.disintegratedFrame < report.victory.wideShotFrame)
  assert.equal(report.nativeTurns, 6)
  assert.equal(report.winner, 'player')
  assert.equal(report.finalPunch.move, 'phinks:finisher')
  assert.deepEqual(report.continuity, { resets: 0, backwards: false, healed: false })
  await writeFile(path.join(output, 'cinematic-report.json'), JSON.stringify(report, null, 2))
  process.stdout.write(
    JSON.stringify({
      duration: report.duration,
      victory: report.victory,
      finalHealth: report.finalHealth,
      maximumFinalStretch: report.maximumFinalStretch,
      combos: report.confirmedCombos,
    }) + '\n',
  )
  {
    const samples = [
      0,
      25,
      timings.firstTurn,
      timings.interceptShot,
      timings.parry,
      timings.parry + 11,
      timings.windupEnd,
      timings.plant,
      timings.strikeShot,
      timings.contact - 1,
      timings.contact,
      timings.floorCrack,
      timings.flightShot,
      timings.flightShot + 14,
      timings.disintegrated - 10,
      timings.disintegrated,
      timings.wideShot,
      timings.debrisHit,
      timings.debrisHit + 11,
      timings.debrisHit + 33,
      timings.debrisSettle,
      timings.reactionShot,
      timings.verdict - 1,
      timings.verdict,
      419,
      447,
      462,
      479,
    ].map((age) => ({ name: `victory-${age}`, frame: age }))
    const diagnostics = []
    for (const sample of samples) {
      await page.evaluate((frame) => window.fightingShowcase.seek(frame), sample.frame)
      await page.clock.runFor(34)
      const verdict = page.locator('[data-phinks-verdict]')
      assert.equal(await verdict.isVisible(), sample.frame >= timings.verdict)
      if (sample.frame >= timings.verdict) assert.match(await verdict.innerText(), /FATALITY/)
      await page.screenshot({
        path: path.join(output, `${sample.name}.jpg`),
        type: 'jpeg',
        quality: 94,
      })
      diagnostics.push(sample)
    }
    await writeFile(
      path.join(output, 'presentation-audit.json'),
      JSON.stringify(diagnostics, null, 2),
    )
  }
  if (!inspect) {
    const destination = path.join(output, 'Phinks-Le-dernier-tour-picture.mp4')
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
        '60',
        '-i',
        'pipe:0',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '17',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        destination,
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] },
    )
    const finished = once(encoder, 'exit')
    await page.evaluate(() => window.fightingShowcase.seek(0))
    await page.clock.runFor(1200)
    for (let frame = 0; frame < report.frameCount;) {
      await page.evaluate((frame) => window.fightingShowcase.seek(frame), frame)
      await page.clock.runFor(
        Math.floor(((frame + 1) * 1000) / 60) - Math.floor((frame * 1000) / 60),
      )
      const bytes = await page.screenshot({ type: 'jpeg', quality: 94 })
      const repeats =
        frame < report.victory.startFrame ? Math.min(2, report.victory.startFrame - frame) : 1
      for (let repeat = 0; repeat < repeats; repeat++) {
        if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain')
      }
      if (frame % 120 === 0) process.stdout.write(`Video: ${frame / 60} / ${report.duration}s\n`)
      frame += repeats
    }
    encoder.stdin.end()
    assert.equal((await finished)[0], 0)
    process.stdout.write(`Saved: ${destination}\n`)
  }
  assert.deepEqual(errors, [])
} finally {
  encoder?.kill()
  await browser?.close()
  await server.close()
}
