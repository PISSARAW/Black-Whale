import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.KALLUTO_GATHER_OUTPUT ?? '/tmp/black-whale-kalluto-gather-ui'
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
    await page.evaluate(() => window.preparationFixture.prepareKallutoGather())
    const initial = await page.evaluate(() => window.preparationFixture.snapshot())
    const pickup = page
      .getByRole('button', { name: 'Papier · Ranger les confettis à portée', exact: true })
      .and(page.locator(':enabled'))
      .first()
    await pickup.press('Enter')
    const packed = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(packed.paperKit.confetti.length, 1)
    assert.equal(packed.scatters.length, initial.scatters.length - 1)
    const storedId = packed.paperKit.confetti[0].id
    assert.ok(initial.scatters.some((entry) => entry.id === storedId))
    assert.equal(packed.paperKit.markers, initial.paperKit.markers)
    assert.equal(packed.paperKit.salvos, 0)
    assert.ok(
      await page.getByText('Confettis rangés réutilisables · 1', { exact: true }).isVisible(),
    )
    await page
      .getByRole('button', { name: 'Papier · Déposer éventail et réserve', exact: true })
      .press('Enter')
    const dropped = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(dropped.paperKit, undefined)
    assert.equal(
      dropped.battlefield.entities.find((entry) => entry.id === initial.paperKit.sourceId).paperKit
        .confetti[0].id,
      storedId,
    )
    await page
      .getByRole('button', { name: 'Papier · Prendre le matériel présent', exact: true })
      .first()
      .press('Enter')
    await page.evaluate(() => window.preparationFixture.reuseKallutoPaper())
    const reused = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(reused.paperKit.confetti.length, 0)
    assert.equal(reused.paperKit.salvos, 0)
    assert.deepEqual(
      reused.scatters.map((entry) => entry.id).sort(),
      initial.scatters.map((entry) => entry.id).sort(),
    )
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `gather-${width}.png`), fullPage: false })
    cases.push({ width })
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Kalluto physical gathering UI passed: ${cases.length} cases.\n`)
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
