import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.BONOLENOV_THROW_OUTPUT ?? '/tmp/black-whale-bonolenov-throws'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/bonolenov-throws/index.html'], holdUntilCrawlEnd: false },
  cacheDir: path.join(output, 'vite-cache'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [
    '--no-proxy-server',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = [],
  samples = []
page.on('pageerror', (error) => errors.push(error.message))
page.setDefaultTimeout(90000)
const reset = (options) => page.evaluate((options) => window.throwFixture.reset(options), options)
const snapshot = () => page.evaluate(() => window.throwFixture.snapshot())
async function seek(age) {
  await page.evaluate((age) => window.throwFixture.seek(age), age)
  await page.waitForTimeout(220)
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
}
try {
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/bonolenov-throws/`)
  await page.waitForSelector('.fight-scene.ready')
  for (const side of ['player', 'opponent']) {
    for (const powered of [false, true])
      for (const armed of [false, true]) {
        await reset({ side, powered, armed })
        for (const [age, phase] of [
          [0.08, 'grip'],
          [0.38, 'turn'],
          [0.68, 'slam'],
          [0.92, 'release'],
        ]) {
          await seek(age)
          const value = await snapshot()
          assert.equal(value.audit.phase, phase)
          assert.equal(value.audit.finite, true)
          assert.equal(Boolean(value.audit.spear), armed)
          if (armed && powered) {
            assert.equal(value.audit.spear.parent, 'hand-right')
            const expected = side === 'player' ? 1 : -1
            assert.ok(value.audit.spear.axis[0] * expected > 0.95)
          }
          await page.screenshot({
            path: path.join(output, `${side}-${powered}-${armed}-${phase}.png`),
          })
          samples.push({ side, powered, armed, phase, ...value.audit })
        }
      }
  }
  await page.evaluate(() => window.throwFixture.pause(true))
  const frozen = await snapshot()
  await page.waitForTimeout(300)
  assert.deepEqual((await snapshot()).state, frozen.state)
  assert.deepEqual((await snapshot()).audit, frozen.audit)
  await page.evaluate(() => window.throwFixture.pause(false))
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 720 })
    await reset({ side: 'opponent', powered: true, armed: true })
    await seek(0.38)
    assert.equal((await snapshot()).audit.finite, true)
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`) })
  }
  for (const options of [
    { tech: true },
    { miss: true },
    { powered: true, aura: 24 },
    { powered: true, zetsu: true },
  ]) {
    await reset(options)
    await page.evaluate(() => window.throwFixture.end())
    await page.waitForTimeout(150)
    assert.equal((await snapshot()).audit.phase, null)
    assert.equal(await page.locator('[data-throw-cinematic]').count(), 0)
  }
  await page.setViewportSize({ width: 1280, height: 720 })
  await reset({ ko: true, powered: true, armed: true })
  await seek(0)
  assert.equal((await snapshot()).state.phase, 'finished')
  await page.waitForSelector('[data-victory-cinematic]')
  await reset({ powered: true, armed: true })
  await page.evaluate(() => window.throwFixture.stable())
  await seek(0.38)
  assert.equal((await snapshot()).audit.phase, null)
  assert.equal(await page.locator('[data-throw-cinematic]').count(), 0)
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ samples, errors }, null, 2))
} catch (error) {
  await writeFile(
    path.join(output, 'failure.json'),
    JSON.stringify({ error: String(error), errors }, null, 2),
  )
  await page.screenshot({ path: path.join(output, 'failure.png') })
  throw error
} finally {
  await browser.close()
  await server.close()
}
