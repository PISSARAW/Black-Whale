import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.CAMERA_CHECK_OUTPUT ?? '/tmp/black-whale-camera-all'
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
const roster = [
  'kurapika',
  'hisoka',
  'chrollo',
  'benjamin',
  'tserriednich',
  'feitan',
  'saiyu',
  'theta',
  'biscuit',
  'phinks',
  'franklin',
  'machi',
  'illumi',
  'kalluto',
  'bonolenov',
  'shizuku',
  'hinrigh',
  'mizaistom',
  'leorio',
  'hanzo',
  'rihan',
  'zakuro',
  'melody',
  'basho',
  'camilla',
  'halkenburg',
  'gel',
  'lynch',
  'luini',
  'bill',
  'furykov',
  'cluck',
  'beyond',
  'longhi',
  'musse',
  'padaille',
  'sayird',
  'terebellum',
  'voconte',
  'yokotani',
]
const selected = process.env.CAMERA_FIGHTERS?.split(',')
const fighters = selected ? roster.filter((id) => selected.includes(id)) : roster

try {
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  page.setDefaultNavigationTimeout(120000)
  page.setDefaultTimeout(120000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-camera/`)
  await page.waitForFunction(() => window.cameraFixture)
  const fixture = (method, ...args) =>
    page.evaluate(({ method, args }) => window.cameraFixture[method](...args), { method, args })
  const results = []
  for (const [index, id] of fighters.entries()) {
    for (const side of ['player', 'opponent']) {
      await fixture('reset', id, side)
      await page.locator('.fight-scene.ready').waitFor({ timeout: 20000 })
      await fixture('act')
      const panel = page.locator(`[data-camera-source="${id}"]`)
      await panel.waitFor({ timeout: 6000 })
      await page.screenshot({ path: path.join(output, `${id}-${side}-1440.png`) })
      const snapshot = await fixture('snapshot')
      await page.waitForTimeout(60)
      assert.deepEqual(await fixture('snapshot'), snapshot)
      assert.equal(await page.locator('.failed').count(), 0)
      results.push({ id, side, event: await panel.getAttribute('data-camera-event') })
    }
    process.stdout.write(`${index + 1}/${fighters.length} ${id} passed\n`)
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 950 })
    for (const id of selected
      ? fighters
      : [
          'biscuit',
          'feitan',
          'hanzo',
          'bonolenov',
          'terebellum',
          'basho',
          'furykov',
          'longhi',
          'mizaistom',
          'hinrigh',
          'leorio',
        ]) {
      await fixture('reset', id)
      await page.locator('.fight-scene.ready').waitFor({ timeout: 20000 })
      await fixture('act')
      await page.locator(`[data-camera-source="${id}"]`).waitFor({ timeout: 6000 })
      await page.screenshot({ path: path.join(output, `${id}-${width}.png`) })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      { passed: true, fighters: fighters.length, cases: results, widths: [1440, 390, 320], errors },
      null,
      2,
    ),
  )
  process.stdout.write(
    `All ${fighters.length} cinematic camera UI cases passed. Screenshots: ${output}\n`,
  )
} finally {
  await browser?.close()
  await server.close()
}
