import assert from 'node:assert/strict'
import { mkdir, writeFile, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(root, '../../output/fighting-bill-fatality')
const inspect = process.argv.includes('--inspect')
const combatOnly = process.argv.includes('--combat-only')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: ['demos/fighting-showcase/bill-fatality.html'],
    holdUntilCrawlEnd: false,
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
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.clock.install()
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-showcase/bill-fatality.html`,
    { waitUntil: 'domcontentloaded' },
  )
  if (errors.length) throw new Error(errors.join('\n'))
  await Promise.race([
    new Promise((_, reject) => page.once('pageerror', reject)),
    page.waitForFunction(() => window.fightingShowcase?.ready()),
  ])
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 120000)))
  const report = await page.evaluate(() => window.fightingShowcase.report())
  assert.equal(report.frameCount, 600)
  assert.equal(report.duration, 10)
  assert.equal(report.character, 'Bill')
  assert.equal(report.realSeed, true)
  assert.equal(report.grew, true)
  assert.equal(report.harmlessGrowth, true)
  assert.equal(report.physicalKnockout, true)
  assert.equal(report.nativeCombos.length, 3)
  assert.equal(report.nativeHits.length, 12)
  assert.equal(report.winner, 'player')
  assert.equal(report.failed, false, errors.join('\n'))
  assert.deepEqual(report.continuity, { resets: 0, backwards: false, healed: false })
  await writeFile(path.join(output, 'cinematic-report.json'), JSON.stringify(report, null, 2))
  process.stdout.write(
    JSON.stringify({
      duration: report.duration,
      victory: report.victory,
      finalHealth: report.finalHealth,
      harmlessGrowth: report.harmlessGrowth,
      combos: report.confirmedCombos,
    }) + '\n',
  )
  {
    const samples = [
      0,
      ...report.victory.hitFrames,
      65,
      95,
      195,
      225,
      326,
      354,
      366,
      390,
      420,
      456,
      480,
      516,
      570,
    ].map((age) => ({ name: `victory-${age}`, frame: age }))
    const diagnostics = []
    for (const sample of samples) {
      await page.evaluate((frame) => window.fightingShowcase.seek(frame), sample.frame)
      await page.clock.runFor(50)
      await page.screenshot({
        path: path.join(output, `${sample.name}.jpg`),
        type: 'jpeg',
        quality: 94,
      })
      diagnostics.push({
        ...sample,
        ...(await page.evaluate(() => window.fightingShowcase.report())),
      })
    }
    await writeFile(
      path.join(output, 'presentation-audit.json'),
      JSON.stringify(diagnostics, null, 2),
    )
  }
  if (!inspect) {
    const destination = path.join(
      output,
      `Bill-Dernier-Rempart-${combatOnly ? 'combat' : 'picture'}.mp4`,
    )
    const fullPicture = path.join(output, 'Bill-Dernier-Rempart-picture.mp4')
    if (combatOnly)
      assert.ok(existsSync(fullPicture), 'The unchanged ending must already be rendered')
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
    await page.clock.runFor(50)
    for (let frame = 0; frame < (combatOnly ? 343 : report.frameCount);) {
      await page.evaluate((frame) => window.fightingShowcase.seek(frame), frame)
      await page.clock.runFor(
        Math.floor(((frame + 1) * 1000) / 60) - Math.floor((frame * 1000) / 60),
      )
      const bytes = await page.screenshot({ type: 'jpeg', quality: 94 })
      const repeats = 1
      for (let repeat = 0; repeat < repeats; repeat++) {
        if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain')
      }
      if (frame % 60 === 0) process.stdout.write(`Video: ${frame / 60} / ${report.duration}s\n`)
      frame += repeats
    }
    encoder.stdin.end()
    assert.equal((await finished)[0], 0)
    if (combatOnly) {
      const revised = path.join(output, 'Bill-Dernier-Rempart-revised-picture.mp4')
      const merge = spawn(
        'ffmpeg',
        [
          '-hide_banner',
          '-loglevel',
          'error',
          '-y',
          '-i',
          destination,
          '-i',
          fullPicture,
          '-filter_complex',
          '[1:v]trim=start_frame=343,setpts=PTS-STARTPTS[tail];[0:v][tail]concat=n=2:v=1:a=0,fps=60[v]',
          '-map',
          '[v]',
          '-frames:v',
          '600',
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
          revised,
        ],
        { stdio: ['ignore', 'inherit', 'inherit'] },
      )
      assert.equal((await once(merge, 'exit'))[0], 0)
      await rename(revised, fullPicture)
    }
    process.stdout.write(`Saved: ${combatOnly ? fullPicture : destination}\n`)
  }
  assert.deepEqual(errors, [])
} finally {
  encoder?.kill()
  await browser?.close()
  await server.close()
}
