import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.PROJECTILE_DEFENCE_OUTPUT ?? '/tmp/black-whale-projectile-defence'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-projectile-defence/index.html'] },
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  page.setDefaultTimeout(90000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-projectile-defence/`,
  )
  await page.waitForFunction(() => Boolean(window.projectileDefenceFixture))
  const call = (method, ...args) =>
    page.evaluate(({ method, args }) => window.projectileDefenceFixture[method](...args), {
      method,
      args,
    })
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 720 })
    for (const fighter of ['kurapika', 'hisoka', 'benjamin', 'machi']) {
      for (const pattern of ['high', 'mixed', 'physical', 'jump']) {
        if (pattern === 'jump' && fighter !== 'hisoka') continue
        for (const mirrored of [false, true]) {
          await call('start', { fighter, pattern, mirrored })
          await page.locator('.fight-scene.ready').waitFor()
          await call('advance', 70)
          await page.waitForTimeout(80)
          if (!mirrored && (fighter === 'kurapika' || pattern === 'jump'))
            await page.screenshot({ path: path.join(output, `${fighter}-${pattern}-${width}.png`) })
          await call('advance', 110)
          const result = await call('snapshot')
          const expected = { high: 20, mixed: 40, physical: 3, jump: 1 }[pattern]
          assert.equal(result.emitted, expected, JSON.stringify(result))
          assert.equal(result.unblocked, 0, JSON.stringify(result))
          assert.equal(result.invulnerability, 0)
          assert.ok(result.health > 0)
          if (pattern === 'high' || pattern === 'jump')
            assert.equal(result.health, result.maxHealth)
          if (pattern === 'mixed' || pattern === 'physical') assert.ok(result.hits > 0)
          if (pattern === 'jump') assert.ok(result.maxHeight > 5)
          checks.push({ width, mirrored, ...result })
        }
      }
    }
    for (const mirrored of [false, true]) {
      await call('start', { fighter: 'kurapika', pattern: 'mixed', mirrored, offence: true })
      await page.locator('.fight-scene.ready').waitFor()
      await call('advance', 180)
      const result = await call('snapshot')
      assert.equal(result.emitted, 40)
      assert.equal(result.unblocked, 0)
      assert.ok(result.health > 0)
      checks.push({ width, mirrored, ...result })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, checks, errors }, null, 2),
  )
  process.stdout.write(
    `Projectile defence verified: ${checks.length} live cases, 20/40-shot volleys, physical bursts, jumps, desktop/mobile. ${output}\n`,
  )
} finally {
  await browser?.close()
  await server.close()
}
