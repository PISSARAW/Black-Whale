import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output =
  process.env.PHYSICAL_RESOURCES_CHECK_OUTPUT ?? '/tmp/black-whale-physical-resources-ui'
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
      await page.evaluate((side) => window.preparationFixture.prepareIllumiFace(side, true), side)
      await page.getByRole('button', { name: 'Combat scénarisé', exact: true }).click()
      assert.ok(await page.getByLabel('Cadavres réels à implanter', { exact: true }).isChecked())
      assert.ok(await page.getByLabel('Otages déjà retenus', { exact: true }).isChecked())
      const before = await page.evaluate(() => window.preparationFixture.snapshot())
      const corpse = before.battlefield.entities.find((entry) => entry.id === `${side}:corpse`)
      assert.equal(corpse.material, 'real')
      assert.equal(corpse.controller, undefined)
      await page
        .locator('button:not([disabled])')
        .filter({ hasText: /^Illumi · Implanter un cadavre réel$/ })
        .click()
      await page.evaluate(() => window.preparationFixture.advance(60))
      const controlled = await page.evaluate(() => window.preparationFixture.snapshot())
      assert.equal(
        controlled.battlefield.entities.find((entry) => entry.id === corpse.id).controller.side,
        side,
      )
      await page
        .getByRole('button', { name: 'Illumi · Faire parler le cadavre', exact: true })
        .click()
      assert.ok(await page.getByText(/Je vais bien. Tout est sous contrôle./).count())
      await page
        .getByRole('button', { name: 'Illumi · Retirer les aiguilles du cadavre', exact: true })
        .click()
      await page
        .getByRole('button', { name: `Rendre l’otage · ${side}:hostage`, exact: true })
        .click()
      const released = await page.evaluate(() => window.preparationFixture.snapshot())
      assert.equal(
        released.battlefield.entities.find((entry) => entry.id === corpse.id).controller,
        undefined,
      )
      const hostage = released.battlefield.entities.find((entry) => entry.id === `${side}:hostage`)
      assert.equal(hostage.present, true)
      assert.equal(hostage.captiveOf, undefined)
      assert.equal(typeof hostage.releasedAt, 'number')
      await page.waitForSelector('.fight-scene.ready')
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page.screenshot({
        path: path.join(output, `resources-${side}-${width}.png`),
        fullPage: true,
      })
      await page.getByRole('button', { name: 'Duel · équipement personnel', exact: true }).click()
      const strict = await page.evaluate(() => window.preparationFixture.snapshot())
      assert.equal(strict.battlefield.entities.length, 0)
      cases.push({ width, side })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Physical resources UI passed: ${cases.length} cases.\n`)
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
