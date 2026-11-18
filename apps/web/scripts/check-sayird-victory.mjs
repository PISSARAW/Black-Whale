import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/fighting-sayird-wiring')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: ['ui-tests/fighting-victory/index.html'],
  },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-unsafe-swiftshader'],
})
const errors = [],
  results = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.setDefaultTimeout(120000)
  page.on('response', (response) => {
    if (response.status() >= 400)
      process.stderr.write(`HTTP ${response.status()}: ${response.url()}\n`)
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
      process.stderr.write(JSON.stringify(message.location()) + '\n')
    }
  })
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  await page.goto(`${base}/ui-tests/fighting-victory/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.victoryFixture)
  for (const winner of ['sayird'])
    for (const side of ['player', 'opponent'])
      for (let repeat = 0; repeat < 2; repeat++) {
        const target = side === 'player' ? 'franklin' : 'kalluto'
        const stage = side === 'player' ? 'vip-casino' : 'whale-hold'
        const options = {
          winner,
          target,
          side,
          stage,
          mode: repeat === 0 ? 'versus-ai' : 'versus-local',
        }
        process.stdout.write(`Checking ${winner}: ${side}, victory ${repeat + 1}\n`)
        await page.evaluate((options) => window.victoryFixture.configure(options), options)
        await page.locator('.fight-scene.ready').waitFor()
        process.stdout.write('Scene ready\n')
        await page.evaluate(() => window.victoryFixture.pause(true))
        await page.evaluate(() => window.victoryFixture.finish())
        const overlay = page.locator('[data-victory-cinematic]')
        await overlay.waitFor()
        process.stdout.write('Victory started\n')
        assert.equal(await overlay.getAttribute('data-winner'), winner)
        assert.equal(await overlay.getAttribute('data-target'), target)
        assert.equal(await overlay.getAttribute('data-stage'), stage)
        const state = await page.evaluate(() => window.victoryFixture.snapshot().state)
        await page.waitForFunction(
          (winner) =>
            [...document.querySelectorAll('audio')].some((audio) =>
              audio.src.endsWith(`/clash-victories/${winner}.m4a`),
            ),
          winner,
        )
        assert.equal(
          (await page.request.get(`${base}/clash-victories/${winner}.m4a`)).status(),
          200,
        )
        await page.locator('.skip-victory').click()
        await overlay.waitFor({ state: 'detached' })
        assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().active), false)
        await page
          .getByRole('button', { name: /Rejouer|Revanche/i })
          .first()
          .waitFor()
        assert.equal(await page.evaluate(() => window.victoryFixture.snapshot().state), state)
        results.push(options)
        process.stdout.write(
          `Verified ${winner}: ${side}, ${options.mode}, victory ${repeat + 1}\n`,
        )
      }
  const presentations = []
  for (const profile of [
    { target: 'franklin', side: 'player', width: 1280, height: 720, reduced: false },
    { target: 'kalluto', side: 'opponent', width: 1280, height: 720, reduced: false },
    { target: 'sayird', side: 'player', width: 1280, height: 720, reduced: false },
    { target: 'biscuit', side: 'opponent', width: 390, height: 844, reduced: true },
  ]) {
    await page.setViewportSize({ width: profile.width, height: profile.height })
    await page.goto(
      `${base}/demos/fighting-showcase/sayird-fatality.html?target=${profile.target}&side=${profile.side}${profile.reduced ? '&reduced' : ''}`,
      { waitUntil: 'domcontentloaded' },
    )
    await page.waitForFunction(() => window.fightingShowcase?.ready())
    const initial = await page.evaluate(() => window.fightingShowcase.report())
    assert.equal(initial.failed, false)
    for (const frame of [0, 66, 150, 204, 310, 414, 468, 570]) {
      await page.evaluate(async (frame) => {
        await window.fightingShowcase.seek(frame)
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      }, frame)
      assert.equal(
        (await page.evaluate(() => window.fightingShowcase.report())).nativeState,
        initial.nativeState,
      )
    }
    await page.screenshot({
      path: path.join(output, `${profile.target}-${profile.side}-${profile.width}.png`),
    })
    presentations.push(profile)
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ results, presentations, errors }, null, 2),
  )
  process.stdout.write(`Sayird live victory checks passed: ${output}\n`)
} catch (error) {
  process.stderr.write(`${error.stack}\n`)
  throw error
} finally {
  await browser.close()
  await server.close()
}
