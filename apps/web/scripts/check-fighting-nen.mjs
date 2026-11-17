import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.NEN_CHECK_OUTPUT ?? '/tmp/black-whale-nen-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-nen/index.html'] },
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
let browser
const errors = []
try {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-nen/`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })
  await page.waitForFunction(() => window.nenFixture)
  await page.waitForSelector('canvas')
  const snapshot = () => page.evaluate(() => window.nenFixture.snapshot())
  await page.keyboard.down('r')
  assert.equal((await snapshot()).nen.en.radius, 20)
  await page.evaluate(() => window.nenFixture.advance(60))
  assert.ok((await snapshot()).aura < 90)
  await page.screenshot({ path: path.join(output, 'en-desktop.png'), fullPage: true })
  await page.keyboard.up('r')
  assert.equal((await snapshot()).nen.en, null)
  for (const [key, field] of [
    ['f', 'shu'],
    ['x', 'in'],
    ['g', 'gyo'],
  ]) {
    await page.keyboard.down(key)
    assert.ok((await snapshot()).nen[field])
    await page.keyboard.up(key)
  }
  await page.keyboard.down('3')
  assert.equal((await snapshot()).nen.ryu.hands, 0.76)
  await page.keyboard.up('3')
  await page.keyboard.down('[')
  assert.equal((await snapshot()).opponentNen.en.radius, 20)
  await page.keyboard.up('[')
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => window.nenFixture.renderCase('hinrigh'))
    const en = page.locator('.tactics button').filter({ hasText: /^R\s+En$/ })
    await en.scrollIntoViewIfNeeded()
    await en.hover()
    await page.mouse.down()
    assert.equal((await snapshot()).nen.en.radius, 20)
    await page.mouse.up()
    assert.equal((await snapshot()).nen.en, null)
    await page.evaluate(() => window.nenFixture.renderCase('kurapika'))
    await page
      .locator('.tactics button')
      .filter({ hasText: /^R\s+En$/ })
      .isDisabled()
      .then((value) => assert.equal(value, true))
    await page.getByText('Mention du catalogue sans scène qualifiée', { exact: false }).waitFor()
    await page.keyboard.down('r')
    assert.equal((await snapshot()).nen.en, null)
    await page.keyboard.up('r')
    await page.getByRole('button', { name: 'AURA + H EMPEROR TIME' }).click()
    await page.getByText('Renforcement 100 %', { exact: true }).waitFor()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    )
    assert.equal(overflow, false)
    await page.screenshot({ path: path.join(output, `kurapika-${width}.png`), fullPage: true })
  }
  await page.evaluate(() => window.nenFixture.renderCase('phinks', 'en'))
  await page.getByText('Documented use, range unknown', { exact: false }).waitFor()
  await page.keyboard.down('r')
  assert.equal((await snapshot()).nen.en.radius, 12)
  await page.keyboard.up('r')
  await page.evaluate(() => window.nenFixture.renderCase('hisoka', 'en'))
  assert.equal(
    await page
      .locator('.tactics button')
      .filter({ hasText: /^R\s+En$/ })
      .isDisabled(),
    true,
  )
  await page.getByText('En not documented here', { exact: false }).waitFor()
  await page.setViewportSize({ width: 1200, height: 1200 })
  await page.evaluate(() => window.nenFixture.prepareReading())
  await page.getByText('Aura non inspectée', { exact: false }).waitFor()
  assert.equal(await page.getByLabel('Répartition adverse observée').count(), 0)
  await page.keyboard.down('g')
  await page.getByLabel('Répartition adverse observée').waitFor()
  assert.equal((await snapshot()).nen.mode, 'ren')
  await page.screenshot({ path: path.join(output, 'gyo-reading.png'), fullPage: true })
  await page.keyboard.down('3')
  assert.equal((await snapshot()).focus, 'hands')
  assert.equal((await snapshot()).nen.gyo, false)
  assert.equal((await snapshot()).nen.ryu.hands, 0.7)
  assert.equal(await page.getByLabel('Répartition adverse observée').count(), 0)
  await page.keyboard.up('3')
  await page.keyboard.down('s')
  assert.equal((await snapshot()).low, true)
  assert.equal((await snapshot()).nen.mode, 'ten')
  await page.keyboard.up('s')
  assert.equal((await snapshot()).low, undefined)
  await page.keyboard.down(' ')
  await page.keyboard.down('i')
  await page.keyboard.down('1')
  assert.equal((await snapshot()).nen.ko, 'head')
  const committed = (await snapshot()).aura
  await page.evaluate(() => window.nenFixture.advance(20))
  assert.ok(committed - (await snapshot()).aura < 3)
  await page.keyboard.up('1')
  await page.keyboard.up('i')
  await page.keyboard.up(' ')
  await page.keyboard.up('g')
  for (const [width, locale] of [
    [390, 'fr'],
    [320, 'en'],
  ]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate((lang) => window.nenFixture.renderCase('hinrigh', lang), locale)
    if (!(await page.locator('details.nen-guide').evaluate((node) => node.open)))
      await page.locator('details.nen-guide > summary').click()
    if (!(await page.locator('details.nen-arsenal').evaluate((node) => node.open)))
      await page.locator('details.nen-arsenal > summary').click()
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `advanced-nen-${width}.png`), fullPage: true })
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, widths: [1200, 390, 320], errors }, null, 2),
  )
  process.stdout.write(`Fighting Nen UI passed. Screenshots: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
