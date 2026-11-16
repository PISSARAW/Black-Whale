import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.HINRIGH_CHECK_OUTPUT ?? '/tmp/black-whale-hinrigh'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/hinrigh/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
})
const errors = []
const results = []
try {
  const page = await browser.newPage()
  page.on('pageerror', (error) => {
    errors.push(error.message)
    console.error('Browser error:', error.message)
  })
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/hinrigh/`)
  await page.waitForFunction(() => window.hinrighFixture)
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 })
    for (const [frame, expected] of [
      [9, 'transforming'],
      [40, 'flying'],
      [75, 'bound'],
      [128, 'dropped'],
    ]) {
      const result = await page.evaluate((frame) => window.hinrighFixture.renderFrame(frame), frame)
      assert.equal(result.phases[0], expected)
      assert.equal(result.phases[1], 'carried')
      assert.equal(result.health, result.initialHealth)
      assert.deepEqual(result.score, { player: 0, opponent: 0 })
      assert.equal(result.captured, expected === 'bound')
      assert.equal(await page.locator('canvas').count(), 1)
      if (expected === 'bound') assert.equal(await page.getByRole('status').count(), 1)
      await page.waitForTimeout(1000)
      assert.equal(await page.locator('canvas').isVisible(), true)
      assert.equal(
        await page.getByRole('heading', { name: 'Hinrigh · Biohazard' }).isVisible(),
        true,
      )
      const file = path.join(output, `biohazard-${frame}-${width}.png`)
      await page.screenshot({ path: file })
      results.push({ width, frame, ...result, screenshot: file })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify(results, null, 2))
  process.stdout.write(`Verified ${results.length} Biohazard frames; screenshots: ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
