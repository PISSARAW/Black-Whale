import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.SUN_MOON_CHECK_OUTPUT ?? '/tmp/black-whale-sun-moon-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-sun-moon/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-sun-moon/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.sunMoonFixture)
  await page.waitForSelector('canvas')
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const side of ['player', 'opponent'])
      for (const moon of [false, true]) {
        await page.evaluate(({ side, moon }) => window.sunMoonFixture.prepare(side, moon), {
          side,
          moon,
        })
        const name = `${moon ? 'Lune' : 'Soleil'} · charger cinq secondes · Caisse (34)`
        await page.getByRole('button', { name, exact: true }).click()
        let state = await page.evaluate(() => window.sunMoonFixture.snapshot())
        assert.equal(state.actor.aura, 88)
        assert.equal(state.pending.frames, 300)
        await page.evaluate(() => window.sunMoonFixture.advance(150))
        state = await page.evaluate(() => window.sunMoonFixture.snapshot())
        assert.equal(state.crate.arena[moon ? 'moonCharge' : 'sunCharge'], 150)
        await page
          .getByRole('button', { name: 'Relâcher le contact · 2.5 / 5 s', exact: true })
          .waitFor()
        await page.waitForSelector('.fight-scene.ready')
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        )
        await page.locator('.arena').screenshot({
          path: path.join(output, `charge-${side}-${moon ? 'moon' : 'sun'}-${width}.png`),
        })
        await page
          .getByRole('button', { name: 'Relâcher le contact · 2.5 / 5 s', exact: true })
          .click()
        state = await page.evaluate(() => window.sunMoonFixture.snapshot())
        assert.equal(state.pending, undefined)
        assert.equal(state.actor.arenaRecovery, 0)
        assert.equal(state.crate.arena[moon ? 'moonCharge' : 'sunCharge'], 150)
        await page.evaluate(({ side, moon }) => window.sunMoonFixture.prepare(side, moon), {
          side,
          moon,
        })
        await page.getByRole('button', { name, exact: true }).click()
        await page.evaluate(() => window.sunMoonFixture.advance(300))
        state = await page.evaluate(() => window.sunMoonFixture.snapshot())
        assert.equal(state.crate.arena[moon ? 'moonCharge' : 'sunCharge'], 300)
        assert.equal(state.pending, undefined)
        const point = state.crate.arena[moon ? 'moonPoint' : 'sunPoint']
        assert.deepEqual(point, { x: -3, y: 8 })
        await page
          .locator('.arsenal')
          .nth(side === 'player' ? 0 : 1)
          .getByRole('button', { name: 'Retourner la caisse (34)', exact: true })
          .click()
        state = await page.evaluate(() => window.sunMoonFixture.snapshot())
        assert.equal(state.crate.arena.facing, -1)
        assert.deepEqual(state.crate.arena[moon ? 'moonPoint' : 'sunPoint'], point)
        await page
          .locator('.arena')
          .screenshot({
            path: path.join(output, `turned-${side}-${moon ? 'moon' : 'sun'}-${width}.png`),
          })
        cases.push({ width, side, mark: moon ? 'moon' : 'sun', fullContact: 300, turned: true })
      }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Sun and Moon UI passed: ${cases.length} cases.\n`)
} catch (error) {
  await writeFile(
    path.join(output, 'failure.json'),
    JSON.stringify({ errors, cases, message: String(error) }, null, 2),
  )
  await page?.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {})
  throw error
} finally {
  await browser?.close()
  await server.close()
}
