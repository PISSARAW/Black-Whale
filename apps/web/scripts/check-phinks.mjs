import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.PHINKS_CHECK_OUTPUT ?? '/tmp/black-whale-phinks-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/phinks/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const errors = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/phinks/`)
  await page.waitForFunction(() => Boolean(window.phinksFixture))
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1100 })
    for (const phase of ['quarter', 'half', 'charged', 'punch']) {
      const shown = await page.evaluate((phase) => window.phinksFixture.showCase(phase), phase)
      if (phase === 'charged') assert.equal(shown.turns, 15)
      if (phase === 'punch') assert.equal(shown.punch, 3)
      await page.getByLabel('Ripper Cyclotron', { exact: true }).waitFor()
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page.screenshot({ path: path.join(output, `${phase}-${width}.png`), fullPage: true })
    }
  }
  await page.evaluate(() => window.phinksFixture.showCase('charged'))
  await page.locator('.finisher-button').click()
  assert.equal(await page.evaluate(() => window.phinksFixture.current().punch), 15)
  assert.equal(await page.evaluate(() => window.phinksFixture.current().turns), 0)
  await page.evaluate(() => window.phinksFixture.showCase('half', 'en'))
  await page.getByText('Current rotation', { exact: false }).waitFor()
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases: 10, errors }, null, 2))
  process.stdout.write(`Phinks UI: 10 cases passed; ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
