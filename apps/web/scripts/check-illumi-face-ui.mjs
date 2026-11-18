import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.ILLUMI_FACE_OUTPUT ?? '/tmp/black-whale-illumi-face-ui'
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
  page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
  page.setDefaultTimeout(60000)
  page.setDefaultNavigationTimeout(60000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-preparation/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.preparationFixture)
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const side of ['player', 'opponent']) {
      for (const pinned of [false, true]) {
        await page.evaluate(
          ({ side, pinned }) => window.preparationFixture.prepareIllumiFace(side, pinned),
          { side, pinned },
        )
        await page.waitForSelector('.fight-scene.ready')
        const panel = page
          .getByRole('region', { name: 'Arsenal rétrospectif' })
          .nth(side === 'player' ? 0 : 1)
        const press = (name) => panel.getByRole('button', { name, exact: true }).press('Enter')
        const snapshot = () =>
          page.evaluate((side) => window.preparationFixture.illumiFaceState(side), side)
        const before = await snapshot()
        await press(
          pinned
            ? 'Illumi · Gittarackur avec aiguilles'
            : 'Illumi · Visage d’Hisoka sans aiguilles',
        )
        await press('Illumi · Exécuter le remodelage du visage')
        assert.equal((await snapshot()).face.preparation, 30)
        await page.evaluate(() => window.preparationFixture.advance(35))
        const disguised = await snapshot()
        assert.equal(disguised.id, 'illumi')
        assert.equal(disguised.face.disguised, true)
        assert.equal(disguised.face.disguiseMode, pinned ? 'pinned-gittarackur' : 'unpinned-hisoka')
        assert.equal(disguised.face.disguiseOrigin.source, 'personal')
        assert.deepEqual(disguised.equipment, before.equipment)
        assert.equal(disguised.health, before.health)
        if (width === 1100) {
          await page.locator('.arena').scrollIntoViewIfNeeded()
          await page.evaluate(
            () =>
              new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
          )
          await page.locator('.arena').screenshot({
            path: path.join(output, `${side}-${pinned ? 'pinned' : 'unpinned'}.png`),
          })
        }
        await press(
          pinned
            ? 'Illumi · Retirer les aiguilles du visage'
            : 'Illumi · Exécuter le remodelage du visage',
        )
        assert.equal((await snapshot()).face.disguised, false)
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        )
        cases.push({ width, side, pinned })
      }
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Illumi face UI passed: ${cases.length} cases.\n`)
} catch (error) {
  await writeFile(
    path.join(output, 'failure.json'),
    JSON.stringify({ cases, errors, message: String(error) }, null, 2),
  )
  if (page)
    await page
      .screenshot({ path: path.join(output, 'failure.png'), fullPage: false })
      .catch(() => {})
  throw error
} finally {
  await browser?.close()
  await server.close()
}
