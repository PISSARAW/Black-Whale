import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.HISOKA_PROSTHESES_OUTPUT ?? '/tmp/black-whale-hisoka-surfaces-ui'
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
      await page.evaluate(
        (value) => window.preparationFixture.prepareHisokaProstheses(value, 'face-and-neck'),
        side,
      )
      await page.waitForSelector('.fight-scene.ready')
      const snapshot = () =>
        page.evaluate((value) => window.preparationFixture.prosthesisSnapshot(value), side)
      const before = await snapshot()
      const checkbox = page.getByRole('checkbox', {
        name: new RegExp(`^P${side === 'player' ? 1 : 2} : tissus superficiels`),
      })
      assert.equal(await checkbox.isChecked(), true)
      const capture = async (name) => {
        if (width === 1100) {
          await page.locator('.arena').scrollIntoViewIfNeeded()
          await page.evaluate(
            () =>
              new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
          )
          await page
            .locator('.arena')
            .screenshot({ path: path.join(output, `${side}-${name}.png`) })
        }
      }
      await capture('injured')
      await page
        .getByRole('button', { name: 'Bungee Gum · Former les prothèses', exact: true })
        .press('Enter')
      await page.evaluate(() => window.preparationFixture.advance(30))
      const formed = await snapshot()
      assert.deepEqual(formed.rubber.parts, ['facial-surface', 'neck-surface'])
      assert.equal(formed.rubber.source, 'personal')
      assert.deepEqual(formed.damage, before.damage)
      assert.equal(formed.health, 37)
      assert.ok(formed.aura < before.aura)
      await capture('rubber')
      await page
        .getByRole('button', { name: 'Texture Surprise · Choisir les prothèses', exact: true })
        .press('Enter')
      await page
        .getByRole('button', {
          name: 'Texture Surprise · Appliquer sur le support choisi',
          exact: true,
        })
        .press('Enter')
      await page.evaluate(() => window.preparationFixture.advance(45))
      const masked = await snapshot()
      assert.equal(masked.skin.surface, 'gum-prostheses')
      assert.equal(masked.skin.supportId, formed.rubber.id)
      assert.equal(masked.health, 37)
      await capture('skin')
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page
        .getByRole('button', { name: 'Bungee Gum · Retirer les prothèses', exact: true })
        .press('Enter')
      await page.evaluate(() => window.preparationFixture.advance(1))
      const removed = await snapshot()
      assert.equal(removed.rubber, undefined)
      assert.equal(removed.skin, undefined)
      assert.equal(removed.health, 37)
      assert.deepEqual(removed.damage, before.damage)
      cases.push({ width, side })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Hisoka surface repair UI passed: ${cases.length} cases.\n`)
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
