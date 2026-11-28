import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/fighting-camilla-validation')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    holdUntilCrawlEnd: false,
    entries: [
      'demos/fighting-showcase/camilla-fatality.html',
      'ui-tests/fighting-victory/index.html',
    ],
  },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({
  executablePath: existsSync(chrome) ? chrome : undefined,
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
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
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  const seek = (age) =>
    page.evaluate(async (age) => {
      await window.fightingShowcase.seek(age)
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    }, age)
  for (const options of [
    { target: 'musse', stage: 'camilla-salon', side: 'player' },
    { target: 'chrollo', stage: 'camilla-salon', side: 'player' },
    { target: 'franklin', stage: 'heavens-arena', side: 'opponent' },
    { target: 'biscuit', stage: 'screening-room', side: 'player' },
    { target: 'camilla', stage: 'whale-hold', side: 'opponent', reduced: '1' },
  ]) {
    await page.goto(
      `${base}/demos/fighting-showcase/camilla-fatality.html?${new URLSearchParams(options)}`,
      { waitUntil: 'domcontentloaded' },
    )
    await page.waitForFunction(() => window.fightingShowcase?.ready())
    const report = await page.evaluate(() => window.fightingShowcase.report())
    assert.equal(report.failed, false)
    assert.equal(report.winner, options.side)
    assert.equal(report.target, options.target)
    assert.equal(report.stageId, options.stage)
    assert.ok(report.postMortemFrames > 0)
    assert.equal(report.victory.revealFrame, 120)
    assert.equal(report.victory.tailChargedFrame, 378)
    assert.ok(report.victory.inhaleFrame - report.victory.returnFrame >= 42)
    assert.ok(report.victory.inhaleFrame < report.victory.eyeOpeningFrame)
    assert.ok(report.victory.eyeOpeningFrame < report.victory.verdictFrame)
    const beats = [12, 107, 144, 230, 320, 365, 400, 434, 463, 491, 515, 594]
    if (options.target === 'musse') beats.push(28, 53, 259, 273, 468, 501, 520, 531, 552)
    for (const age of beats) {
      await seek(age)
      assert.equal(
        await page.locator('.cinematic-verdict').count(),
        Number(age >= report.victory.verdictFrame),
      )
      assert.equal(
        await page.evaluate(() => window.fightingShowcase.report().nativeState),
        report.nativeState,
      )
      await page.screenshot({ path: path.join(output, `${options.target}-${age}.png`) })
    }
    if (options.target === 'biscuit') {
      await page.setViewportSize({ width: 390, height: 844 })
      await seek(515)
      await page.screenshot({ path: path.join(output, 'mobile-short-target.png') })
      await page.setViewportSize({ width: 1280, height: 800 })
    }
    results.push(options)
    process.stdout.write(`Verified Camilla: ${options.target}, ${options.stage}, ${options.side}\n`)
  }
  await page.goto(`${base}/ui-tests/fighting-victory/`)
  await page.waitForFunction(() => window.victoryFixture)
  await page.evaluate(async () => {
    await window.victoryFixture.configure({
      winner: 'camilla',
      target: 'hisoka',
      side: 'opponent',
      stage: 'vip-casino',
    })
    await window.victoryFixture.finish()
  })
  const overlay = page.locator('[data-victory-cinematic]')
  await overlay.waitFor()
  assert.equal(await overlay.getAttribute('data-winner'), 'camilla')
  assert.equal(await overlay.getAttribute('data-target'), 'hisoka')
  assert.equal(await overlay.getAttribute('data-stage'), 'vip-casino')
  assert.equal((await page.request.get(`${base}/clash-victories/camilla.m4a`)).status(), 200)
  await page.keyboard.press('Escape')
  await overlay.waitFor({ state: 'detached' })
  assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().active), false)
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ results, errors }, null, 2))
  process.stdout.write(`Camilla checks passed: ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
