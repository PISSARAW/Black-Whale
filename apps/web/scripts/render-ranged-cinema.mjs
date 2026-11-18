import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(root, '../../output/fighting-ranged-cinema')
const inspect = process.argv.includes('--inspect')
const audioOnly = process.argv.includes('--audio-only')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: ['demos/fighting-showcase/ranged-cinema.html'],
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
  page.on('console', (e) => {
    if (e.type() === 'error') process.stderr.write(e.text() + '\n')
  })
  await page.clock.install()
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-showcase/ranged-cinema.html`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.fightingShowcase?.ready())
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  const report = await page.evaluate(() => window.fightingShowcase.report())
  assert.equal(report.winner, 'opponent')
  assert.equal(report.finalHealth.player, 0)
  assert.equal(report.fatality.source, 'src/lib/fighting/victory/franklin.ts')
  assert.equal(report.cinematography.insetCount, 0)
  assert.deepEqual(report.continuity, { resets: 0, backwards: false, healed: false })
  assert.ok(report.confirmedCombos >= 25)
  assert.ok(report.comboCancels.length >= 25)
  assert.ok(report.comboCancels.every((e) => e.legal && e.confirmedHit))
  assert.ok(report.audit.every((e) => e.kind !== 'command' || e.accepted))
  assert.ok(report.reversals.length >= 5)
  assert.equal(report.frameCount, report.combatFrames + 600)
  await writeFile(path.join(output, 'combat-report.json'), JSON.stringify(report, null, 2))
  process.stdout.write(
    JSON.stringify(
      {
        duration: report.duration,
        combatSeconds: report.combatSeconds,
        confirmedCombos: report.confirmedCombos,
        realCancels: report.comboCancels.length,
        reversals: report.reversals.length - 1,
        health: report.finalHealth,
        cinematography: report.cinematography.kinds,
        failed: errors,
      },
      null,
      2,
    ) + '\n',
  )
  const cuts = report.cinematography.cuts
  const wanted = ['wide', 'face', 'floor', 'punch', 'barrage', 'hands']
  const samples = wanted.flatMap((kind) => {
    const shot = cuts.find((s) => s.kind === kind && (kind !== 'face' || s.side === 'player'))
    return shot ? [{ name: `cinema-${kind}`, frame: Math.round(shot.second * 60) + 4 }] : []
  })
  const franklin = cuts.find((s) => s.kind === 'face' && s.side === 'opponent')
  samples.push({ name: 'cinema-face-franklin', frame: Math.round(franklin.second * 60) + 4 })
  for (const age of [30, 165, 235, 310, 390, 500, 590])
    samples.push({ name: `fatality-${age}`, frame: report.combatFrames + age })
  const audit = []
  for (const sample of samples) {
    await page.evaluate((frame) => window.fightingShowcase.seek(frame), sample.frame)
    await page.clock.runFor(200)
    await page.screenshot({
      path: path.join(output, `${sample.name}.jpg`),
      type: 'jpeg',
      quality: 96,
    })
    audit.push({
      ...sample,
      ...(await page.evaluate(() => window.fightingShowcase.report().presentation)),
    })
  }
  assert.ok(
    audit.some(
      (a) =>
        a.kind === 'native-franklin-fatality' &&
        a.fighter === 'franklin' &&
        a.target === 'leorio' &&
        a.stage === 'princes-burial-chamber',
    ),
  )
  await writeFile(path.join(output, 'presentation-audit.json'), JSON.stringify(audit, null, 2))
  if (audioOnly) {
    process.stdout.write('Rendering native fight audio…\n')
    const audio = await page.evaluate(() => window.fightingShowcase.audio())
    await writeFile(path.join(output, 'game-audio.wav'), Buffer.from(audio, 'base64'))
    process.stdout.write('Audio saved\n')
  } else if (!inspect) {
    const destination = path.join(output, 'Leorio-vs-Franklin-Cinema-picture.mp4')
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
    await page.clock.runFor(500)
    for (let frame = 0; frame < report.frameCount; frame++) {
      await page.evaluate((frame) => window.fightingShowcase.seek(frame), frame)
      await page.clock.runFor(
        Math.floor(((frame + 1) * 1000) / 60) - Math.floor((frame * 1000) / 60),
      )
      const bytes = await page.screenshot({ type: 'jpeg', quality: 95 })
      if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain')
      if (frame % 600 === 0) process.stdout.write(`Video: ${frame / 60} / ${report.duration}s\n`)
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
