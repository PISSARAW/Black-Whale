import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.LUINI_CHECK_OUTPUT ?? '/tmp/black-whale-luini-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/luini/index.html'] },
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
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/luini/`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  await page.waitForFunction(() => window.luiniFixture, undefined, { timeout: 60_000 })
  await page.waitForSelector('canvas')
  const snapshot = () => page.evaluate(() => window.luiniFixture.snapshot())
  let checks = 0
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 })
    for (const language of ['fr', 'en']) {
      for (const side of ['player', 'opponent']) {
        await page.evaluate(({ language, side }) => window.luiniFixture.reset(language, side), {
          language,
          side,
        })
        const before = await snapshot()
        assert.match(before.phase.label, /Ancrer|Anchor/)
        await page.getByRole('button', { name: 'L', exact: true }).click()
        const anchored = await snapshot()
        assert.equal(anchored.x, before.x)
        assert.equal(anchored.anchor, `${side}:room`)
        assert.match(anchored.phase.label, /Partir|Leave/)
        await page.evaluate(() => window.luiniFixture.advance())
        await page.getByRole('button', { name: 'L', exact: true }).click()
        assert.equal((await snapshot()).x, side === 'player' ? 85 : 15)
        await page.evaluate(() => window.luiniFixture.advance())
        await page.evaluate(() => window.luiniFixture.position(48))
        assert.match((await snapshot()).phase.label, /Revenir|Return/)
        await page.screenshot({
          path: path.join(output, `return-${language}-${side}-${width}.png`),
          fullPage: true,
        })
        await page.keyboard.press('l')
        assert.equal((await snapshot()).x, side === 'player' ? 20 : 80)
        await page.evaluate(() => window.luiniFixture.advance())
        await page.evaluate(() => window.luiniFixture.position(48))
        await page.evaluate(() => window.luiniFixture.openDoor())
        assert.match((await snapshot()).phase.status, /définitivement|permanently/)
        assert.equal(await page.getByRole('button', { name: 'L', exact: true }).isDisabled(), true)
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        )
        await page.screenshot({
          path: path.join(output, `burned-${language}-${side}-${width}.png`),
          fullPage: true,
        })
        checks++
      }
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, checks, errors }, null, 2),
  )
  process.stdout.write(`Luini UI passed: ${checks} scenarios · ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
