import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.DOWSING_MAP_CHECK_OUTPUT ?? '/tmp/black-whale-dowsing-map-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-preparation/index.html'] },
  server: { host: '127.0.0.1', port: 0, watch: null, hmr: false },
  logLevel: 'error',
})
await server.listen()
let browser
let page
const errors = []
const cases = []
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--enable-unsafe-swiftshader'],
  })
  page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, hasTouch: true })
  page.setDefaultTimeout(60000)
  page.setDefaultNavigationTimeout(60000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-preparation/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.preparationFixture)
  await page.waitForSelector('canvas')
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const side of ['player', 'opponent']) {
      await page.evaluate((side) => window.preparationFixture.prepareDowsingMap(side), side)
      const before = await page.evaluate(
        (side) => window.preparationFixture.mapSnapshot(side),
        side,
      )
      await page
        .getByRole('button', { name: 'Dowsing · Rechercher Hisoka sur le plan', exact: true })
        .click()
      const started = await page.evaluate(
        (side) => window.preparationFixture.mapSnapshot(side),
        side,
      )
      assert.equal(started.search.phase, 'searching')
      assert.equal(started.search.mapId, `${side}:arena-map`)
      assert.equal(started.search.origin.source, 'personal')
      assert.equal(started.aura, before.aura - 3)
      await page.evaluate(() => window.preparationFixture.advance(30))
      const read = await page.evaluate((side) => window.preparationFixture.mapSnapshot(side), side)
      assert.equal(read.search.phase, 'reading')
      assert.equal(read.reading.bodyKey, side === 'player' ? 'opponent:0' : 'player:0')
      assert.ok(Math.abs(read.reading.point.x - ((side === 'player' ? 80 : 20) - 7) / 86) < 0.001)
      assert.equal(read.health, before.health)
      const plan = page.getByRole('img', { name: 'Plan papier de l’arène', exact: true })
      assert.ok(await plan.locator('circle').count())
      await plan.scrollIntoViewIfNeeded()
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      )
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page.screenshot({
        path: path.join(output, `dowsing-map-${side}-${width}.png`),
        fullPage: true,
      })
      await page
        .getByRole('button', {
          name: 'Dowsing · Interrompre la recherche sur le plan',
          exact: true,
        })
        .click()
      const stopped = await page.evaluate(
        (side) => window.preparationFixture.mapSnapshot(side),
        side,
      )
      assert.equal(stopped.search, undefined)
      assert.equal(stopped.pose, undefined)
      assert.deepEqual(stopped.reading, read.reading)
      cases.push({ width, side })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Dowsing map UI passed: ${cases.length} cases.\n`)
} catch (error) {
  await writeFile(
    path.join(output, 'failure.json'),
    JSON.stringify({ cases, errors, message: String(error) }, null, 2),
  )
  if (page)
    await page
      .screenshot({ path: path.join(output, 'failure.png'), fullPage: true })
      .catch(() => {})
  throw error
} finally {
  await browser?.close()
  await server.close()
}
