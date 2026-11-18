import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output =
  process.env.SECRET_WINDOW_CHECK_OUTPUT ?? '/tmp/black-whale-secret-window-listening-ui'
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
const fighters = process.env.SECRET_WINDOW_CHECK_FIGHTERS?.split(',').filter(Boolean) ?? [
  'musse',
  'benjamin',
]
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
  for (const id of fighters) {
    for (const width of [1100, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.evaluate((id) => window.preparationFixture.prepareMusseListening(id), id)
      await page
        .getByRole('button', { name: 'Secret Window : écoute par le hibou d’épaule', exact: true })
        .click()
      await page.evaluate(() => window.preparationFixture.advance(35))
      assert.ok((await page.evaluate(() => window.preparationFixture.snapshot())).listening)
      await page.evaluate(() => window.preparationFixture.speakToOwl())
      assert.equal(
        (await page.evaluate(() => window.preparationFixture.snapshot())).listening.heard.text,
        'Nous attendons derrière la porte.',
      )
      assert.ok(
        await page.getByText('Nous attendons derrière la porte.', { exact: true }).isVisible(),
      )
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page.screenshot({
        path: path.join(output, `${id}-${width}.png`),
        fullPage: true,
        timeout: 60000,
      })
      await page
        .getByRole('button', { name: 'Secret Window : arrêter l’écoute', exact: true })
        .click()
      assert.equal(
        (await page.evaluate(() => window.preparationFixture.snapshot())).listening,
        undefined,
      )
      cases.push({ id, width })
    }
  }
  if (process.env.SECRET_WINDOW_CHECK_ARCHIVE !== '0') {
    await page.evaluate(() => window.preparationFixture.prepareMusseListening('benjamin'))
    assert.ok(
      await page
        .getByRole('button', { name: 'Secret Window · Relecture de Musse', exact: true })
        .isDisabled(),
    )
    for (const width of [1100, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.evaluate(() => window.preparationFixture.prepareMusseArchive())
      const first = 'Camilla est immobile après les tirs de Musse.'
      const last = 'La dernière vision de Musse s’interrompt avant sa mort.'
      await page
        .getByRole('button', { name: `Secret Window · Revoir : ${last}`, exact: true })
        .click()
      assert.equal(
        (await page.evaluate(() => window.preparationFixture.snapshot())).archive.cursor,
        2,
      )
      await page
        .getByRole('button', { name: `Secret Window · Revoir : ${first}`, exact: true })
        .click()
      assert.equal(
        (await page.evaluate(() => window.preparationFixture.snapshot())).archive.cursor,
        0,
      )
      assert.ok(await page.getByText(first, { exact: true }).isVisible())
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page.screenshot({
        path: path.join(output, `archive-${width}.png`),
        fullPage: true,
        timeout: 60000,
      })
      await page
        .getByRole('button', { name: 'Secret Window · Fermer la relecture', exact: true })
        .click()
      assert.equal(
        (await page.evaluate(() => window.preparationFixture.snapshot())).archive.cursor,
        undefined,
      )
      await page.evaluate(() => window.preparationFixture.advance(1))
      await page.evaluate(() => window.preparationFixture.speakToOwl())
      const recorded = (await page.evaluate(() => window.preparationFixture.snapshot())).archive
        .observed
      assert.ok(recorded.length >= 2)
      await page
        .getByRole('button', { name: 'Secret Window · Revoir la dernière vue reçue', exact: true })
        .click()
      assert.equal(
        (await page.evaluate(() => window.preparationFixture.snapshot())).archive.observedCursor,
        recorded.at(-1).id,
      )
      assert.ok(
        await page
          .locator('.musse-archive')
          .getByText('« Nous attendons derrière la porte. »', { exact: true })
          .isVisible(),
      )
      await page
        .getByRole('button', { name: 'Secret Window · Vue reçue précédente', exact: true })
        .click()
      assert.equal(
        (await page.evaluate(() => window.preparationFixture.snapshot())).archive.observedCursor,
        recorded.at(-2).id,
      )
      assert.equal(
        await page
          .locator('.musse-archive')
          .getByText('« Nous attendons derrière la porte. »', { exact: true })
          .count(),
        0,
      )
      await page.screenshot({
        path: path.join(output, `recorded-${width}.png`),
        fullPage: true,
        timeout: 60000,
      })
      cases.push({ id: 'benjamin-archive', width })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Secret Window UI passed: ${cases.length} cases.\n`)
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
