import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.ROSTER_CHECK_OUTPUT ?? '/tmp/black-whale-roster-quality'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-roster/index.html'] },
  resolve: {
    alias: {
      $lib: path.join(root, 'src/lib'),
      '$app/stores': path.join(root, 'ui-tests/fighting-roster/appStores.ts'),
    },
  },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
let browser
const errors = []
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  page.on('pageerror', (error) => errors.push(error.message))
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  await page.goto(`${base}/ui-tests/fighting-roster/`)
  await page.waitForFunction(() => Boolean(window.rosterFixture))
  const roster = await page.evaluate(() => window.rosterFixture.roster())
  assert.equal(roster.length, 40)
  const routesTotal = roster.reduce((sum, fighter) => sum + fighter.routes, 0)
  const portraits = []
  for (const { id, name, routes } of roster) {
    await page.evaluate((id) => window.rosterFixture.select(id), id)
    const dossier = page.locator(`[data-fighter-dossier="${id}"]`)
    await dossier.waitFor()
    await page.locator('.showcase-portrait img').waitFor({ timeout: 30000 })
    await dossier.locator('summary').click()
    assert.equal(await dossier.locator('dt').count(), 3)
    assert.match(await dossier.innerText(), new RegExp(`${routes} routes`))
    assert.equal(await page.locator('.showcase-portrait .failed').count(), 0)
    const file = `${id}.png`
    await page.locator('.character-showcase').screenshot({ path: path.join(output, file) })
    portraits.push({ id, name, file })
  }
  await page.evaluate(() => window.rosterFixture.show('academy'))
  const select = page.getByRole('combobox', { name: 'Personnage des exercices' })
  assert.equal(await select.locator('option').count(), 40)
  await page
    .getByText(`École de combat · ${routesTotal} routes et défense`, { exact: true })
    .waitFor()
  for (const { id, routes: routeCount } of roster) {
    await select.selectOption(id)
    assert.equal(await page.getByRole('button', { name: /^Pratiquer ·/ }).count(), routeCount)
    assert.equal(await page.getByRole('button', { name: /^Démontrer ·/ }).count(), routeCount)
    await page.getByRole('button', { name: 'Défense · bloquer puis punir' }).waitFor()
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 950 })
    await page.evaluate(() => window.rosterFixture.show('selection'))
    for (const id of ['biscuit', 'franklin', 'kalluto', 'longhi', 'sayird', 'yokotani']) {
      await page.evaluate((id) => window.rosterFixture.select(id), id)
      await page.locator('.showcase-portrait img').waitFor()
      await page.locator(`[data-fighter-dossier="${id}"] summary`).click()
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      )
      await page.screenshot({ path: path.join(output, `${id}-${width}.png`), fullPage: true })
    }
  }
  await page.evaluate(() => window.rosterFixture.translate('en'))
  assert.match(await page.locator('.fighter-dossier').innerText(), /Counterplay/)
  assert.equal(await page.locator('.failed').count(), 0)
  assert.deepEqual(errors, [])
  const gallery = `<!doctype html><meta charset="utf-8"><title>Black Whale Clash — 40 personnages</title><style>body{background:#110b1a;color:#f2e9fa;font:18px sans-serif;margin:30px}h1{font-size:28px}main{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}figure{margin:0;min-width:0}img{width:100%;height:300px;object-fit:cover;object-position:top}figcaption{padding:8px}</style><h1>BLACK WHALE CLASH · 40 PERSONNAGES</h1><main>${portraits.map(({ name, file }) => `<figure><img src="${file}"><figcaption>${name}</figcaption></figure>`).join('')}</main>`
  await writeFile(path.join(output, 'gallery.html'), gallery)
  await page.setViewportSize({ width: 2000, height: 1900 })
  await page.goto(pathToFileURL(path.join(output, 'gallery.html')).href)
  await page.screenshot({ path: path.join(output, 'roster-40.png'), fullPage: true })
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        passed: true,
        portraits: 40,
        routes: routesTotal,
        defense: 40,
        widths: [1440, 390, 320],
        errors,
      },
      null,
      2,
    ),
  )
  process.stdout.write(
    `Roster UI verified: 40 portraits, ${routesTotal} routes, 40 defense exercises. ${output}\n`,
  )
} finally {
  await browser?.close()
  await server.close()
}
