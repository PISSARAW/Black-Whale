import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.FORTUNE_CHECK_OUTPUT ?? '/tmp/black-whale-fortunes-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-fortunes/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-fortunes/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.fortuneFixture)
  await page.waitForSelector('canvas')
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const { side, mode } of ['person', 'portrait'].flatMap((mode) =>
      ['player', 'opponent'].map((side) => ({ side, mode })),
    )) {
      await page.evaluate(({ side, mode }) => window.fortuneFixture.prepare(mode, side), {
        side,
        mode,
      })
      const before = await page.evaluate(() => window.fortuneFixture.snapshot())
      await page
        .getByRole('button', {
          name: 'Lovely Ghostwriter · Écrire le mois du participant',
          exact: true,
        })
        .click()
      const working = await page.evaluate(() => window.fortuneFixture.snapshot())
      assert.equal(working.caster.ghostwriterWriting.frames, 90)
      assert.equal(working.caster.aura, before.caster.aura - 12)
      assert.equal(working.caster.documentReading, undefined)
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
        .screenshot({ path: path.join(output, `fortune-${mode}-${side}-${width}.png`) })
      await page.evaluate(() => window.fortuneFixture.advance(92))
      const written = await page.evaluate(() => window.fortuneFixture.snapshot())
      assert.equal(written.caster.ghostwriterWriting, undefined)
      assert.equal(written.sheet.document.fortuneWritten.weeks, 4)
      assert.equal(written.caster.documentReading, undefined)
      assert.deepEqual(written.health, before.health)
      assert.deepEqual(written.score, before.score)
      await page
        .getByRole('button', { name: 'Papier · Lire la feuille du participant', exact: true })
        .and(page.locator('button:enabled'))
        .click()
      const read = await page.evaluate(() => window.fortuneFixture.snapshot())
      assert.ok(read.caster.documentReading.text.includes('Au seuil du quai'))
      assert.ok(read.caster.documentReading.text.includes('Le mois s’achève'))
      assert.equal(
        await page
          .locator('.paper-reading')
          .evaluate((element) => getComputedStyle(element).whiteSpace),
        'pre-wrap',
      )
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      cases.push({ width, side, mode })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Lovely Ghostwriter UI passed: ${cases.length} cases.\n`)
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
