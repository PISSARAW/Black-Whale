import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.CAMERA_CHECK_OUTPUT ?? '/tmp/black-whale-camera-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  optimizeDeps: { entries: ['ui-tests/fighting-camera/index.html'] },
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
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  page.setDefaultTimeout(120000)
  page.setDefaultNavigationTimeout(120000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-camera/`)
  await page.waitForFunction(() => window.cameraFixture)
  await page.locator('.fight-scene.ready').waitFor()
  const fixture = async (method, ...args) =>
    page.evaluate(({ method, args }) => window.cameraFixture[method](...args), { method, args })
  const wait = () => page.waitForTimeout(450)
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 })
    for (const [id, kind, expected] of [
      ['kurapika', 'emperor', 'eyes'],
      ['biscuit', 'biscuit', 'body'],
      ['feitan', 'armour', 'armour'],
    ]) {
      for (const side of ['player', 'opponent']) {
        await fixture('reset', id, side)
        await page.locator('.fight-scene.ready').waitFor()
        await wait()
        await fixture('awaken', kind, side)
        if (kind === 'armour') await fixture('advance', 40)
        await wait()
        const panel = page.locator(`[data-camera-detail="${expected}"][data-camera-side="${side}"]`)
        await panel.waitFor()
        const before = await fixture('snapshot')
        await page.screenshot({ path: path.join(output, `${id}-${side}-${width}.png`) })
        assert.deepEqual(await fixture('snapshot'), before, 'Rendering must not advance combat')
        if (id === 'feitan') {
          await fixture('awaken', 'sun', side)
          await fixture('advance', 95)
          await wait()
          await page.locator('[data-camera-detail="sun"]').waitFor()
          await page.screenshot({ path: path.join(output, `sun-${side}-${width}.png`) })
        }
        await fixture('settings', true)
        await wait()
        assert.equal(await page.locator('[data-camera-detail]').count(), 0)
      }
    }
    await fixture('reset', 'kurapika')
    await page.locator('.fight-scene.ready').waitFor()
    await wait()
    await fixture('cast')
    await wait()
    await page.locator('[data-camera-detail="chain"]').waitFor()
    await fixture('advance', 18)
    await wait()
    await page.locator('[data-camera-detail="impact"]').waitFor()
    await page.screenshot({ path: path.join(output, `chain-impact-${width}.png`) })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await fixture('reset', 'kurapika')
  await page.locator('.fight-scene.ready').waitFor()
  await wait()
  await fixture('awaken', 'emperor')
  await wait()
  assert.equal(await page.locator('[data-camera-detail]').count(), 0)
  assert.equal(await page.locator('.failed').count(), 0)
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, widths: [1440, 390, 320], errors }, null, 2),
  )
  process.stdout.write(`Cinematic camera UI passed. Screenshots: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
