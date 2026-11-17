import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/fighting-beyond-curse/validation')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: ['demos/fighting-showcase/beyond-curse.html', 'ui-tests/fighting-victory/index.html'],
  },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  headless: true,
  args: process.platform === 'darwin' ? ['--use-angle=metal'] : [],
})
const errors = [],
  results = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.setDefaultTimeout(120000)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.clock.install()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  const princes = ['benjamin', 'camilla', 'tserriednich', 'halkenburg']
  for (const carrier of ['furykov', 'longhi']) {
    for (const [index, prince] of princes.entries()) {
      const options = {
        carrier,
        prince,
        stage: index % 2 ? 'screening-room' : 'whale-hold',
        side: index % 2 ? 'opponent' : 'player',
        ...(index === 3 ? { reduced: '1' } : {}),
      }
      await page.clock.resume()
      await page.goto(
        `${base}/demos/fighting-showcase/beyond-curse.html?${new URLSearchParams(options)}`,
        { waitUntil: 'domcontentloaded' },
      )
      await page.waitForFunction(() => window.fightingShowcase?.ready())
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 120000)))
      const report = await page.evaluate(() => window.fightingShowcase.report())
      assert.equal(report.failed, false)
      assert.equal(report.physicalKnockout, true)
      assert.equal(report.variant, `beyond-curse-${carrier}`)
      assert.equal(report.winner, options.side)
      assert.equal(report.fictionalTargetAssignment, true)
      for (const age of [60, 120, 180, 270, 390, 480, 570]) {
        await page.evaluate((age) => window.fightingShowcase.seek(age), age)
        await page.clock.runFor(50)
        assert.equal(
          await page.evaluate(() => window.fightingShowcase.report().nativeState),
          report.nativeState,
        )
        await page.screenshot({ path: path.join(output, `${carrier}-${prince}-${age}.jpg`) })
      }
      if (prince === 'camilla') {
        await page.setViewportSize({ width: 390, height: 844 })
        for (const age of [180, 390, 480]) {
          await page.evaluate((age) => window.fightingShowcase.seek(age), age)
          await page.clock.runFor(50)
          await page.screenshot({ path: path.join(output, `${carrier}-mobile-${age}.jpg`) })
        }
        await page.setViewportSize({ width: 1280, height: 800 })
      }
      results.push(options)
      process.stdout.write(`Verified ${carrier} / ${prince} / ${options.side}\n`)
    }
  }
  await page.clock.resume()
  await page.goto(`${base}/ui-tests/fighting-victory/`)
  await page.waitForFunction(() => window.victoryFixture)
  for (const carrier of ['furykov', 'longhi']) {
    for (const [index, prince] of princes.entries()) {
      await page.evaluate(
        async ({ carrier, prince, index }) => {
          await window.victoryFixture.configure({
            winner: prince,
            target: carrier,
            side: index % 2 ? 'opponent' : 'player',
            stage: 'vip-casino',
          })
          await window.victoryFixture.pause(true)
          await window.victoryFixture.finish()
        },
        { carrier, prince, index },
      )
      const overlay = page.locator('[data-victory-cinematic]')
      await overlay.waitFor()
      assert.equal(await overlay.getAttribute('data-winner'), prince)
      assert.equal(await overlay.getAttribute('data-target'), carrier)
      assert.equal(await overlay.getAttribute('data-variant'), `beyond-curse-${carrier}`)
      assert.equal(
        (await page.request.get(`${base}/clash-victories/beyond-curse-${carrier}.m4a`)).status(),
        200,
      )
      const source = await page.evaluate(() => window.victoryFixture.snapshot().state)
      await page.locator('.skip-victory').click()
      await overlay.waitFor({ state: 'detached' })
      assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().active), false)
      assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().state), source)
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ results, liveCases: 8, errors }, null, 2),
  )
  process.stdout.write(`Beyond curse checks passed: ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
