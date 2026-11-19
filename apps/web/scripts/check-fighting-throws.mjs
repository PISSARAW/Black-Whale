import { existsSync } from 'node:fs'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
const root = fileURLToPath(new URL('../', import.meta.url))
const output = '/tmp/black-whale-throw-cinematics'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-throws/index.html'], holdUntilCrawlEnd: false },
  cacheDir: path.join(output, 'vite-cache'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({
  executablePath: existsSync(chrome) ? chrome : undefined,
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
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-throws/`)
  await page.waitForSelector('.fight-scene.ready')
  for (const side of ['player', 'opponent']) {
    await reset({ side })
    for (const [age, phase] of [
      [2, 'grip'],
      [9, 'turn'],
      [16, 'slam'],
      [22, 'release'],
    ]) {
      await seek(age)
      const value = await snapshot()
      assert.equal(value.audit.phase, phase)
      assert.equal(value.audit.finite, true)
      if (phase === 'slam' || phase === 'release') {
        const victim = side === 'player' ? 1 : 0
        const pitch = value.audit.bodies[victim][0]
        assert.ok(
          phase === 'slam' ? Math.abs(pitch) > 0.5 : pitch < -1,
          phase === 'slam'
            ? 'The thrown fighter must leave their upright pose'
            : 'The thrown fighter must land on the floor',
        )
      }
      await page.screenshot({ path: path.join(output, `${side}-${phase}.png`) })
      samples.push({ side, phase, ...value.audit })
    }
  }
  await page.evaluate(() => window.throwFixture.pause(true))
  const frozen = await snapshot()
  await page.waitForTimeout(300)
  assert.deepEqual((await snapshot()).state, frozen.state)
  await page.evaluate(() => window.throwFixture.pause(false))
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 720 })
    await reset({ side: 'opponent', id: 'franklin' })
    await seek(9)
    await page.waitForSelector('.fight-scene.ready')
    assert.equal((await snapshot()).audit.finite, true)
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`) })
  }
  for (const options of [{ tech: true }, { miss: true }]) {
    await reset(options)
    await page.evaluate(() => window.throwFixture.end())
    await page.waitForTimeout(200)
    assert.equal((await snapshot()).audit.phase, null)
  }
  await reset({ ko: true })
  await seek(0)
  assert.equal((await snapshot()).state.phase, 'finished')
  await page.waitForSelector('[data-victory-cinematic]')
  await reset({})
  await page.evaluate(() => window.throwFixture.stable())
  await seek(9)
  assert.equal((await snapshot()).audit.phase, null)
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
