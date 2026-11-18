import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = path.join(root, 'output/fighting-lynch-wiring')
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
  args: process.platform === 'darwin' ? ['--use-angle=metal'] : ['--enable-unsafe-swiftshader'],
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
  await page.goto(`${base}/ui-tests/fighting-victory/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.victoryFixture)
  for (const winner of ['lynch'])
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
        await page.evaluate(() => window.victoryFixture.pause(true))
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
        if (side === 'player' && repeat === 0)
          await page.evaluate(() => window.victoryFixture.pause(false))
        if (side !== 'player' || repeat !== 0)
          await page.evaluate(() => document.querySelector('.skip-victory')?.click())
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
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ results, errors }, null, 2))
  process.stdout.write(`Lynch live victory checks passed: ${output}\n`)
} catch (error) {
  process.stderr.write(`${error.stack}\n`)
  throw error
} finally {
  await browser.close()
  await server.close()
}
