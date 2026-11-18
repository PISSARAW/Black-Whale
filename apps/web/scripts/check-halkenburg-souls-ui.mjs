import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.HALKENBURG_SOUL_CHECK_OUTPUT ?? '/tmp/black-whale-halkenburg-souls-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-souls/index.html'] },
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
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-souls/`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForFunction(() => window.soulFixture)
  await page.waitForSelector('canvas')
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const side of ['player', 'opponent']) {
      for (const mode of ['supporter', 'halkenburg']) {
        await page.evaluate(({ mode, side }) => window.soulFixture.prepare(mode, side), {
          mode,
          side,
        })
        const initial = await page.evaluate(() => window.soulFixture.snapshot())
        await page.getByRole('button', { name: 'Tirer la flèche', exact: true }).click()
        await page.evaluate(() => window.soulFixture.advance(100))
        const before = await page.evaluate(() => window.soulFixture.snapshot())
        assert.equal(before.host.health, initial.host.health)
        assert.equal(before.host.soul.donor.kind, mode === 'supporter' ? 'supporter' : 'fighter')
        assert.equal(before.host.id, 'hisoka')
        assert.equal(before.sleepers.length, mode === 'supporter' ? 1 : 0)
        assert.equal(Boolean(before.source.sleeping), mode === 'halkenburg')
        const name =
          side === 'player'
            ? 'Conscience transférée · Marcher à droite'
            : 'Conscience transférée · Marcher à gauche'
        await page.getByRole('button', { name, exact: true }).click()
        await page.evaluate(() => window.soulFixture.advance(6))
        const moved = await page.evaluate(() => window.soulFixture.snapshot())
        assert.ok((moved.host.x - before.host.x) * (side === 'player' ? 1 : -1) > 0)
        assert.equal(moved.source.x, before.source.x)
        assert.equal(moved.host.health, before.host.health)
        await page
          .getByRole('button', { name: 'Conscience transférée · Rester sur place', exact: true })
          .click()
        const held = await page.evaluate(() => window.soulFixture.snapshot())
        await page.evaluate(() => window.soulFixture.advance(180))
        const later = await page.evaluate(() => window.soulFixture.snapshot())
        assert.equal(later.host.x, held.host.x)
        assert.equal(later.host.soul.id, before.host.soul.id)
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
        cases.push({ width, side, mode })
      }
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Halkenburg soul exchange UI passed: ${cases.length} cases.\n`)
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
