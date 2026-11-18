import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output =
  process.env.HALKENBURG_VARIANT_CHECK_OUTPUT ?? '/tmp/black-whale-halkenburg-variant-ui'
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
  server: { host: '127.0.0.1', port: 0 },
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
    await page.evaluate(() => window.preparationFixture.prepareHalkenburgScenario())
    const variant = page.getByRole('checkbox', {
      name: 'Variante hors canon : Halkenburg prend un corps aléatoire du roster',
      exact: true,
    })
    assert.equal(await variant.isChecked(), false)
    assert.equal(
      await page
        .getByRole('button', {
          name: 'Halkenburg · Transfert dans un corps du roster',
          exact: true,
        })
        .count(),
      0,
    )
    await page.getByRole('button', { name: 'Activer L', exact: true }).click()
    await page.evaluate(() => window.preparationFixture.advance(40))
    const struck = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(struck.casterId, 'halkenburg')
    assert.ok(struck.possession > 0)
    assert.equal(struck.rosterVariant, false)
    assert.equal(struck.halkenburgOrigin, undefined)
    await variant.check()
    await page.evaluate(() => window.preparationFixture.advance(480))
    await page
      .getByRole('button', {
        name: 'Halkenburg · Transfert dans un corps du roster',
        exact: true,
      })
      .click()
    const transferred = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(transferred.rosterVariant, true)
    assert.equal(transferred.halkenburgOrigin, 'halkenburg')
    assert.notEqual(transferred.casterId, 'halkenburg')
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({
      path: path.join(output, `halkenburg-variant-${width}.png`),
      fullPage: false,
    })
    cases.push({ width })
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Halkenburg scenario UI passed: ${cases.length} cases.\n`)
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
