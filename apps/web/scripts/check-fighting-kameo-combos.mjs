import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.KAMEO_COMBO_OUTPUT ?? '/tmp/black-whale-kameo-combos'
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
  const lessons = [
    'Luzurus · prolonger au sol',
    'Zhang Lei · renforcer la rafale',
    'Marayam · couvrir la récupération',
    'Tubeppa · soigner pendant le combo',
    'Morena · affaiblir pendant le combo',
    'Salé-salé · couvrir la zone',
  ]
  for (const corner of [false, true])
    for (const mirrored of [false, true])
      for (const [index, title] of lessons.entries()) {
        const catalog = page.getByText(/École de combat ·|Combat school ·/).first()
        if (!(await catalog.evaluate((el) => el.parentElement.open))) await catalog.click()
        await page
          .getByLabel('Position du combo kaméo', { exact: true })
          .selectOption(corner ? 'corner' : 'centre')
        await page.getByRole('button', { name: `Démontrer · ${title}`, exact: true }).click()
        await page.evaluate((mirror) => window.kameoComboFixture.advance(42, mirror), mirrored)
        if (!mirrored && !corner) {
          await page.locator('.arena').scrollIntoViewIfNeeded()
          await page.screenshot({ path: path.join(output, `${index}-support.png`) })
        }
        await page.evaluate(() => window.kameoComboFixture.advance(140))
        const { state, progress } = await page.evaluate(() => window.kameoComboFixture.snapshot())
        assert.equal(progress.complete, true, JSON.stringify({ title, corner, mirrored, progress }))
        assert.equal(progress.failed, false)
        assert.equal(progress.supportLanded, true)
        assert.equal(state.impact.comboHits, index === 0 ? 3 : 12)
        results.push({
          id: progress.id,
          corner,
          mirrored,
          hits: state.impact.comboHits,
          frame: state.frame,
          supportAura: state.kameos.player.fighter.aura,
        })
        process.stdout.write(
          `${progress.id} ${corner ? 'corner' : 'centre'} ${mirrored ? 'left' : 'right'} OK\n`,
        )
      }
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
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ results, errors }, null, 2))
} finally {
  await browser.close()
  await server.close()
}
