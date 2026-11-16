import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.CAMILLA_CHECK_OUTPUT ?? '/tmp/black-whale-camilla'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/camilla/index.html'] },
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
  page.on('pageerror', (error) => { errors.push(error.message); console.error('Browser error:', error.message) })
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/camilla/`)
  await page.waitForFunction(() => window.camillaFixture)
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 })
    for (const [frame, expected] of [
      [12, 'summon'],
      [36, 'capture'],
      [66, 'absorb'],
      [102, 'revive'],
      [120, null],
    ]) {
      await page.waitForFunction(() => window.camillaFixture)
      const result = await page.evaluate((frame) => window.camillaFixture.renderFrame(frame), frame)
      assert.equal(result.catPhase, expected)
      assert.equal(result.time, result.initialTime)
      assert.equal(await page.locator('canvas').count(), 1)
      if (expected) assert.equal(await page.getByRole('status').count(), 1)
      else {
        assert.equal(result.winner, 'player')
        assert.equal(result.health, result.maxHealth)
        assert.equal(result.killerHealth, 0)
        assert.equal(result.consumed, 'opponent')
      }
      await page.waitForTimeout(1000)
      assert.equal(await page.locator('canvas').isVisible(), true)
      assert.equal(await page.getByRole('heading', { name: 'Cat’s Name' }).isVisible(), true)
      const file = path.join(output, `cat-${frame}-${width}.png`)
      await page.screenshot({ path: file })
      results.push({ width, frame, ...result, screenshot: file })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify(results, null, 2))
  console.log(`Verified ${results.length} Cat’s Name frames; screenshots: ${output}`)
} finally {
  await browser.close()
  await server.close()
}
