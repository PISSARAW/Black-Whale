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
  server: { host: '127.0.0.1', port: 0 },
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
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-nen/`)
  await page.waitForFunction(() => window.nenFixture)
  await page.waitForSelector('canvas')
  const snapshot = () => page.evaluate(() => window.nenFixture.snapshot())
  await page.keyboard.down('r')
  assert.equal((await snapshot()).nen.en.radius, 22)
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
  assert.equal((await snapshot()).opponentNen.en.radius, 22)
  await page.keyboard.up('[')
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => window.nenFixture.renderCase('kurapika'))
    const en = page.getByRole('button', { name: 'R En', exact: true })
    await en.scrollIntoViewIfNeeded()
    await en.hover()
    await page.mouse.down()
    assert.equal((await snapshot()).nen.en.radius, 22)
    await page.mouse.up()
    assert.equal((await snapshot()).nen.en, null)
    await page.getByRole('button', { name: 'AURA + H EMPEROR TIME' }).click()
    await page.getByText('Renforcement 100 %', { exact: true }).waitFor()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    )
    assert.equal(overflow, false)
    await page.screenshot({ path: path.join(output, `kurapika-${width}.png`), fullPage: true })
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
