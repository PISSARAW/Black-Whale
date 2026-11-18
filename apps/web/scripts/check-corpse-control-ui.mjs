import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.CORPSE_CONTROL_CHECK_OUTPUT ?? '/tmp/black-whale-corpse-control-ui'
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
      for (const mode of ['book', 'loan']) {
        await page.evaluate(({ mode, side }) => window.corpseFixture.prepare(mode, side), {
          mode,
          side,
        })
        const before = await page.evaluate(() => window.corpseFixture.snapshot())
        const label =
          mode === 'book'
            ? 'Illumi · Implanter un cadavre réel'
            : 'Dolphin prêté · Illumi · Implanter un cadavre réel'
        await page.locator('button:not([disabled])').filter({ hasText: label }).click()
        const started = await page.evaluate(() => window.corpseFixture.snapshot())
        assert.equal(started.actor.preparation.origin.source, mode === 'book' ? 'book' : 'dolphin')
        assert.equal(started.actor.preparation.hand, mode === 'book' ? 'left' : 'right')
        if (mode === 'loan') {
          assert.equal(started.actor.aura, 0)
          assert.equal(started.actor.loan.auraSupply.amount, 0)
        }
        await page.evaluate(() => window.corpseFixture.advance(60))
        const active = await page.evaluate(() => window.corpseFixture.snapshot())
        assert.equal(active.corpse.controller.side, side)
        assert.equal(
          active.corpse.corpseControl.origin.source,
          mode === 'book' ? 'book' : 'dolphin',
        )
        assert.equal(active.actor.health, before.actor.health)
        const pins = active.corpse.corpseNeedles.id
        if (mode === 'book') {
          await page.locator('.live-book > summary').click()
          await page.getByLabel('Page de Skill Hunter', { exact: true }).selectOption('black-voice')
          await page.locator('.live-book > summary').click()
          await page.evaluate(() => window.corpseFixture.advance(13))
        } else {
          await page
            .getByRole('button', { name: 'Dolphin prêté · Terminer l’application', exact: true })
            .click()
        }
        const stopped = await page.evaluate(() => window.corpseFixture.snapshot())
        assert.equal(stopped.corpse.controller, undefined)
        assert.equal(stopped.corpse.corpseNeedles.id, pins)
        await page.waitForSelector('.fight-scene.ready')
        await page.locator('.arena').scrollIntoViewIfNeeded()
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        )
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        )
        await page
          .locator('.arena')
          .screenshot({ path: path.join(output, `${mode}-${side}-${width}.png`) })
        await page
          .locator('button:not([disabled])')
          .filter({ hasText: 'Cadavre · Retirer les aiguilles' })
          .click()
        const removed = await page.evaluate(() => window.corpseFixture.snapshot())
        assert.equal(removed.corpse.corpseNeedles, undefined)
        assert.equal(removed.piles.length, 1)
        assert.equal(removed.piles[0].corpsePinBundle.id, pins)
        cases.push({ width, side, mode })
      }
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Book and loan corpse control UI passed: ${cases.length} cases.\n`)
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
