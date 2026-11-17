import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.COMBO_CHECK_OUTPUT ?? '/tmp/black-whale-combo-depth'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-combo-depth/index.html'] },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
let browser
const errors = []
const completed = []
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-combo-depth/`,
  )
  await page.waitForFunction(() => Boolean(window.comboFixture))
  const catalog = page.locator('.combat-school > details')
  const fighters = await page.evaluate(() => window.comboFixture.fighters())
  for (const fighter of fighters) {
    if (!(await catalog.evaluate((node) => node.open))) await catalog.locator('summary').click()
    await page.getByRole('combobox', { name: 'Personnage des exercices' }).selectOption(fighter)
    assert.equal(await page.getByRole('button', { name: /^Démontrer ·/ }).count(), 8)
    const titles = await page.getByRole('button', { name: /^Démontrer ·/ }).allTextContents()
    for (const title of titles) {
      if (!(await catalog.evaluate((node) => node.open))) await catalog.locator('summary').click()
      await page.getByRole('button', { name: title.trim(), exact: true }).click()
      if (title.includes('Précision · liaison') || title.includes('Charge préparée · liaison')) {
        await page.evaluate(() => window.comboFixture.advance(240, 2))
        assert.match(await page.locator('.active-exercise').innerText(), /Liaison : attends/)
        assert.match(await page.locator('.combo-choices').innerText(), /liaison/i)
        await page.locator('main').screenshot({ path: path.join(output, `${fighter}-link.png`) })
      }
      if (title.includes('Rafale longue')) {
        await page.evaluate(() => window.comboFixture.advance(240, 3))
        for (let batch = 0; batch < 10; batch++) {
          await page.evaluate(() => window.comboFixture.advance(10))
          const sample = await page.evaluate(() => window.comboFixture.snapshot())
          if (sample.progress.stepHits > 0) break
        }
        const firing = await page.evaluate(() => window.comboFixture.snapshot())
        assert.equal(firing.progress.complete, false)
        assert.ok(firing.progress.stepHits > 0 && firing.progress.stepHits < 20)
        assert.match(await page.locator('.active-exercise').innerText(), /Impacts de la rafale/)
        await page
          .locator('.combat-school')
          .screenshot({ path: path.join(output, 'franklin-barrage.png') })
      }
      await page.evaluate(() => window.comboFixture.advance(240))
      const result = await page.evaluate(() => window.comboFixture.snapshot())
      assert.equal(result.progress.complete, true, title)
      assert.equal(result.progress.failed, false, title)
      completed.push({ fighter, title: title.trim(), combo: result.combo })
    }
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 950 })
    if (!(await catalog.evaluate((node) => node.open))) await catalog.locator('summary').click()
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    )
    await page
      .locator('.combat-school')
      .screenshot({ path: path.join(output, `academy-${width}.png`) })
  }
  await page.evaluate(() => window.comboFixture.remap())
  assert.match(await page.locator('.move-properties').first().innerText(), /c/i)
  await page.evaluate(() => window.comboFixture.translate('en'))
  assert.match(await page.locator('.combat-school').innerText(), /No aura cost/)
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, completed, widths: [1280, 390, 320], errors }, null, 2),
  )
  process.stdout.write(
    `Combo UI verified: ${completed.length} demonstrations, FR/EN, remapped controls, mobile. ${output}\n`,
  )
} finally {
  await browser?.close()
  await server.close()
}
