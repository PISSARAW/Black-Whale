import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.PAPER_DOCUMENT_OUTPUT ?? '/tmp/black-whale-paper-document-ui'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-preparation/index.html'] },
  server: { host: '127.0.0.1', port: 0, watch: null, hmr: false },
  logLevel: 'error',
})
await server.listen()
let browser
let page
const errors = []
const cases = []
try {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--enable-unsafe-swiftshader'],
  })
  page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
  page.setDefaultTimeout(60000)
  page.setDefaultNavigationTimeout(60000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-preparation/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForFunction(() => window.preparationFixture)
  for (const width of [1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const side of ['player', 'opponent']) {
      await page.evaluate((value) => window.preparationFixture.preparePaperDocument(value), side)
      await page.waitForSelector('.fight-scene.ready')
      const snapshot = () =>
        page.evaluate((value) => window.preparationFixture.paperSnapshot(value), side)
      const panel = page
        .getByRole('region', { name: 'Arsenal rétrospectif' })
        .nth(side === 'player' ? 0 : 1)
      const press = async (name) => {
        process.stdout.write(`${width} ${side}: ${name}\n`)
        await panel.getByRole('button', { name, exact: true }).press('Enter')
      }
      const id = 'player:scenario-document'
      await press(`Papier · Prendre ${id}`)
      await press(`Texture Surprise · Choisir ${id}`)
      const draft = 'Document 01 · 21:00'
      await panel
        .getByRole('textbox', { name: 'Texture Surprise · Texte apparent sur la feuille' })
        .fill(draft)
      await press('Préparer ce texte apparent')
      await press('Texture Surprise · Appliquer sur le support choisi')
      await page.evaluate(() => window.preparationFixture.advance(45))
      const masked = await snapshot()
      assert.equal(masked.ink, 'Document 01 · 18:00')
      assert.equal(masked.appearance, draft)
      assert.equal(masked.layers.length, 1)
      await press(`Papier · Lire ${id}`)
      await panel.getByRole('status').filter({ hasText: draft }).waitFor()
      if (width === 1100)
        await page.locator('.arena').screenshot({ path: path.join(output, `${side}-paper.png`) })
      await press(`Texture Surprise · Retirer le texte de ${id}`)
      const removed = await snapshot()
      assert.equal(removed.appearance, removed.ink)
      assert.equal(removed.reading.text, draft)
      await press(`Papier · Lire ${id}`)
      assert.equal((await snapshot()).reading.text, removed.ink)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      cases.push({ width, side })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ cases, errors }, null, 2))
  process.stdout.write(`Paper document UI passed: ${cases.length} cases.\n`)
} catch (error) {
  await writeFile(
    path.join(output, 'failure.json'),
    JSON.stringify({ cases, errors, message: String(error) }, null, 2),
  )
  if (page)
    await page
      .screenshot({ path: path.join(output, 'failure.png'), fullPage: false })
      .catch(() => {})
  throw error
} finally {
  await browser?.close()
  await server.close()
}
