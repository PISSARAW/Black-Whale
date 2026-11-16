import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.PREPARATION_CHECK_OUTPUT ?? '/tmp/black-whale-preparation-ui'
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
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1100, height: 1200 }, hasTouch: true })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-preparation/`,
  )
  await page.waitForFunction(() => window.preparationFixture)
  await page.waitForSelector('canvas')
  const snapshot = () => page.evaluate(() => window.preparationFixture.snapshot())
  assert.equal(await page.getByRole('button', { name: 'Activer L' }).isDisabled(), true)
  await page.getByRole('button', { name: 'Combat scénarisé', exact: true }).click()
  await page.getByRole('button', { name: 'Activer L' }).click()
  assert.equal(
    (await snapshot()).battlefield.entities.find((entry) => entry.id === 'player:seed').growth,
    1,
  )
  await page.screenshot({ path: path.join(output, 'prepared-scene.png'), fullPage: true })
  await page.evaluate(() => window.preparationFixture.renderCase('sayird', ['animals']))
  await page.getByRole('button', { name: 'Activer L' }).click()
  assert.equal(
    (await snapshot()).battlefield.entities.filter((entry) => entry.controller).length,
    1,
  )
  await page.evaluate(() =>
    window.preparationFixture.renderCase('halkenburg', ['objects', 'rooms']),
  )
  await page.evaluate(() => window.preparationFixture.advance(480))
  await page.getByRole('button', { name: 'Activer L' }).click()
  assert.equal((await snapshot()).nocked, 1)
  await page.screenshot({ path: path.join(output, 'cohort.png'), fullPage: true })
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => window.preparationFixture.renderCase('chrollo', ['flutes'], true))
    assert.equal(await page.getByRole('button', { name: 'Activer L' }).isDisabled(), true)
    if (width === 390) await page.getByRole('button', { name: '6 Flûte', exact: true }).tap()
    else await page.keyboard.press('6')
    assert.ok((await snapshot()).equipment.includes('flute'))
    await page.getByRole('button', { name: 'Activer L' }).click()
    assert.equal((await snapshot()).music, true)
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({
      path: path.join(output, `borrowed-flute-${width}.png`),
      fullPage: true,
    })
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, widths: [1100, 390, 320], errors }, null, 2),
  )
  process.stdout.write(`Preparation UI passed: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
