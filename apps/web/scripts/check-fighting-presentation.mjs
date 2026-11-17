import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.PRESENTATION_CHECK_OUTPUT ?? '/tmp/black-whale-step9-browser'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: false,
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: {
    entries: ['ui-tests/fighting-presentation/index.html'],
    holdUntilCrawlEnd: false,
  },
  cacheDir: path.join(output, 'vite-cache'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-proxy-server',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  reducedMotion: 'reduce',
})
const page = await context.newPage(),
  errors = [],
  checks = []
page.setDefaultTimeout(60000)
page.setDefaultNavigationTimeout(120000)
page.on('pageerror', (error) => errors.push(error.message))
const title = () => page.getByLabel('Titre du profil local', { exact: true })
const ceremony = page.locator('[data-ceremony]')
async function layout(width, name) {
  await page.setViewportSize({ width, height: 1000 })
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
  )
  await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true })
  checks.push(`${name}:${width}`)
}
try {
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-presentation/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => Boolean(window.presentationFixture))
  await page.locator('h2').waitFor()
  await writeFile(path.join(output, 'boot.html'), await page.content())
  assert.equal(await title().inputValue(), 'none')
  assert.equal(
    await title()
      .locator('option[value="reading"]')
      .evaluate((option) => option.disabled),
    true,
  )
  assert.equal(
    await page
      .getByLabel('P1 · tenue', { exact: true })
      .locator('option[value="ivory"]')
      .evaluate((option) => option.disabled),
    true,
  )
  await page.getByLabel('P1 · tenue', { exact: true }).selectOption('slate')
  for (const width of [1280, 390, 320]) await layout(width, 'collection-fr')
  assert.deepEqual(await page.evaluate(() => window.presentationFixture.earnReading()), ['reading'])
  await title().selectOption('reading')
  assert.match(await ceremony.textContent(), /Profil local · Éclaireur/)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => Boolean(window.presentationFixture))
  assert.equal(await title().inputValue(), 'reading')
  assert.equal(await page.getByLabel('P1 · tenue', { exact: true }).inputValue(), 'slate')
  checks.push('real-solo-reward-equip-reload')
  await page.evaluate(() => window.presentationFixture.intro('brief'))
  assert.doesNotMatch(await ceremony.textContent(), /Je ne te perds/)
  await page.evaluate(() => window.presentationFixture.intro('off'))
  assert.equal(await ceremony.locator('.ceremony').count(), 0)
  await page.evaluate(() => window.presentationFixture.intro('full'))
  assert.match(await ceremony.textContent(), /Je ne te perds pas de vue/)
  await page.evaluate(() => window.presentationFixture.verdict('time'))
  assert.match(await ceremony.textContent(), /Duel terminé. Le temps est écoulé/)
  await page.evaluate(() => window.presentationFixture.verdict('round'))
  assert.match(await ceremony.textContent(), /Manche terminée/)
  for (const kind of ['cat', 'draw', 'future']) {
    await page.evaluate((kind) => window.presentationFixture.verdict(kind), kind)
    assert.equal(await ceremony.locator('.ceremony').count(), 0)
  }
  checks.push('ceremony-preferences-and-resolved-endings')
  await page.evaluate(() => window.presentationFixture.english())
  for (const width of [1280, 390, 320]) await layout(width, 'collection-en')
  await page.getByText('Outfit preview', { exact: true }).click()
  await page.waitForSelector('.preview-scene .fight-scene.ready')
  await page.waitForFunction(() => Boolean(document.querySelector('canvas')?.width > 1))
  assert.equal(
    await page.getByLabel('Preview character', { exact: true }).locator('option').count(),
    40,
  )
  await page.getByLabel('Preview character', { exact: true }).selectOption('franklin')
  await page.waitForSelector('.preview-scene[data-fighter=franklin] .fight-scene.ready')
  await layout(1280, 'preview-en')
  await layout(390, 'preview-en')
  checks.push('live-webgl-preview-forty-fighters')
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ checks, errors }, null, 2))
} catch (error) {
  await writeFile(
    path.join(output, 'failure.json'),
    JSON.stringify({ message: String(error), errors }, null, 2),
  )
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true })
  throw error
} finally {
  await browser.close()
  await server.close()
}
