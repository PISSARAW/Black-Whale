import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.KAMEO_COMBO_OUTPUT ?? path.join(root, 'output/kameo-roster/chrome')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: ['ui-tests/fighting-kameo-combos/index.html'],
    holdUntilCrawlEnd: false,
  },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'],
})
const errors = [],
  results = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } })
  page.setDefaultTimeout(60000)
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-kameo-combos/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => Boolean(window.kameoComboFixture))
  const catalogue = await page.evaluate(() => window.kameoComboFixture.catalogue())
  assert.equal(catalogue.length, 240)
  const fighters = [...new Set(catalogue.map((route) => route.fighter))]
  assert.equal(fighters.length, 40)
  const timings = [],
    windows = []
  for (const [index, fighter] of fighters.entries()) {
    const measured = await page.evaluate((id) => window.kameoComboFixture.measure(id), fighter)
    const finishes = await page.evaluate(
      (id) => window.kameoComboFixture.finishWindows(id),
      fighter,
    )
    for (const result of measured.filter((row) => row.callDelay === 0))
      assert.equal(result.guaranteed, true, JSON.stringify(result))
    for (const result of measured.filter(
      (row) => row.callDelay === 60 && row.id.endsWith('kameo-luzurus'),
    )) {
      assert.equal(result.guaranteed, false, JSON.stringify(result))
      assert.ok(result.defenderCanActAt > result.firstHitAt)
      if (result.response === 'jab')
        assert.ok(result.replyHitAt > result.replySentAt, JSON.stringify(result))
    }
    timings.push(...measured)
    windows.push(...finishes)
    const selected = catalogue.filter(
      (route) =>
        route.fighter === fighter &&
        (route.id.endsWith('kameo-luzurus') || index === 0 || fighter === 'franklin'),
    )
    for (const corner of [false, true])
      for (const route of selected) {
        await page.setViewportSize(
          index % 7 === 0 ? { width: 390, height: 844 } : { width: 1280, height: 960 },
        )
        await openCatalogue(page)
        await page.getByLabel('Personnage des exercices', { exact: true }).selectOption(fighter)
        await page
          .getByLabel('Position du combo kaméo', { exact: true })
          .selectOption(corner ? 'corner' : 'centre')
        await page
          .getByRole('button', { name: `Démontrer · ${route.title[0]}`, exact: true })
          .click()
        await page.evaluate(() => window.kameoComboFixture.advance(42))
        await page.locator('.arena').scrollIntoViewIfNeeded()
        if (route.id.endsWith('kameo-luzurus'))
          await page.screenshot({
            path: path.join(output, `${fighter}-${corner ? 'corner' : 'centre'}.png`),
          })
        await page.evaluate(() => window.kameoComboFixture.advance(200))
        const { state, progress } = await page.evaluate(() => window.kameoComboFixture.snapshot())
        assert.equal(progress.complete, true, JSON.stringify({ fighter, corner, progress }))
        assert.equal(progress.failed, false)
        assert.equal(progress.supportLanded, true)
        assert.equal(state.impact.comboHits, route.hits)
        results.push({ id: route.id, corner, hits: state.impact.comboHits, frame: state.frame })
      }
    await writeFile(
      path.join(output, 'timings.json'),
      JSON.stringify({ timings, windows }, null, 2),
    )
    process.stdout.write(
      `${fighter}: ${measured.length + finishes.length} timings, ${selected.length * 2} rendered exercises OK\n`,
    )
  }
  await page.setViewportSize({ width: 1280, height: 960 })
  await openCatalogue(page)
  await page.getByLabel('Personnage des exercices', { exact: true }).selectOption('hisoka')
  await page.evaluate(() => window.kameoComboFixture.english())
  const catalog = page.getByText(/Combat school ·/).first()
  if (!(await catalog.evaluate((el) => el.parentElement.open))) await catalog.click()
  await page
    .getByRole('button', { name: 'Demonstrate · Luzurus · grounded extension', exact: true })
    .click()
  await page.evaluate(() => window.kameoComboFixture.advance(140))
  await page.getByText('Exercise complete!', { exact: true }).waitFor()
  if (!(await catalog.evaluate((el) => el.parentElement.open))) await catalog.click()
  await page
    .getByRole('button', { name: 'Practice · Luzurus · grounded extension', exact: true })
    .click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => window.kameoComboFixture.strike())
  await page.evaluate(() => window.kameoComboFixture.advance(3))
  assert.ok((await page.evaluate(() => window.kameoComboFixture.snapshot())).state.hitstop > 0)
  const touchCall = page.getByRole('button', { name: 'Call kameo', exact: true })
  await touchCall.scrollIntoViewIfNeeded()
  const button = await touchCall.boundingBox()
  await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2)
  await page.mouse.down()
  await page.evaluate(() => window.kameoComboFixture.advance(1))
  assert.equal(
    (await page.evaluate(() => window.kameoComboFixture.snapshot())).state.kameos.player
      .bufferedCall,
    'neutral',
  )
  await page.mouse.up()
  await page.evaluate(() => window.kameoComboFixture.advance(8))
  assert.equal(
    (await page.evaluate(() => window.kameoComboFixture.snapshot())).state.kameos.player.phase,
    'entering',
  )
  await page.locator('.arena').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(output, 'touch-call.png') })
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ results, scenarios: timings.length + windows.length, errors }, null, 2),
  )
} finally {
  await browser.close()
  await server.close()
}

async function openCatalogue(page) {
  const catalog = page.getByText(/École de combat ·|Combat school ·/).first()
  if (!(await catalog.evaluate((el) => el.parentElement.open))) await catalog.click()
}
