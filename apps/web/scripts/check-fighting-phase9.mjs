import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url)),
  output = process.env.PHASE9_CHECK_OUTPUT ?? '/tmp/black-whale-phase9-ui'
await mkdir(output, { recursive: true })
const data = await mkdtemp(path.join(tmpdir(), 'clash-phase9-ui-'))
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [
    svelte({ configFile: false }),
    {
      name: 'phase9-api',
      configureServer(vite) {
        vite.middlewares.use(serve)
      },
    },
  ],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  optimizeDeps: { entries: ['ui-tests/fighting-phase9/index.html'], holdUntilCrawlEnd: false },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
const { ClashSeasons } = await server.ssrLoadModule('/src/lib/server/clashSeasons.ts')
const { seasonFile } = await server.ssrLoadModule('/src/lib/server/clashSeasonFile.ts')
const { ClashPvpRegistry } = await server.ssrLoadModule('/src/lib/server/clashPvp.ts')
const { createFightEnvironment } = await server.ssrLoadModule(
  '/src/lib/fighting/fightEnvironment.ts',
)
const { PVP_RULESET } = await server.ssrLoadModule('/src/lib/fighting/pvp/types.ts')
let now = Date.UTC(2026, 10, 16),
  seasons = new ClashSeasons(() => now, undefined, seasonFile(path.join(data, 'seasons.json')))
async function serve(req, res, next) {
  if (!req.url?.startsWith('/__')) return next()
  let body = ''
  for await (const chunk of req) body += chunk.toString()
  let result
  if (req.url === '/__season')
    result =
      req.method === 'POST'
        ? seasons.register(JSON.parse(body).name)
        : { ...seasons.leaderboard(), ...seasons.status() }
  else if (req.url === '/__restart') {
    seasons = new ClashSeasons(() => now, undefined, seasonFile(path.join(data, 'seasons.json')))
    result = seasons.status()
  } else {
    const a = seasons.identify(req.headers.authorization?.slice(7) ?? ''),
      b = seasons.register('Opponent')
    if (!a) {
      res.statusCode = 401
      res.end('{}')
      return
    }
    const registry = new ClashPvpRegistry(() => now, undefined, seasons)
    const host = registry.create(
      {
        player: 'theta',
        opponent: 'hisoka',
        formatId: 'knockout',
        environment: createFightEnvironment(),
      },
      a,
    )
    const guest = registry.join(host.matchId, PVP_RULESET, {
      invitation: host.inviteHref.split('#')[1],
      profile: b,
    })
    const view = () => registry.view(host.matchId, host.token)
    const ready = () => {
      for (const token of [host.token, guest.token])
        registry.ready(host.matchId, { token, ruleset: PVP_RULESET, configHash: view().configHash })
    }
    ready()
    for (let sequence = 0; sequence < 2000 && view().status !== 'finished'; sequence++) {
      if (view().status === 'ready') ready()
      registry.submit(host.matchId, {
        token: host.token,
        packet: { sequence, input: 0, commands: [{ kind: 'move', action: 'ranged', input: 0 }] },
      })
      now += 100
      registry.view(host.matchId, guest.token)
    }
    assert.equal(view().status, 'finished')
    result = seasons.leaderboard()
  }
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(result))
}
await server.listen()
const browser = await chromium.launch({ headless: true, args: ['--disable-3d-apis'] })
const errors = []
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: 'reduce',
  })
  page.setDefaultTimeout(45000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-phase9/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.getByRole('button', { name: 'Lire ce replay', exact: true }).first().click()
  const source = await page.evaluate(() => window.phase9Fixture.source())
  await page.getByLabel('Position enregistrée', { exact: true }).evaluate((range) => {
    range.value = '8'
    range.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.getByRole('button', { name: 'Reprendre le contrôle', exact: true }).click()
  await page.locator('[data-practice]').waitFor()
  await page.getByRole('button', { name: 'Frapper pendant l’essai', exact: true }).click()
  await page.getByRole('button', { name: 'Répéter cet essai', exact: true }).click()
  await page.getByRole('button', { name: 'Retour à la relecture', exact: true }).click()
  assert.equal(await page.evaluate(() => window.phase9Fixture.source()), source)
  await page.getByRole('button', { name: 'Quitter le replay', exact: true }).click()
  await page.getByLabel('Pseudo de saison', { exact: true }).fill('Hunter9')
  await page.getByRole('button', { name: 'Inscrire mon profil PvP', exact: true }).click()
  await page.getByText('Profil inscrit : Hunter9', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'Résoudre un duel serveur', exact: true }).click()
  await page.getByRole('button', { name: 'Actualiser le classement', exact: true }).click()
  await page.locator('.season-panel tbody').getByText('Hunter9', { exact: true }).waitFor()
  const board = await page.locator('.season-panel tbody').innerText()
  await page.getByRole('button', { name: 'Redémarrer le registre', exact: true }).click()
  await page.getByRole('button', { name: 'Actualiser le classement', exact: true }).click()
  assert.equal(await page.locator('.season-panel tbody').innerText(), board)
  await page
    .getByText('Les identités et saisons sont conservées sur le serveur après redémarrage.', {
      exact: false,
    })
    .waitFor()
  const teams = page.getByRole('region', { name: 'Équipes et relais', exact: true })
  await teams.getByRole('button', { name: 'Préparer les équipes', exact: true }).click()
  await teams.getByRole('button', { name: 'Commencer la manche', exact: true }).click()
  await page.keyboard.down('q')
  await page.waitForTimeout(1700)
  await page.keyboard.up('q')
  const one = teams.getByRole('region', { name: 'P1', exact: true })
  await one
    .getByRole('button', { name: /^P1 · Appeler / })
    .first()
    .click()
  await one
    .locator('.member')
    .filter({ hasText: 'Hisoka' })
    .getByText('En scène', { exact: true })
    .waitFor()
  await teams.getByRole('button', { name: 'Pause', exact: true }).click()
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1050 })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await page.screenshot({ path: path.join(output, `phase9-${width}.png`), fullPage: true })
  }
  await page.evaluate(() => window.phase9Fixture.english())
  await page.getByRole('heading', { name: 'Clash · Teams and relays', exact: true }).waitFor()
  assert.deepEqual(errors, [])
  process.stdout.write(`Phase 9 replay, durable ranking and team relay UI passed; ${output}\n`)
} finally {
  await browser.close()
  await server.close()
  await rm(data, { recursive: true, force: true })
}
