import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.GUM_ANCHORS_CHECK_OUTPUT ?? '/tmp/black-whale-gum-anchors-ui'
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
    await page.evaluate(() => window.preparationFixture.prepareGumObjectAnchors())
    const initial = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(initial.gumAnchors.length, 2)
    await page
      .getByRole('button', { name: 'Bungee Gum · Fil 1 · Tirer le support vers soi', exact: true })
      .click()
    await page.evaluate(() => window.preparationFixture.advance(10))
    const pulled = await page.evaluate(() => window.preparationFixture.snapshot())
    const first = pulled.battlefield.entities.find((entry) => entry.id === 'arena:crate:34')
    assert.ok(first.x > 34)
    assert.equal(pulled.battlefield.entities.find((entry) => entry.id === 'arena:crate:66').x, 66)
    assert.equal(pulled.gumAnchors.length, 2)
    await page
      .getByRole('button', { name: 'Bungee Gum · Fil 1 · Se tirer vers le support', exact: true })
      .click()
    await page.evaluate(() => window.preparationFixture.advance(10))
    const reeled = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.ok(reeled.playerX < initial.playerX)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({
      path: path.join(output, `gum-anchors-${width}.png`),
      fullPage: true,
      timeout: 60000,
    })
    await page
      .getByRole('button', { name: 'Bungee Gum · Fil 1 · Détacher ce fil', exact: true })
      .click()
    const released = await page.evaluate(() => window.preparationFixture.snapshot())
    assert.equal(released.gumAnchors.length, 1)
    assert.equal(released.gumAnchors[0].objectId, 'arena:crate:66')
    assert.equal(
      released.battlefield.entities.find((entry) => entry.id === 'arena:crate:34').x,
      first.x,
    )
    cases.push({ width })
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Gum anchors UI passed: ${cases.length} cases.\n`)
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
