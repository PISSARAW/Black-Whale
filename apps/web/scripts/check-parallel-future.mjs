import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.FUTURE_CHECK_OUTPUT ?? '/tmp/black-whale-parallel-future-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/parallel-future/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const errors = []
let page
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/parallel-future/`)
  page.setDefaultTimeout(15000)
  await page.waitForFunction(() => window.futureFixture)
  await page.locator('.parallel-panel').waitFor()
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1100 })
    for (const phase of ['preparing', 'vision', 'diverging']) {
      const shown = await page.evaluate((phase) => window.futureFixture.showCase(phase), phase)
      assert.equal(shown.phase, phase)
      await page.locator('.parallel-panel').waitFor()
      assert.equal(await page.locator('.parallel-panel').count(), 1)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page.screenshot({ path: path.join(output, `${phase}-${width}.png`), fullPage: true })
    }
  }
  await page.evaluate(() => window.futureFixture.showCase('vision'))
  await page.getByRole('slider').fill('300')
  await page.getByRole('button', { name: 'Ouvrir les yeux et diverger' }).click()
  assert.equal(await page.evaluate(() => window.futureFixture.currentPhase()), 'diverging')
  await page.getByRole('button', { name: 'Vue P2', exact: true }).click()
  await page.getByText('La vue principale compare la réalité', { exact: false }).waitFor()
  await page.evaluate(() => window.futureFixture.showCase('vision', 'en'))
  await page.getByRole('button', { name: 'Open the eyes and diverge' }).waitFor()
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1100 })
    for (const phase of ['preparing', 'vision', 'hit', 'revealed']) {
      const result = await page.evaluate(
        (phase) => window.futureFixture.showArcadeCase(phase),
        phase,
      )
      assert.equal(await page.locator('.parallel-panel').count(), 0)
      assert.equal(await page.locator('[data-camera-detail="prediction"]').count(), 0)
      assert.equal(await page.getByText('Vous percevez le déroulement prédit.').count(), 0)
      const health = Number(
        await page.locator('.opponent-meter .health-bar').getAttribute('aria-valuenow'),
      )
      assert.equal(health, result.visibleHealth)
      assert.equal(result.phase, 'fighting')
      assert.equal(result.winner, null)
      if (phase === 'hit') {
        assert.ok(result.visibleHealth < result.realHealth)
        assert.notEqual(result.visibleX, result.realX)
      }
      if (phase === 'revealed') {
        assert.equal(result.visibleHealth, result.realHealth)
        assert.equal(result.visibleX, result.realX)
      }
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page.screenshot({
        path: path.join(output, `arcade-${phase}-${width}.png`),
        fullPage: true,
      })
    }
    const apparent = await page.evaluate(() => window.futureFixture.showArcadeCase('victory'))
    assert.equal(apparent.visibleWinner, 'player')
    assert.equal(apparent.winner, null)
    assert.equal(apparent.visibleWins, 1)
    assert.equal(apparent.realWins, 0)
    await page.locator('[data-victory-cinematic][data-winner="theta"]').waitFor()
    assert.equal(await page.locator('.parallel-panel').count(), 0)
    await page.screenshot({
      path: path.join(output, `arcade-victory-${width}.png`),
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Passer', exact: false }).click()
    await page.getByRole('heading', { name: 'VICTOIRE', exact: true }).waitFor()
    await page.getByText('remporte la manche', { exact: true }).waitFor()
    assert.equal(await page.locator('.results-fighter.won b').textContent(), '1')
    await page.screenshot({
      path: path.join(output, `arcade-false-results-${width}.png`),
      fullPage: true,
    })
    const revealed = await page.evaluate(() => window.futureFixture.reveal())
    assert.equal(revealed.visibleHealth, 1)
    assert.equal(revealed.realWins, 0)
    assert.equal(revealed.visibleX, revealed.realX)
    assert.equal(await page.locator('[data-victory-cinematic]').count(), 0)
    assert.equal(await page.locator('.fight-results').count(), 0)
    await page.screenshot({
      path: path.join(output, `arcade-victory-revealed-${width}.png`),
      fullPage: true,
    })
    await page.evaluate(() => window.futureFixture.showArcadeCase('victory'))
    await page.getByRole('button', { name: 'Passer', exact: false }).click()
    await page.getByRole('button', { name: 'Manche suivante', exact: false }).click()
    const continued = await page.evaluate(() => window.futureFixture.inspect())
    assert.equal(continued.realRound, 1)
    assert.equal(continued.visibleRound, 2)
    assert.equal(continued.realWins, 0)
    assert.equal(await page.locator('.fight-results').count(), 0)
    await page.evaluate(() => window.futureFixture.reveal())
    assert.equal((await page.evaluate(() => window.futureFixture.inspect())).visibleRound, 1)
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases: 25, errors }, null, 2))
  process.stdout.write(`Parallel Future UI: 25 cases passed; ${output}\n`)
} catch (error) {
  console.error({ errors, url: page?.url(), failure: String(error) })
  throw error
} finally {
  await browser.close()
  await server.close()
}
