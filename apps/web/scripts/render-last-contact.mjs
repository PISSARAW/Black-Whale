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
const output = path.resolve(root, '../../output/fighting-last-contact')
const facesOnly = process.argv.includes('--faces-only')
const inspect = process.argv.includes('--inspect') || facesOnly
const audioOnly = process.argv.includes('--audio-only')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [
    {
      name: 'last-contact-diagnostics',
      enforce: 'pre',
      transform(source, id) {
        if (id.endsWith('/FightScene.svelte'))
          return source.replace('} catch {', '} catch (error) { console.error(error);')
      },
    },
    svelte({ configFile: false }),
  ],
  optimizeDeps: {
    entries: ['demos/fighting-showcase/last-contact.html'],
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
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-showcase/last-contact.html`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.fightingShowcase?.ready() || window.fightingShowcaseError)
  assert.equal(await page.evaluate(() => window.fightingShowcaseError), undefined)
  await page.clock.install()
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  const report = await page.evaluate(() => window.fightingShowcase.report())
  assert.equal(report.winner, 'opponent')
  assert.equal(report.finalHealth.player, 0)
  assert.equal(report.cinematography.insetCount, 0)
  assert.deepEqual(report.continuity, { resets: 0, backwards: false, healed: false })
  assert.ok(report.confirmedCombos >= 25)
  assert.ok(report.comboCancels.length >= 25)
  assert.ok(report.comboCancels.every((e) => e.legal && e.confirmedHit))
  assert.ok(report.audit.every((e) => e.kind !== 'command' || e.accepted))
  assert.equal(report.frameCount, report.combatFrames)
  assert.ok(report.proof.sunSurvivesSeconds > 120)
  assert.ok(report.proof.stolenTexture && report.proof.chrolloUsesTexture)
  assert.ok(report.proof.hiddenGum && report.proof.rebound && report.proof.recall)
  assert.ok(report.proof.copies.headDestroyed && report.proof.copies.marked)
  assert.ok(report.proof.indoorFish.deferredWounds > 0)
  assert.ok(report.proof.hisokaFinisher && report.proof.finalParry)
  await writeFile(path.join(output, 'combat-report.json'), JSON.stringify(report, null, 2))
  process.stdout.write(
    JSON.stringify(
      {
        duration: report.duration,
        combatSeconds: report.combatSeconds,
        confirmedCombos: report.confirmedCombos,
        realCancels: report.comboCancels.length,
        proof: report.proof,
        health: report.finalHealth,
        cinematography: report.cinematography.kinds,
        failed: errors,
      },
      null,
      2,
    ) + '\n',
  )
  const cuts = report.cinematography.cuts
  const samples = ['wide', 'book', 'hands'].flatMap((kind) => {
    const shot = cuts.find((s) => s.kind === kind)
    return shot ? [{ name: `cinema-${kind}`, frame: Math.round(shot.second * 60) + 5 }] : []
  })
  for (const side of ['player', 'opponent']) {
    const shot = cuts.find((s) => s.kind === 'face' && s.side === side)
    samples.push({ name: `face-${side}`, frame: Math.round(shot.second * 60) + 4 })
  }
  for (const beat of report.beats)
    samples.push({
      name: `beat-${Math.round(beat.second)}`,
      frame: Math.round(beat.second * 60) + 30,
    })
  for (const emotion of [
    'smirk',
    'delight',
    'pain',
    'surprise',
    'fury',
    'strain',
    'satisfaction',
  ]) {
    const moment = report.expressions.transitions.find((e) => e.emotion === emotion)
    if (moment)
      samples.push({
        name: `emotion-${emotion}`,
        frame: Math.round(moment.second * 60) + 8,
        side: moment.side,
      })
  }
  for (const seconds of [1.5, 29.5, 34, 48, 55, 72, 94, 110, report.duration - 0.8])
    samples.push({ name: `detail-${seconds.toFixed(1)}`, frame: Math.round(seconds * 60) })
  if (facesOnly)
    samples.splice(0, samples.length, ...samples.filter((s) => s.name.startsWith('emotion-')))
  const audit = []
  for (const sample of samples) {
    await page.evaluate((frame) => window.fightingShowcase.seek(frame), sample.frame)
    if (sample.side)
      await page.evaluate((side) => window.fightingShowcase.portrait(side), sample.side)
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
  await writeFile(path.join(output, 'presentation-audit.json'), JSON.stringify(audit, null, 2))
  if (audioOnly) {
    process.stdout.write('Rendering native fight audio…\n')
    const audio = await page.evaluate(() => window.fightingShowcase.audio())
    await writeFile(path.join(output, 'game-audio.wav'), Buffer.from(audio, 'base64'))
    process.stdout.write('Audio saved\n')
  } else if (!inspect) {
    const destination = path.join(output, 'Hisoka-vs-Chrollo-Le-Dernier-Contact-picture.mp4')
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
