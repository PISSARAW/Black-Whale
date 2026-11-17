import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.FALL_CHECK_OUTPUT ?? '/tmp/black-whale-falls'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-falls/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
let browser
const errors = []
const checks = []
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 850 } })
  page.setDefaultTimeout(60000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-falls/`)
  await page.waitForFunction(() => Boolean(window.fallFixture))
  const call = (method, ...args) =>
    page.evaluate(({ method, args }) => window.fallFixture[method](...args), { method, args })
  const sample = async (time, wakeup = false) => {
    const before = await call('snapshot')
    await call('at', time, wakeup)
    await page.waitForFunction(
      ({ time, rendered }) => {
        const result = window.fallFixture.snapshot()
        return result.seconds === time && result.rendered > (rendered ?? 0) + 2
      },
      { time, rendered: before.rendered },
    )
    return call('snapshot')
  }
  const grounded = (result) => {
    assert.equal(result.rootY, 0)
    assert.equal(result.outside, 0, 'The full fallen body must remain visible')
    assert.ok(Math.abs(result.roll) < 0.05, JSON.stringify(result))
    assert.ok(Math.abs(result.upY) < 0.15, JSON.stringify(result))
    assert.ok(result.torsoBottom >= -0.03 && result.torsoBottom < 0.2, JSON.stringify(result))
  }
  for (const id of [
    'kurapika',
    'hisoka',
    'chrollo',
    'benjamin',
    'franklin',
    'biscuit',
    'cluck',
    'yokotani',
  ]) {
    for (const side of ['player', 'opponent']) {
      await call('reset', id, side, { kind: 'ground' })
      await page.locator('.fight-scene.ready').waitFor()
      const result = await sample(0.7)
      grounded(result)
      checks.push({ id, side, kind: 'ground', result })
      if (side === 'player') await page.screenshot({ path: path.join(output, `${id}-down.png`) })
      for (const time of [1, 1.15, 1.3, 1.5]) {
        const rising = await sample(time, true)
        assert.ok(rising.torsoBottom >= -0.03, JSON.stringify(rising))
      }
    }
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 850 })
    for (const side of ['player', 'opponent']) {
      for (const velocityY of [35, -20]) {
        const start = await call('reset', 'benjamin', side, { kind: 'air', velocityY })
        await page.locator('.fight-scene.ready').waitFor()
        const initial = await sample(0)
        assert.ok(initial.rootY > 0)
        assert.equal(Math.sign(initial.sourceVelocityY), Math.sign(velocityY))
        await page.screenshot({
          path: path.join(output, `ko-${side}-${width}-${velocityY}-air.png`),
        })
        const final = await sample(2)
        grounded(final)
        assert.equal(final.hash, start.hash, 'The verdict and simulation must stay immutable')
        assert.ok(final.sourceY > 0, 'The frozen engine state must remain intact')
        await page.screenshot({
          path: path.join(output, `ko-${side}-${width}-${velocityY}-landed.png`),
        })
        checks.push({ side, width, velocityY, kind: 'air', initial, final })
      }
    }
  }
  await call('reset', 'benjamin', 'opponent', { kind: 'air' })
  await page.locator('.fight-scene.ready').waitFor()
  await call('realtime')
  await page.locator('.fight-scene.ready').waitFor()
  await call('pause', true)
  const paused = await call('snapshot')
  await page.waitForTimeout(350)
  assert.deepEqual(await call('snapshot'), paused)
  await call('pause', false)
  await page.waitForFunction(() => window.fallFixture.snapshot().rootY === 0)
  await page.waitForTimeout(700)
  grounded(await call('snapshot'))
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, checks, errors }, null, 2),
  )
  process.stdout.write(
    `Falls verified: ${checks.length} scene cases, aerial KO, both sides, desktop/mobile, pause. ${output}\n`,
  )
} finally {
  await browser?.close()
  await server.close()
}
