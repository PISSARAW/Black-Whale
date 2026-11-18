import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.STANCES_OUTPUT ?? '/tmp/clash-stances'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, watch: null, hmr: false },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
let browser
const errors = [],
  cases = []
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })
  const page = await browser.newPage({ viewport: { width: 420, height: 520 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-stances/`)
  await page.waitForFunction(() => window.stanceGallery)
  const roster = await page.evaluate(() => window.stanceGallery.roster)
  assert.equal(roster.length, 40)
  for (const { id } of roster) {
    for (const facing of [1, -1]) {
      let groundHeight
      for (const seconds of [0, 0.5, 1.5, 3]) {
        const result = await page.evaluate(
          ({ id, facing, seconds }) => window.stanceGallery.show(id, facing, { seconds }),
          { id, facing, seconds },
        )
        assert.ok(result.finite, id)
        assert.equal(result.glError, 0, id)
        assert.equal(result.plan, 'stance', id)
        const lowestFoot = Math.min(...result.feet.map((foot) => foot[1]))
        groundHeight ??= lowestFoot
        assert.ok(Math.abs(lowestFoot - groundHeight) < 1e-4, `${id}: foot drifts off the floor`)
        cases.push(result)
        if (seconds === 0) await page.screenshot({ path: path.join(output, `${id}-${facing}.png`) })
      }
    }
    await page.evaluate((id) => window.stanceGallery.show(id, 1, { view: 'front' }), id)
    await page.screenshot({ path: path.join(output, `${id}-front.png`) })
    process.stdout.write(`${id}: idle, two facings, four breathing times.\n`)
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, roster, cases, errors }, null, 2),
  )
  process.stdout.write(`Verified ${cases.length} idle frames. ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
