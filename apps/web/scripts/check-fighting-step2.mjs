import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { build, preview } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.FIGHT_STEP2_OUTPUT ?? '/tmp/black-whale-step2-ui'
await mkdir(output, { recursive: true })
const config = {
  configFile: false,
  root,
  publicDir: 'static',
  mode: 'production',
  logLevel: 'warn',
  plugins: [svelte({ configFile: false, compilerOptions: { dev: false } })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  build: {
    outDir: path.join(output, 'production'),
    emptyOutDir: true,
    rollupOptions: { input: path.join(root, 'ui-tests/fighting-step2/index.html') },
  },
}
await build(config)
const server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } })
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu'],
})
const errors = [],
  results = []
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
    deviceScaleFactor: 2,
  })
  page.setDefaultTimeout(90000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    window.syntheticXbox = {
      index: 0,
      id: 'Xbox standard (automated fixture)',
      connected: true,
      mapping: 'standard',
      axes: [0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    }
    Object.defineProperty(navigator, 'getGamepads', { value: () => [window.syntheticXbox] })
  })
  const url = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-step2/`
  const nextFrames = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    )
  await page.goto(url)
  await page.waitForFunction(() => window.clashStep2?.snapshot().renders > 2)
  const hash = await page.evaluate(() => window.clashStep2.snapshot().hash)
  for (const graphics of ['performance', 'balanced', 'quality']) {
    const before = await page.evaluate(() => window.clashStep2.snapshot().renders)
    await page.getByLabel('Qualité graphique').selectOption(graphics)
    await page.waitForFunction(
      ({ before, graphics }) =>
        window.clashStep2.snapshot().graphics === graphics &&
        window.clashStep2.snapshot().renders > before + 2,
      { before, graphics },
    )
    const snapshot = await page.evaluate(() => window.clashStep2.snapshot())
    assert.equal(snapshot.failed, false)
    assert.equal(snapshot.hash, hash)
    assert.equal(snapshot.ratio, { performance: 1, balanced: 1.25, quality: 1.75 }[graphics])
    results.push({ check: 'graphics', ...snapshot })
    await page.screenshot({ path: path.join(output, `${graphics}.png`), fullPage: true })
  }
  for (const kind of ['hit', 'guard', 'parry']) {
    const impact = await page.evaluate((kind) => window.clashStep2.contact(kind), kind)
    assert.equal(impact.impact.parried, kind === 'parry')
    assert.equal(impact.impact.blocked, kind !== 'hit')
    await page.waitForFunction(
      (kind) => window.clashStep2.snapshot().contacts.includes(`fight-contact-${kind}`),
      kind,
    )
    results.push({ check: kind, ...(await page.evaluate(() => window.clashStep2.snapshot())) })
  }
  await page.locator('.input-settings > summary').click()
  await page.getByRole('button', { name: 'Manettes', exact: true }).click()
  await page.getByRole('button', { name: 'Démarrer la mesure' }).click()
  await nextFrames()
  const beforeCapture = await page.evaluate(() => window.clashStep2.snapshot().commands)
  await page.evaluate(() => {
    window.syntheticXbox.buttons[0].pressed = true
  })
  await page.waitForFunction(() =>
    document.querySelector('.gamepad-inspector ol')?.textContent.includes('Léger'),
  )
  await page.evaluate(() => {
    window.syntheticXbox.buttons[0].pressed = false
    window.syntheticXbox.buttons[2].pressed = true
  })
  await page.waitForFunction(() =>
    document.querySelector('.gamepad-inspector')?.textContent.includes('Charge Hatsu'),
  )
  await page.evaluate(() => {
    window.syntheticXbox.buttons[2].pressed = false
  })
  await page.waitForFunction(() =>
    document.querySelector('.gamepad-inspector ol')?.textContent.includes('Hatsu'),
  )
  assert.equal(await page.evaluate(() => window.clashStep2.snapshot().commands), beforeCapture)
  await page.getByRole('button', { name: 'Arrêter la mesure' }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter le rapport' }).click()
  const download = await downloadEvent
  await download.saveAs(path.join(output, 'synthetic-xbox.json'))
  const captured = JSON.parse(await readFile(path.join(output, 'synthetic-xbox.json'), 'utf8'))
  assert.ok(captured.polls > 0)
  assert.deepEqual(
    captured.events.flatMap((event) => event.actions),
    ['light', 'special'],
  )
  results.push({ check: 'synthetic-xbox-gating', commands: beforeCapture })
  await page.getByRole('button', { name: 'Démarrer la mesure' }).click()
  await page.locator('.input-settings > summary').click()
  await page.waitForFunction(
    () => !document.querySelector('.gamepad-inspector[data-inspecting="true"]'),
  )
  await nextFrames()
  await page.evaluate(() => {
    window.syntheticXbox.buttons[0].pressed = true
  })
  await page.waitForFunction(
    (expected) => window.clashStep2.snapshot().commands === expected,
    beforeCapture + 1,
  )
  assert.equal(await page.evaluate(() => window.clashStep2.snapshot().commands), beforeCapture + 1)
  await page.evaluate(() => {
    window.syntheticXbox.buttons[0].pressed = false
  })
  await page.getByLabel('Qualité graphique').selectOption('balanced')
  await page.waitForFunction(() => window.clashStep2.snapshot().ratio === 1.25)
  await page.reload()
  await page.waitForFunction(() => window.clashStep2?.snapshot().renders > 2)
  assert.equal(await page.getByLabel('Qualité graphique').inputValue(), 'balanced')
  await page.evaluate(() => window.clashStep2.locale('en'))
  assert.equal(await page.getByLabel('Graphics quality').inputValue(), 'balanced')
  await page.setViewportSize({ width: 390, height: 1000 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true })
  await page.locator('.input-settings > summary').click()
  await page.getByRole('button', { name: 'Gamepads', exact: true }).click()
  assert.ok(await page.getByRole('heading', { name: 'Check my gamepad' }).isVisible())
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  await page.screenshot({ path: path.join(output, 'mobile-xbox.png'), fullPage: true })
  await page.locator('.input-settings > summary').click()
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.evaluate(() => window.clashStep2.future(true))
  await page.locator('.prediction-panel:not(.dormant) .fight-scene.ready').waitFor()
  assert.equal(await page.evaluate(() => window.clashStep2.snapshot().forecastFrames), 600)
  assert.equal(await page.evaluate(() => window.clashStep2.snapshot().predictionContexts), 1)
  await page.evaluate(() => window.clashStep2.future(false))
  await page.locator('.prediction-panel.dormant').waitFor({ state: 'attached' })
  const draws = await page.evaluate(() => window.clashStep2.snapshot().predictionDraws)
  await page.waitForTimeout(180)
  assert.equal(await page.evaluate(() => window.clashStep2.snapshot().predictionDraws), draws)
  await page.evaluate(() => window.clashStep2.future(true))
  await page.locator('.prediction-panel:not(.dormant) .fight-scene.ready').waitFor()
  await page.waitForTimeout(100)
  assert.equal(await page.evaluate(() => window.clashStep2.snapshot().predictionContexts), 1)
  await page.evaluate(() => window.clashStep2.observe('opponent'))
  await page.locator('.prediction-panel').waitFor({ state: 'detached' })
  results.push({ check: 'future-reuse-and-private-view', frames: 600, contexts: 1 })
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        browser: browser.version(),
        scope: 'Production render and synthetic Xbox mapping; not physical hardware validation',
        results,
        errors,
      },
      null,
      2,
    ),
  )
  process.stdout.write(
    `Verified graphics, contacts, Xbox diagnostic and mobile controls: ${output}\n`,
  )
} finally {
  await browser.close()
  await new Promise((resolve) => server.httpServer.close(resolve))
}
