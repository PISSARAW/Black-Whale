import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.LIVE_CAMERA_OUTPUT ?? '/tmp/bwc-live-cinematics'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-camera/index.html'] },
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
let browser
const errors = []
try {
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  page.setDefaultTimeout(120000)
  page.setDefaultNavigationTimeout(120000)
  page.on('pageerror', (e) => {
    errors.push(e.stack)
    process.stderr.write(e.stack + '\n')
  })
  await page.clock.install()
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-camera/`)
  await page.waitForFunction(() => window.cameraFixture)
  await page.locator('.fight-scene.ready').waitFor()
  await page.clock.pauseAt(Date.now() + 1000)
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.cameraFixture[method](...args), { method, args })
  await fixture('awaken', 'emperor')
  let visible = 0
  for (let i = 0; i < 150; i++) {
    await fixture('advance', 2)
    await page.clock.runFor(i % 3 === 0 ? 34 : 33)
    if (await page.locator('[data-camera-event="kurapika.emperor"]').count()) visible++
    if (i === 60) await page.screenshot({ path: path.join(output, 'emperor-at-normal-speed.png') })
  }
  const state = await fixture('snapshot')
  assert.equal(state.frame, 300)
  assert.equal(state.time, 115)
  assert.ok(visible >= 27 && visible <= 43, `Emperor Time shot must stay brief: ${visible / 30}s`)
  assert.equal(await page.locator('[data-camera-detail]').count(), 0)
  process.stdout.write(
    `Emperor Time: ${visible / 30}s visible, 300 fixed ticks in 5s presentation\n`,
  )
  await fixture('solar', 'diverging')
  // The inset waits for the main camera to reserve its rectangle before mounting its own renderer.
  for (let attempt = 0; attempt < 160; attempt++) {
    await page.clock.runFor(50)
    if (await page.locator('.prediction-panel .fight-scene.ready').count()) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  await page.locator('.prediction-panel .fight-scene.ready').waitFor()
  // Replay the exact engine states from the reference film, at 60 ticks per second.
  const startClock = Number(
    await page.locator('[data-laplace-elapsed]').getAttribute('data-laplace-elapsed'),
  )
  let sawPredictedDamage = false
  let sawPredictedKo = false
  let predictedHealthBefore = null
  for (let frame = 0; frame < 180; frame += 2) {
    await fixture('solarAdvance', 2)
    await page.clock.runFor(frame % 6 === 0 ? 34 : 33)
    const real = await fixture('solarStatus')
    const hp = Number(
      await page.locator('[data-predicted-health]').getAttribute('data-predicted-health'),
    )
    if (predictedHealthBefore !== null && hp < predictedHealthBefore && hp > 0) {
      sawPredictedDamage = true
      assert.equal(real.health, 189)
      if (await page.locator('.hit-flash').count())
        await page.screenshot({ path: path.join(output, 'laplace-predicted-impact.png') })
    }
    if (hp === 0) sawPredictedKo = true
    predictedHealthBefore = hp
  }
  assert.ok(sawPredictedDamage, 'The predicted image must take damage in motion')
  assert.ok(sawPredictedKo, 'The predicted image must fall while the real prince escapes')
  const elapsed = Number(
    await page.locator('[data-laplace-elapsed]').getAttribute('data-laplace-elapsed'),
  )
  assert.ok(Math.abs(elapsed - startClock - 3) < 0.11)
  const solar = await fixture('snapshot')
  assert.ok(solar.opponent.health > 0)
  assert.equal(solar.phase, 'fighting')
  assert.equal(
    await page.locator('[data-predicted-health]').getAttribute('data-predicted-health'),
    '0',
  )
  await page.getByText('K.-O. PRÉDIT', { exact: true }).waitFor()
  await page.screenshot({ path: path.join(output, 'laplace-real-vs-predicted.png') })
  for (const [width, height] of [
    [390, 950],
    [320, 950],
    [390, 525],
    [320, 525],
  ]) {
    await page.setViewportSize({ width, height })
    await page.clock.runFor(500)
    await page.screenshot({
      path: path.join(output, `laplace-${width}${height === 525 ? '-compact' : ''}.png`),
    })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
  }
  assert.deepEqual(await fixture('snapshot'), solar)
  const framing = await fixture('diagnostics')
  assert.deepEqual(framing.actorEnvelopeOutsideViewport, [])
  assert.deepEqual(framing.missingActors, [])
  assert.ok(framing.companions.includes('tserriednich-personal-beast:opponent'))
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        passed: true,
        extendedSeconds: visible / 30,
        gameFrames: state.frame,
        gameSeconds: 120 - state.time,
        laplace: {
          realHealth: solar.opponent.health,
          predictedHealth: 0,
          elapsed,
          sawPredictedDamage,
          sawPredictedKo,
        },
        framing,
        errors,
      },
      null,
      2,
    ),
  )
  process.stdout.write(`Normal-speed cameras and Laplace comparison passed: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
