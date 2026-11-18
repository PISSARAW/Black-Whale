import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.CORPSE_STAMP_CHECK_OUTPUT ?? '/tmp/black-whale-corpse-stamp-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-corpses/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-corpses/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.corpseFixture)
  await page.waitForSelector('canvas')
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const side of ['player', 'opponent']) {
      await page.evaluate((side) => window.corpseFixture.prepareStamp(side), side)
      const before = await page.evaluate(() => window.corpseFixture.snapshot())
      assert.equal(before.copy.copy.order, undefined)
      assert.equal(before.copy.arena.height, 3)
      await page
        .getByRole('button', { name: 'Order Stamp · Marquer une marionnette', exact: true })
        .click()
      const active = await page.evaluate(() => window.corpseFixture.snapshot())
      assert.equal(active.copy.copy.order, 'attack')
      assert.equal(active.copy.arena.height, 12)
      assert.equal(active.actor.aura, before.actor.aura - 10)
      assert.equal(active.actor.health, before.actor.health)
      assert.equal(active.corpse.controller, undefined)
      assert.equal(active.corpse.corpseNeedles, undefined)
      await page.waitForSelector('.fight-scene.ready')
      await page.locator('.arena').scrollIntoViewIfNeeded()
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      )
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page
        .locator('.arena')
        .screenshot({ path: path.join(output, `stamp-${side}-${width}.png`) })
      await page.evaluate(() => window.corpseFixture.advance(19))
      await page.getByRole('button', { name: 'Marionnettes · Attendre', exact: true }).click()
      const waiting = await page.evaluate(() => window.corpseFixture.snapshot())
      assert.equal(waiting.copy.copy.order, 'wait')
      await page.evaluate(() => window.corpseFixture.advance(1))
      assert.equal(
        (await page.evaluate(() => window.corpseFixture.snapshot())).copy.x,
        waiting.copy.x,
      )
      await page.evaluate(() => window.corpseFixture.severCopy())
      const severed = await page.evaluate(() => window.corpseFixture.snapshot())
      assert.equal(severed.copy.copy.headAttached, false)
      assert.equal(severed.copy.arena.height, 3)
      cases.push({ width, side })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Copied corpse Order Stamp UI passed: ${cases.length} cases.\n`)
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
