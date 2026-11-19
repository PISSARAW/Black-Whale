import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.RESUSCITATION_CHECK_OUTPUT ?? '/tmp/black-whale-resuscitation-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-resuscitation/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-resuscitation/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.resuscitationFixture)
  await page.waitForSelector('canvas')
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const side of ['player', 'opponent']) {
      await page.evaluate((side) => window.resuscitationFixture.prepare(side), side)
      const before = await page.evaluate(() => window.resuscitationFixture.snapshot())
      await page
        .getByRole('button', {
          name: 'Bungee Gum · Programmer le cœur et les poumons',
          exact: true,
        })
        .click()
      const prepared = await page.evaluate(() => window.resuscitationFixture.snapshot())
      assert.equal(prepared.actor.aura, before.actor.aura - 8)
      assert.equal(prepared.actor.gumResuscitationProgram.order, 'heart-and-lungs')
      assert.equal(prepared.actor.asphyxiaCertificate, undefined)
      await page.evaluate((side) => window.resuscitationFixture.prepare(side, true), side)
      await page.evaluate(() => window.resuscitationFixture.advance(30))
      const dead = await page.evaluate(() => window.resuscitationFixture.snapshot())
      assert.equal(dead.actor.health, 0)
      assert.equal(dead.sequence.frame, 30)
      await page.waitForSelector('.fight-scene.ready')
      assert.ok(
        (await page.getByRole('status').allTextContents()).some((text) =>
          text.includes('pompage du cœur'),
        ),
      )
      await page.locator('.arena').scrollIntoViewIfNeeded()
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      )
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page
        .locator('.arena')
        .screenshot({ path: path.join(output, `resuscitation-${side}-${width}.png`) })
      await page.evaluate(() => window.resuscitationFixture.advance(90))
      const alive = await page.evaluate(() => window.resuscitationFixture.snapshot())
      assert.equal(alive.actor.health, alive.actor.maxHealth / 2)
      assert.equal(alive.actor.gumResuscitationCompleted, true)
      assert.deepEqual(alive.actor.bodyDamage, dead.actor.bodyDamage)
      assert.equal(alive.actor.openWounds, 4)
      assert.equal(alive.sequence, undefined)
      assert.equal(alive.phase, 'fighting')
      assert.deepEqual(alive.score, dead.score)
      assert.deepEqual(alive.rounds, dead.rounds)
      cases.push({ width, side })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Hisoka cardiopulmonary UI passed: ${cases.length} cases.\n`)
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
