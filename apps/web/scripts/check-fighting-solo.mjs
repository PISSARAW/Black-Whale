import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.SOLO_CHECK_OUTPUT ?? '/tmp/black-whale-step7-browser'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: false,
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-solo/index.html'], holdUntilCrawlEnd: false },
  cacheDir: path.join(output, 'vite-cache'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-3d-apis', '--no-proxy-server'],
})
const errors = [],
  checks = []
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
const page = await context.newPage()
page.setDefaultTimeout(60000)
page.setDefaultNavigationTimeout(120000)
page.on('pageerror', (error) => errors.push(error.message))
const url = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-solo/`
const button = (name) => page.getByRole('button', { name, exact: true })
const advance = (count, input = {}) =>
  page.evaluate(({ count, input }) => window.soloFixture.advance(count, input), { count, input })
const move = (action) => page.evaluate((action) => window.soloFixture.move(action), action)
const snapshot = () => page.evaluate(() => window.soloFixture.snapshot())
async function layout(width, name) {
  await page.setViewportSize({ width, height: 1000 })
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    true,
    name,
  )
  await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true })
  checks.push(`${name}:${width}`)
}
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => Boolean(window.soloFixture))
  for (const width of [1280, 390, 320]) await layout(width, 'launcher-fr')
  await page.getByLabel('Mode solo', { exact: true }).selectOption('survival')
  assert.equal(
    await page.getByLabel('Personnage pour les duels', { exact: true }).locator('option').count(),
    6,
  )
  await page.getByLabel('Mode solo', { exact: true }).selectOption('time-attack')
  assert.equal(
    await page.getByLabel('Personnage pour les duels', { exact: true }).locator('option').count(),
    40,
  )
  await page.getByLabel('Mode solo', { exact: true }).selectOption('score-attack')
  await page
    .getByText('Marque sur les dégâts et contacts réels pendant trois minutes.', { exact: false })
    .waitFor()
  await page.getByLabel('Mode solo', { exact: true }).selectOption('story')
  await button('Démarrer une nouvelle partie').click()
  for (const width of [320, 1280]) await layout(width, 'briefing-fr')
  await button('Commencer la rencontre').click()
  await button('Pause').click()
  await advance(60, { gyo: true })
  assert.equal((await snapshot()).run.elapsed, 0)
  await button('Reprendre').click()
  await advance(30, { gyo: true })
  await button('Rencontre suivante').waitFor()
  assert.equal((await snapshot()).run.status, 'won')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await button('Ouvrir la partie sauvegardée').click()
  await button('Rencontre suivante').click()
  await button('Commencer la rencontre').click()
  await advance(14, { right: true })
  await move('light')
  await advance(15)
  await button('Rencontre suivante').click()
  await button('Commencer la rencontre').click()
  await move('special')
  await advance(1)
  await move('light')
  await advance(30)
  await page.getByText('Titre local débloqué', { exact: false }).waitFor()
  assert.equal((await snapshot()).run.status, 'complete')
  assert.deepEqual((await snapshot()).routes, ['reading'])
  for (const width of [1280, 390, 320]) await layout(width, 'ending-fr')
  await button('Retour aux parcours').click()
  await page.getByText('Éclaireur · Lire une manifestation', { exact: true }).click()
  await page.evaluate(() => window.soloFixture.english())
  await page.getByText('Scout · Read a manifestation', { exact: true }).waitFor()
  for (const width of [320, 1280]) await layout(width, 'collection-en')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByText('Éclaireur · Lire une manifestation', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        passed: true,
        checks,
        savedEnding: true,
        pause: true,
        survivorCount: 6,
        duelFighters: 40,
        errors,
      },
      null,
      2,
    ),
  )
  process.stdout.write(
    `Solo UI: ${checks.length} layouts, complete reading route, pause, reload and title passed.\n`,
  )
} finally {
  await context.close()
  await browser.close()
  await server.close()
}
