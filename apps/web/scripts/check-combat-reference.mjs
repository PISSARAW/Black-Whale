import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, '../../output/clash-reference-ui')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-reference/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
let browser
const errors = []
let checked = 0
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-reference/`,
  )
  await page.waitForFunction(() => Boolean(window.referenceFixture))
  await page.locator('summary').click()
  for (const fighter of ['kurapika', 'benjamin', 'hisoka', 'chrollo', 'feitan', 'phinks']) {
    await page.getByLabel('Combattant de référence').selectOption(fighter)
    for (const terrain of ['neutral', 'interactive']) {
      await page.getByLabel('Terrain de référence').selectOption(terrain)
      for (const situation of [
        'spacing',
        'approach',
        'projectiles',
        'throws',
        'corner',
        'wakeup',
        'preparation',
      ]) {
        await page.getByLabel('Situation de référence').selectOption(situation)
        await page.getByRole('button', { name: 'Lancer la situation de référence' }).click()
        const first = await page.evaluate(() => window.referenceFixture.snapshot())
        assert.equal(first.fighter, fighter)
        assert.equal(first.opponent, situation === 'projectiles' ? 'franklin' : 'benjamin')
        assert.equal(first.environment.arenaInteractions, terrain === 'interactive')
        assert.equal(first.frame, 0)
        assert.equal(first.dummy.behavior, situation === 'wakeup' ? 'reversal' : 'manual')
        assert.equal(first.resources.player.infiniteAura, false)
        await page.getByRole('button', { name: 'Lancer la situation de référence' }).click()
        assert.deepEqual(await page.evaluate(() => window.referenceFixture.snapshot()), first)
        checked++
      }
    }
  }
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page.locator('main').screenshot({ path: path.join(output, `reference-${width}.png`) })
  }
  await page.evaluate(() => window.referenceFixture.translate('en'))
  await page.getByLabel('Reference fighter').selectOption('hisoka')
  await page.getByRole('button', { name: 'Launch reference situation' }).click()
  assert.equal((await page.evaluate(() => window.referenceFixture.snapshot())).fighter, 'hisoka')
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      { passed: true, checked, widths: [1440, 390, 320], languages: ['fr', 'en'], errors },
      null,
      2,
    ),
  )
  process.stdout.write(`Reference UI: ${checked} fixed starts, FR/EN, three widths. ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
