import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.SUTURE_CHECK_OUTPUT ?? '/tmp/black-whale-sutures-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-sutures/index.html'] },
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
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-sutures/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.sutureFixture)
  await page.waitForSelector('canvas')
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const { side, mode } of ['native', 'book', 'dolphin'].flatMap((mode) =>
      ['player', 'opponent'].map((side) => ({ side, mode })),
    )) {
      await page.evaluate(({ side, mode }) => window.sutureFixture.prepare(mode, side), {
        side,
        mode,
      })
      const before = await page.evaluate(() => window.sutureFixture.snapshot())
      assert.equal(before.patient.bodyDamage.parts.length, 2)
      assert.equal(before.parts.filter((entry) => entry.present).length, 2)
      const left = page.getByRole('button', {
        name: /Nen Stitches · Rattacher l’avant-bras gauche/,
      })
      await left.click()
      const working = await page.evaluate(() => window.sutureFixture.snapshot())
      assert.equal(working.caster.machiReattachment.frames, 90)
      assert.equal(working.patient.health, before.patient.health)
      await page.waitForSelector('.fight-scene.ready')
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
        .screenshot({ path: path.join(output, `suture-${mode}-${side}-${width}.png`) })
      await page.evaluate(() => window.sutureFixture.advance(92))
      const connected = await page.evaluate(() => window.sutureFixture.snapshot())
      assert.deepEqual(connected.patient.bodyDamage.parts, ['right-forearm'])
      assert.equal(connected.patient.health, before.patient.health)
      assert.equal(connected.parts.filter((entry) => entry.present).length, 1)
      assert.deepEqual(connected.score, before.score)
      const right = page.getByRole('button', {
        name: /Nen Stitches · Rattacher l’avant-bras droit/,
      })
      if (mode === 'dolphin') {
        assert.equal((await right.count()) === 0 || !(await right.isEnabled()), true)
        assert.equal(working.caster.aura, before.caster.aura)
      } else {
        await right.click()
        await page.evaluate(() => window.sutureFixture.advance(92))
        const complete = await page.evaluate(() => window.sutureFixture.snapshot())
        assert.deepEqual(complete.patient.bodyDamage.parts, [])
        assert.equal(complete.patient.health, before.patient.health)
        assert.equal(complete.parts.filter((entry) => entry.present).length, 0)
      }
      cases.push({ width, side, mode })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Physical Nen Stitches UI passed: ${cases.length} cases.\n`)
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
