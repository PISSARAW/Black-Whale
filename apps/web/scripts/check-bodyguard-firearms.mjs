import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.BODYGUARD_CHECK_OUTPUT ?? '/tmp/black-whale-bodyguards'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/bodyguard-firearms/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
console.log('Bodyguard UI server ready')
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
})
console.log('Bodyguard UI browser ready')
const errors = []
const results = []
try {
  const page = await browser.newPage()
  console.log('Bodyguard UI page ready')
  page.on('pageerror', (error) => {
    errors.push(error.message)
    console.error('Browser error:', error.message)
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/bodyguard-firearms/`,
  )
  console.log('Bodyguard UI fixture loaded')
  await page.waitForFunction(() => window.bodyguardFixture)
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 })
    for (const id of ['kurapika', 'bill', 'melody', 'biscuit']) {
      const language = width === 390 ? 'en' : 'fr'
      const result = await page.evaluate((options) => window.bodyguardFixture.render(options), {
        id,
        side: 'player',
        language,
      })
      await page.waitForFunction(() => window.bodyguardFixture.ready())
      assert.equal(result.kind, 'ranged')
      assert.equal(result.projectile.shape, 'bullet')
      assert.equal(result.projectile.matter, 'object')
      assert.equal(result.projectile.nenPower, 1)
      assert.equal(await page.locator('canvas').count(), 1)
      assert.match(
        await page.locator('.ability-readiness').innerText(),
        language === 'fr' ? /Pistolet de service/ : /Service handgun/,
      )
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      )
      if (id === 'kurapika')
        assert.equal(await page.getByText('Chaîne divinatoire', { exact: true }).count(), 0)
      await page.waitForTimeout(400)
      const file = path.join(output, `firearm-${id}-${width}.png`)
      await page.screenshot({ path: file, fullPage: true })
      results.push({ width, id, screenshot: file })
    }
    const result = await page.evaluate(() =>
      window.bodyguardFixture.render({ id: 'kurapika', side: 'opponent', language: 'fr' }),
    )
    await page.waitForFunction(() => window.bodyguardFixture.ready())
    assert.equal(result.projectile.velocityX < 0, true)
    await page.waitForTimeout(400)
    await page.screenshot({
      path: path.join(output, `firearm-kurapika-p2-${width}.png`),
      fullPage: true,
    })
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify(results, null, 2))
  process.stdout.write(
    `Verified ${results.length} bodyguard firing scenes; screenshots: ${output}\n`,
  )
} finally {
  await browser.close()
  await server.close()
}
