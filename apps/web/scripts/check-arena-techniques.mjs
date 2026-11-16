import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.ARENA_CHECK_OUTPUT ?? '/tmp/black-whale-arena-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/arena-techniques/index.html'] },
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
  const fixtureUrl = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/arena-techniques/`
  const warmup = await fetch(fixtureUrl, { signal: AbortSignal.timeout(15000) })
  process.stdout.write(`Fixture HTTP ${warmup.status}\n`)
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/arena-techniques/`,
    { waitUntil: 'domcontentloaded', timeout: 90_000 },
  )
  await page.waitForFunction(() => window.arenaFixture, undefined, { timeout: 90_000 })
  await page.waitForSelector('canvas')
  const snapshot = () => page.evaluate(() => window.arenaFixture.snapshot())
  await page.evaluate(() => window.arenaFixture.setCharacter('hisoka'))
  await page.keyboard.press('o')
  await page.evaluate(() => window.arenaFixture.advance(20))
  assert.equal((await snapshot()).arena.tether.player.kind, 'gum')
  assert.equal((await snapshot()).arena.tether.opponent, undefined)
  await page.keyboard.press('p')
  await page.evaluate(() => window.arenaFixture.advance(20))
  assert.equal((await snapshot()).arena.tether.opponent.kind, 'gum')
  await page.screenshot({ path: path.join(output, 'arena-desktop.png'), fullPage: true })
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.evaluate(() => window.arenaFixture.setCharacter('shizuku'))
    await page.getByRole('button', { name: 'O Action d’arène', exact: true }).tap()
    await page.evaluate(() => window.arenaFixture.advance(20))
    assert.equal((await snapshot()).arena.stored.player, 'arena:crate:34')
    await page.getByRole('button', { name: 'O Action d’arène', exact: true }).tap()
    await page.evaluate(() => window.arenaFixture.advance(20))
    assert.equal((await snapshot()).arena.stored.player, undefined)
    await page.getByRole('button', { name: '= Caisse', exact: true }).tap()
    assert.equal(
      (await snapshot()).battlefield.entities.find((entry) => entry.id === 'arena:crate:66').x,
      63,
    )
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.screenshot({ path: path.join(output, `arena-${width}.png`), fullPage: true })
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, widths: [1100, 390, 320], errors }, null, 2),
  )
  process.stdout.write(`Arena UI passed: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
