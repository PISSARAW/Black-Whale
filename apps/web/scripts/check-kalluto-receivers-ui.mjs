import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.KALLUTO_CHECK_OUTPUT ?? '/tmp/black-whale-kalluto-receivers-ui'
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
    await page.evaluate(() => window.preparationFixture.prepareKallutoReceivers())
    const initial = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(initial.dolls.length, 2)
    assert.equal(initial.paperKit.markers, 10)
    assert.equal(initial.paperKit.sheets, 4)
    assert.equal(initial.scatters.length, 6)
    await page.evaluate(() => window.preparationFixture.reuseKallutoPaper())
    const reused = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(reused.scatters.length, 6)
    assert.deepEqual(
      reused.scatters.map((entry) => entry.id),
      initial.scatters.map((entry) => entry.id),
    )
    assert.equal(reused.paperKit.salvos, initial.paperKit.salvos)
    assert.ok(await page.getByText('Papier dispersé réutilisable · 6', { exact: true }).isVisible())
    assert.deepEqual(
      initial.dolls.map((doll) => doll.targetMember),
      [0, 1],
    )
    const receivers = page.locator('.paper-receivers')
    assert.equal(await receivers.locator('p').count(), 2)
    assert.ok(
      await receivers.getByText('« Paroles près du premier papier. »', { exact: true }).isVisible(),
    )
    assert.ok(
      await receivers
        .getByText('« Paroles près du deuxième papier. »', { exact: true })
        .isVisible(),
    )
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({
      path: path.join(output, `kalluto-${width}.png`),
      fullPage: false,
      timeout: 60000,
    })
    await page
      .getByRole('button', { name: 'Papier · Arrêter l’écoute des poupées', exact: true })
      .press('Enter')
    const stopped = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(stopped.dolls.length, 2)
    assert.ok(stopped.dolls.every((doll) => doll.active === false))
    assert.equal(await receivers.getByText('Écoute interrompue', { exact: true }).count(), 2)
    assert.equal(stopped.dolls[0].heard.text, initial.dolls[0].heard.text)
    await page
      .getByRole('button', { name: 'Papier · Déposer éventail et réserve', exact: true })
      .press('Enter')
    assert.equal(
      (await page.evaluate(() => window.preparationFixture.snapshot())).paperKit,
      undefined,
    )
    await page
      .getByRole('button', { name: 'Papier · Prendre le matériel présent', exact: true })
      .first()
      .press('Enter')
    const picked = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(picked.paperKit.sourceId, initial.paperKit.sourceId)
    assert.equal(picked.paperKit.markers, 10)
    assert.equal(picked.paperKit.sheets, 4)
    cases.push({ width })
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Kalluto receivers UI passed: ${cases.length} cases.\n`)
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
