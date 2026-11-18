import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.HISOKA_MIXED_OUTPUT ?? '/tmp/black-whale-hisoka-mixed-ui'
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
    for (const mode of ['book-texture', 'loan-texture']) {
      await page.evaluate((value) => window.preparationFixture.prepareMixedHisoka(value), mode)
      const before = await page.evaluate(() => window.preparationFixture.snapshot())
      await page
        .getByRole('button', {
          name: mode === 'book-texture' ? 'Page · Texture Surprise' : 'Page · Attache Bungee Gum',
          exact: true,
        })
        .press('Enter')
      await page.evaluate(() => window.preparationFixture.advance(45))
      const after = await page.evaluate(() => window.preparationFixture.snapshot())
      assert.equal(after.texture.source, mode === 'book-texture' ? 'book' : 'dolphin')
      assert.equal(after.gumNetwork.links.length, 1)
      assert.equal(after.gumNetwork.links[0].source, mode === 'book-texture' ? 'dolphin' : 'book')
      assert.equal(after.donorAura, before.donorAura)
      assert.ok(after.aura < before.aura)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page.screenshot({ path: path.join(output, `${mode}-${width}.png`), fullPage: false })
      cases.push({ width, mode })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Hisoka mixed Nen channels UI passed: ${cases.length} cases.\n`)
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
