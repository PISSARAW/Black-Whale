import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/fighting-benjamin-validation')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: [
      'demos/fighting-showcase/benjamin-fatality.html',
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
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  for (const options of [
    { target: 'franklin', stage: 'heavens-arena', side: 'opponent' },
    { target: 'biscuit', stage: 'screening-room', side: 'player' },
    { target: 'benjamin', stage: 'whale-hold', side: 'opponent', reduced: '1' },
  ]) {
    await page.goto(
      `${base}/demos/fighting-showcase/benjamin-fatality.html?${new URLSearchParams(options)}`,
    )
    await page.waitForFunction(() => window.fightingShowcase?.ready())
    const report = await page.evaluate(() => window.fightingShowcase.report())
    assert.equal(report.failed, false)
    assert.equal(report.winner, options.side)
    assert.equal(report.target, options.target)
    assert.equal(report.stageId, options.stage)
    assert.equal(report.strikingHand, 'left')
    assert.equal(report.nativeFinalMove, 'benjamin:neutralSpecial')
    for (const age of [269, 310, 470]) {
      await page.evaluate((age) => window.fightingShowcase.seek(age), age)
      await page.waitForTimeout(80)
      assert.equal(
        await page.evaluate(() => window.fightingShowcase.report().nativeState),
        report.nativeState,
      )
      await page.screenshot({ path: path.join(output, `${options.target}-${age}.png`) })
    }
    if (options.target === 'biscuit') {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.evaluate(() => window.fightingShowcase.seek(270))
      await page.waitForTimeout(100)
      await page.screenshot({ path: path.join(output, 'mobile-short-target.png') })
      await page.setViewportSize({ width: 1280, height: 800 })
    }
    results.push(options)
    console.log(`Verified Benjamin: ${options.target}, ${options.stage}, ${options.side}`)
  }
  await page.goto(`${base}/ui-tests/fighting-victory/`)
  await page.waitForFunction(() => window.victoryFixture)
  await page.evaluate(async () => {
    await window.victoryFixture.configure({
      winner: 'benjamin',
      target: 'hisoka',
      side: 'opponent',
      stage: 'benjamin-salon',
    })
    await window.victoryFixture.finish()
  })
  const overlay = page.locator('[data-victory-cinematic]')
  await overlay.waitFor()
  assert.equal(await overlay.getAttribute('data-winner'), 'benjamin')
  assert.equal(await overlay.getAttribute('data-target'), 'hisoka')
  assert.equal(await overlay.getAttribute('data-stage'), 'benjamin-salon')
  assert.equal((await page.request.get(`${base}/clash-victories/benjamin.m4a`)).status(), 200)
  await page.keyboard.press('Escape')
  await overlay.waitFor({ state: 'detached' })
  assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().active), false)
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ results, errors }, null, 2))
  console.log(`Benjamin checks passed: ${output}`)
} finally {
  await browser.close()
  await server.close()
}
