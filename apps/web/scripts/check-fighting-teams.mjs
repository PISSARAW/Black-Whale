import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.TEAMS_CHECK_OUTPUT ?? '/tmp/black-whale-step8-browser'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: false,
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-teams/index.html'], holdUntilCrawlEnd: false },
  cacheDir: path.join(output, 'vite-cache'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-3d-apis', '--no-proxy-server'],
})
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
const page = await context.newPage(),
  errors = [],
  checks = []
page.setDefaultTimeout(60000)
page.setDefaultNavigationTimeout(120000)
page.on('pageerror', (error) => errors.push(error.message))
const url = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-teams/`
const button = (name) => page.getByRole('button', { name, exact: true })
const advance = (count) => page.evaluate((count) => window.teamsFixture.advance(count), count)
const snapshot = () => page.evaluate(() => window.teamsFixture.snapshot())
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
async function hitCover() {
  for (let i = 0; i < 8; i++) {
    if ((await snapshot()).entities[0].health === 0) return
    await page.keyboard.press('k')
    await advance(60)
  }
  assert.equal((await snapshot()).entities[0].health, 0)
}
async function finishRound() {
  for (let i = 0; i < 80; i++) {
    const state = await snapshot()
    if (state.phase === 'finished') return state
    if (state.player.x < state.opponent.x - 6) await page.keyboard.down('d')
    else await page.keyboard.up('d')
    await page.keyboard.press('k')
    await advance(45)
  }
  await advance(600)
  return snapshot()
}
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => Boolean(window.teamsFixture))
  await page.getByLabel('P1 · Combattant 1', { exact: true }).selectOption('halkenburg')
  await button('P1 · Monter Theta').click()
  await button('P1 · Monter Theta').click()
  assert.equal(await page.getByLabel('P1 · Combattant 1', { exact: true }).inputValue(), 'theta')
  await page.getByLabel('Couverts destructibles et actions d’arène', { exact: true }).check()
  await page.getByLabel('Arène', { exact: true }).selectOption('whale-hold')
  await button('Conserver cette sélection').click()
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('black-whale:clash:teams:draft:1')),
  )
  assert.deepEqual(saved.rosters.player, ['theta', 'halkenburg', 'hisoka'])
  for (const width of [1280, 390, 320]) await layout(width, 'selection-fr')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => Boolean(window.teamsFixture))
  assert.equal(await page.getByLabel('P1 · Combattant 1', { exact: true }).inputValue(), 'theta')
  assert.equal(
    await page.getByLabel('Couverts destructibles et actions d’arène', { exact: true }).isChecked(),
    true,
  )
  await button('Préparer les équipes').click()
  await button('Commencer la manche').waitFor()
  await button('Quitter les équipes').click()
  await button('Essai de combat').click()
  await button('Commencer la manche').click()
  const p1 = page.getByRole('region', { name: 'P1', exact: true })
  assert.equal(
    await p1.getByRole('button', { name: 'P1 · Appeler Kurapika', exact: true }).isDisabled(),
    true,
  )
  await p1.getByText('Rejoins ton bord', { exact: false }).first().waitFor()
  await button('Pause').click()
  const frozen = (await snapshot()).frame
  await advance(60)
  assert.equal((await snapshot()).frame, frozen)
  await button('Reprendre').click()
  await hitCover()
  assert.equal((await snapshot()).entities[0].health, 0)
  await page.keyboard.down('q')
  await advance(100)
  await page.keyboard.up('q')
  await p1.getByRole('button', { name: 'P1 · Appeler Kurapika', exact: true }).click()
  await advance(1)
  assert.equal((await snapshot()).player.id, 'kurapika')
  await advance(700)
  assert.equal((await snapshot()).player.id, 'hisoka')
  assert.equal((await snapshot()).team.seats.player.assistUsed, true)
  assert.equal((await snapshot()).entities[0].health, 0)
  for (const width of [1280, 390, 320]) await layout(width, 'relay-used-fr')
  const won = await finishRound()
  await page.keyboard.up('d')
  assert.equal(won.phase, 'finished')
  assert.equal(won.winner, 'player')
  await button('Prochain combattant').click()
  const next = await snapshot()
  assert.equal(next.opponent.id, 'chrollo')
  assert.equal(next.entities[0].health, 0)
  assert.equal(next.player.health, won.player.health)
  assert.equal(next.player.aura, won.player.aura)
  await page.evaluate(() => window.teamsFixture.english())
  await button('Start round').waitFor()
  for (const width of [320, 390, 1280]) await layout(width, 'next-entry-en')
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        passed: true,
        checks,
        savedOrder: saved.rosters.player,
        realRelay: true,
        realRoundVictory: true,
        physicalCoverPreserved: true,
        resourcesPreserved: true,
        errors,
      },
      null,
      2,
    ),
  )
  process.stdout.write(
    `Teams UI: ${checks.length} layouts, saved formation, actual keyboard relay, destruction and round transition passed.\n`,
  )
} finally {
  await context.close()
  await browser.close()
  await server.close()
}
