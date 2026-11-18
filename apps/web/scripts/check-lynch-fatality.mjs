import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/fighting-lynch-validation')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: [
      'demos/fighting-showcase/lynch-fatality.html',
      'ui-tests/fighting-victory/index.html',
    ],
  },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  headless: true,
  args: process.platform === 'darwin' ? ['--use-angle=metal'] : [],
})
const errors = [],
  results = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.setDefaultTimeout(120000)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.clock.install()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  for (const options of [
    { target: 'franklin', stage: 'heavens-arena', side: 'opponent' },
    { target: 'biscuit', stage: 'screening-room', side: 'player' },
    { target: 'lynch', stage: 'whale-hold', side: 'opponent', reduced: '1' },
  ]) {
    await page.clock.resume()
    await page.goto(
      `${base}/demos/fighting-showcase/lynch-fatality.html?${new URLSearchParams(options)}`,
      { waitUntil: 'domcontentloaded' },
    )
    await page.waitForFunction(() => window.fightingShowcase?.ready())
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 10000)))
    const report = await page.evaluate(() => window.fightingShowcase.report())
    assert.equal(report.failed, false)
    assert.equal(report.winner, options.side)
    assert.equal(report.target, options.target)
    assert.equal(report.stageId, options.stage)
    assert.equal(report.physicalKnockout, true)
    assert.equal(report.soulDamage, false)
    assert.equal(report.answers, 6)
    assert.equal(report.truthfulIdentity, true)
    assert.equal(report.privateAnswers, true)
    assert.equal(report.noReplyAfterKo, true)
    for (const age of [96, 132, 246, 318, 354, 396, 420, 486, 570]) {
      await page.evaluate((age) => window.fightingShowcase.seek(age), age)
      await page.clock.runFor(50)
      assert.equal(
        await page.evaluate(() => window.fightingShowcase.report().nativeState),
        report.nativeState,
      )
      await page.screenshot({ path: path.join(output, `${options.target}-${age}.png`) })
    }
    if (options.target === 'biscuit') {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.evaluate(() => window.fightingShowcase.seek(420))
      await page.clock.runFor(50)
      await page.screenshot({ path: path.join(output, 'mobile-short-target.png') })
      await page.setViewportSize({ width: 1280, height: 800 })
    }
    results.push(options)
    process.stdout.write(`Verified Lynch: ${options.target}, ${options.stage}, ${options.side}\n`)
  }
  await page.clock.resume()
  await page.goto(`${base}/ui-tests/fighting-victory/`)
  await page.waitForFunction(() => window.victoryFixture)
  await page.evaluate(async () => {
    await window.victoryFixture.pause(true)
    await window.victoryFixture.configure({
      winner: 'lynch',
      target: 'hisoka',
      side: 'opponent',
      stage: 'vip-casino',
    })
    await window.victoryFixture.finish()
  })
  const overlay = page.locator('[data-victory-cinematic]')
  await overlay.waitFor()
  assert.equal(await overlay.getAttribute('data-winner'), 'lynch')
  assert.equal(await overlay.getAttribute('data-target'), 'hisoka')
  assert.equal(await overlay.getAttribute('data-stage'), 'vip-casino')
  assert.equal((await page.request.get(`${base}/clash-victories/lynch.m4a`)).status(), 200)
  await page.evaluate(() => document.querySelector('.skip-victory')?.click())
  await overlay.waitFor({ state: 'detached' })
  assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().active), false)
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ results, errors }, null, 2))
  process.stdout.write(`Lynch checks passed: ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
