import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/fighting-nobunaga-validation')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: [
      'demos/fighting-showcase/nobunaga-fatality.html',
      'ui-tests/fighting-victory/index.html',
    ],
  },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ headless: true })
const errors = [],
  results = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.clock.install()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  for (const options of [
    { target: 'franklin', stage: 'heavens-arena', side: 'opponent' },
    { target: 'biscuit', stage: 'screening-room', side: 'player' },
    { target: 'nobunaga', stage: 'whale-hold', side: 'opponent', reduced: '1' },
  ]) {
    await page.clock.resume()
    await page.goto(
      `${base}/demos/fighting-showcase/nobunaga-fatality.html?capture=1&${new URLSearchParams(options)}`,
    )
    await page.waitForFunction(() => window.fightingShowcase?.ready())
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 10000)))
    const report = await page.evaluate(() => window.fightingShowcase.report())
    assert.equal(report.failed, false)
    assert.equal(report.target, options.target)
    assert.equal(report.stageId, options.stage)
    assert.equal(report.standalone, true)
    assert.equal(report.playable, false)
    for (const age of [240, 299, 300, 303, 308, 420, 510, 570]) {
      await page.evaluate((age) => window.fightingShowcase.seek(age), age)
      await page.clock.runFor(50)
      const audit = await page.evaluate(() => window.fightingShowcase.report().audit)
      if (age === 299) assert.ok(audit.entryDistance > 4)
      if (age === 300) assert.ok(Math.abs(audit.entryDistance - 4) < 0.00001)
      if (age === 308) assert.ok(audit.contactError < 0.00001)
      await page.screenshot({ path: path.join(output, `${options.target}-${age}.png`) })
    }
    if (options.target === 'biscuit') {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.evaluate(() => window.fightingShowcase.seek(308))
      await page.clock.runFor(50)
      await page.screenshot({ path: path.join(output, 'mobile-short-target.png') })
      await page.setViewportSize({ width: 1280, height: 800 })
    }
    results.push(options)
    process.stdout.write(
      `Verified Nobunaga: ${options.target}, ${options.stage}, ${options.side}\n`,
    )
  }
  assert.equal((await page.request.get(`${base}/clash-victories/nobunaga.m4a`)).status(), 200)
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ results, errors }, null, 2))
  process.stdout.write(`Nobunaga checks passed: ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
