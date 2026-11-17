import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/fighting-personal-guard-validation')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: [
      'demos/fighting-showcase/personal-guard.html',
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
  await page.clock.install()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  for (const hero of process.argv.includes('--furykov-only') ? ['furykov'] : ['longhi', 'furykov'])
    for (const variant of process.argv.includes('--furykov-only')
      ? [
          { target: 'hisoka', stage: 'whale-hold', side: 'opponent' },
          { target: 'franklin', stage: 'heavens-arena', side: 'player' },
          { target: 'biscuit', stage: 'screening-room', side: 'player' },
          { target: 'longhi', stage: 'whale-hold', side: 'opponent', reduced: '1' },
        ]
      : [
          { target: 'benjamin', stage: 'heavens-arena', side: 'opponent' },
          { target: 'biscuit', stage: 'screening-room', side: 'player' },
          { target: hero, stage: 'whale-hold', side: 'opponent', reduced: '1' },
        ]) {
      const options = { ...variant, hero }
      await page.clock.resume()
      await page.goto(
        `${base}/demos/fighting-showcase/personal-guard.html?${new URLSearchParams(options)}`,
        { waitUntil: 'domcontentloaded' },
      )
      await page.waitForFunction(() => window.fightingShowcase?.ready())
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 120000)))
      const report = await page.evaluate(() => window.fightingShowcase.report())
      assert.equal(report.failed, false)
      assert.equal(report.winner, options.side)
      assert.equal(report.target, options.target)
      assert.equal(report.stageId, options.stage)
      assert.equal(report.hero, hero)
      if (hero === 'furykov') {
        assert.equal(report.abilityProof.preparedBeforeFight, true)
        assert.equal(report.abilityProof.decipherComplete, true)
        assert.equal(report.abilityProof.fabricationComplete, true)
        assert.equal(report.abilityProof.target, options.target)
      }
      assert.equal(report.physicalKnockout, true)
      assert.equal(report.noNewNenDamage, true)
      for (const age of [0, 60, 108, 144, 180, 216, 240, 276, 336, 414, 468, 510, 570]) {
        await page.evaluate((age) => window.fightingShowcase.seek(age), age)
        await page.clock.runFor(50)
        assert.equal(
          await page.evaluate(() => window.fightingShowcase.report().nativeState),
          report.nativeState,
        )
        await page.screenshot({ path: path.join(output, `${hero}-${options.target}-${age}.png`) })
      }
      if (options.target === 'biscuit') {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.evaluate(() => window.fightingShowcase.seek(420))
        await page.clock.runFor(50)
        await page.screenshot({ path: path.join(output, `${hero}-mobile-short-target.png`) })
        await page.setViewportSize({ width: 1280, height: 800 })
      }
      results.push(options)
      process.stdout.write(`Verified guard: ${options.target}, ${options.stage}, ${options.side}\n`)
    }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ results, errors }, null, 2))
  process.stdout.write(`Personal guard demo checks passed: ${output}\n`)
} finally {
  await browser.close()
  await server.close()
}
