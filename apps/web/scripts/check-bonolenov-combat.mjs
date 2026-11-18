import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.BONOLENOV_COMBAT_OUTPUT ?? '/tmp/clash-bonolenov-combat'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, watch: null, hmr: false },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
let browser
const errors = [],
  cases = []
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/bonolenov-combat/`)
  await page.waitForFunction(() => window.bonolenovCombat)
  async function shot(options, name) {
    const result = await page.evaluate((options) => window.bonolenovCombat.show(options), options)
    assert.ok(result.finite, JSON.stringify(options))
    assert.equal(result.glError, 0)
    assert.ok(result.plan)
    cases.push(result)
    if (name) await page.screenshot({ path: path.join(output, `${name}.png`) })
    return result
  }
  for (const facing of [1, -1]) {
    await shot({ phase: 'idle', facing }, `idle-${facing}`)
    for (const frame of [0, 8, 15, 23, 30, 38, 45, 53, 59]) {
      const result = await shot({ phase: 'dance', frame, facing }, `dance-${frame}-${facing}`)
      assert.equal(result.plan, 'battle-cantabile-dance')
    }
    const ready = await shot({ phase: 'ready', facing }, `ready-${facing}`)
    assert.equal(ready.plan, 'bonolenov:prologue-ready')
    const spear = await shot({ phase: 'spear', facing })
    for (const frame of [0, spear.timing.startup, spear.timing.startup + spear.timing.active - 1])
      await shot({ phase: 'spear', frame, facing }, `spear-${frame}-${facing}`)
    for (const phase of ['step', 'pivot'])
      for (const frame of [0, 4, 8, 12])
        await shot({ phase, frame, facing }, `${phase}-${frame}-${facing}`)
    for (const slot of [
      'standingLight',
      'standingHeavy',
      'lowLight',
      'lowHeavy',
      'airLight',
      'airHeavy',
      'forwardLight',
      'forwardHeavy',
      'backHeavy',
    ]) {
      const normal = await shot({ phase: 'normal', slot, facing })
      await shot(
        { phase: 'normal', slot, frame: normal.timing.startup, facing },
        `${slot}-${facing}`,
      )
    }
  }
  const film = []
  for (const [phase, count] of [
    ['dance', 60],
    ['ready', 18],
    ['spear', 36],
    ['pivot', 16],
  ])
    for (let frame = 0; frame < count; frame++) film.push({ phase, frame, facing: 1 })
  if (process.env.BONOLENOV_COMBAT_FILM === '1') {
    await mkdir(path.join(output, 'film'), { recursive: true })
    let index = 0
    for (const options of film) await shot(options, `film/${String(index++).padStart(4, '0')}`)
  }
  const { wav, ...audio } = await page.evaluate(
    (shots) => window.bonolenovCombat.renderAudio(shots),
    film,
  )
  assert.ok(audio.peak > 0.01 && audio.peak < 0.5, `audio peak ${audio.peak}`)
  for (const section of ['danceRms', 'strikeRms', 'pivotRms'])
    assert.ok(audio[section] > 0.001, section)
  assert.ok(audio.restRms < 0.0001, `idle sound ${audio.restRms}`)
  await writeFile(path.join(output, 'body-music.wav'), Buffer.from(wav, 'base64'))
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, cases, audio, errors }, null, 2),
  )
  process.stdout.write(`Bonolenov: ${cases.length} rendered frames verified. ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
