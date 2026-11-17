import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.ONLINE_CHECK_OUTPUT ?? '/tmp/black-whale-step6-browser'
await mkdir(output, { recursive: true, mode: 0o700 })
const directory = await mkdtemp(path.join(output, 'data-'))
process.env.CLASH_DATA_DIR = path.join(directory, 'global-fixture')
const server = await createServer({
  configFile: false,
  root,
  publicDir: false,
  plugins: [
    svelte({ configFile: false }),
    {
      name: 'online-regression-api',
      configureServer(vite) {
        vite.middlewares.use(serve)
      },
    },
  ],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  optimizeDeps: { entries: ['ui-tests/fighting-online/index.html'], holdUntilCrawlEnd: false },
  cacheDir: path.join(output, 'vite-cache'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
const { onlineBrowserServer } = await server.ssrLoadModule('/ui-tests/fighting-online/server.ts')
const backend = onlineBrowserServer(directory)
async function serve(req, res, next) {
  if (!req.url?.startsWith('/__')) return next()
  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()
    const request = new Request(`http://fixture${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
    })
    const response = await backend.handle(request)
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(await response.text())
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: error.message }))
  }
}
await server.listen()
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-3d-apis', '--no-proxy-server'],
})
const errors = [],
  origin = `http://127.0.0.1:${server.httpServer.address().port}`,
  url = `${origin}/ui-tests/fighting-online/`
async function page() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } }),
    page = await context.newPage()
  page.setDefaultTimeout(30000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean(window.onlineFixture))
  return page
}
async function register(page, name) {
  await page.getByLabel('Pseudo en ligne', { exact: true }).fill(name)
  await page.getByRole('button', { name: 'Créer mon identité', exact: true }).click()
  await page.getByRole('button', { name: 'Chercher un adversaire', exact: true }).waitFor()
}
async function finish(kind = 'game') {
  const response = await fetch(`${origin}/__test/${kind}`, { method: 'POST' })
  assert.equal(response.ok, true, await response.text())
}
try {
  const a = await page(),
    b = await page()
  await register(a, 'Online Hunter A')
  await register(b, 'Online Hunter B')
  await a.getByLabel('Personnage', { exact: true }).selectOption('theta')
  await b.getByLabel('Personnage', { exact: true }).selectOption('hisoka')
  await a.getByRole('button', { name: 'Chercher un adversaire', exact: true }).click()
  await a.getByRole('region', { name: 'Recherche en cours', exact: true }).waitFor()
  await a.getByRole('button', { name: 'Annuler la recherche', exact: true }).click()
  await a.getByRole('button', { name: 'Chercher un adversaire', exact: true }).waitFor()
  await a.getByLabel('File', { exact: true }).selectOption('ranked')
  await a.getByRole('button', { name: 'Chercher un adversaire', exact: true }).click()
  await b.getByRole('button', { name: 'Chercher un adversaire', exact: true }).click()
  await b.getByRole('region', { name: 'Recherche en cours', exact: true }).waitFor()
  assert.equal(await b.getByRole('region', { name: 'Série en ligne', exact: true }).count(), 0)
  await b.getByRole('button', { name: 'Annuler la recherche', exact: true }).click()
  await b.getByLabel('File', { exact: true }).selectOption('ranked')
  await b.getByRole('button', { name: 'Chercher un adversaire', exact: true }).click()
  for (const p of [a, b])
    await p.getByRole('button', { name: 'Jouer le match', exact: true }).waitFor()
  for (const p of [a, b])
    await p.getByRole('button', { name: 'Jouer le match', exact: true }).click()
  const first = await a.evaluate(() => window.onlineFixture.selectedMatch())
  assert.ok(
    await a.evaluate((id) => Boolean(sessionStorage.getItem(`black-whale:clash:pvp:${id}`)), first),
  )
  await finish()
  await a.getByRole('button', { name: 'Préparer le match suivant', exact: true }).waitFor()
  await a
    .getByRole('region', { name: 'Série en ligne', exact: true })
    .getByText('1 : 0', { exact: true })
    .waitFor()
  await a.getByRole('button', { name: 'Préparer le match suivant', exact: true }).click()
  for (const p of [a, b]) {
    await p.getByRole('button', { name: 'Jouer le match', exact: true }).waitFor()
    await p.getByRole('button', { name: 'Jouer le match', exact: true }).click()
  }
  assert.notEqual(await a.evaluate(() => window.onlineFixture.selectedMatch()), first)
  await finish()
  await a.getByText('Résultat classé enregistré.', { exact: true }).waitFor()
  const board = await (await fetch(`${origin}/__test/ranking`)).json()
  assert.deepEqual(
    board.entries.map((e) => e.rating),
    [1212, 1188],
  )
  await a.getByText('Historique serveur et statistiques', { exact: true }).click()
  await a.getByText('Conserver mon identité', { exact: true }).click()
  const [download] = await Promise.all([
    a.waitForEvent('download'),
    a.getByRole('button', { name: 'Enregistrer mon code', exact: true }).click(),
  ])
  const backup = path.join(directory, 'recovery.json')
  await download.saveAs(backup)
  const code = JSON.parse(await readFile(backup, 'utf8')).token
  await finish('restart')
  const recovered = await page()
  await recovered.getByText('Récupérer une identité', { exact: true }).click()
  await recovered.getByLabel('Code de récupération', { exact: true }).fill(code)
  await recovered.getByRole('button', { name: 'Récupérer mon identité', exact: true }).click()
  await recovered
    .getByRole('region', { name: 'Identité en ligne', exact: true })
    .getByText('Online Hunter A', { exact: true })
    .waitFor()
  await recovered.getByText('Résultat classé enregistré.', { exact: true }).waitFor()
  await recovered.getByText('Signaler un problème', { exact: true }).click()
  await recovered.getByRole('button', { name: 'Enregistrer le signalement', exact: true }).click()
  await recovered
    .getByText('Signalement enregistré. Il ne change pas le résultat.', { exact: true })
    .waitFor()
  for (const width of [1280, 390, 320]) {
    await recovered.setViewportSize({ width, height: 1000 })
    assert.equal(
      await recovered.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await recovered.screenshot({ path: path.join(output, `online-${width}.png`), fullPage: true })
  }
  await recovered.getByText('Tournois en ligne', { exact: true }).click()
  await recovered.getByRole('button', { name: 'Créer un tournoi', exact: true }).click()
  const invitation = recovered.getByLabel('Invitation du tournoi', { exact: true })
  await invitation.waitFor()
  const link = await invitation.inputValue(),
    [id, secret] = new URL(link).hash.slice(1).split(':')
  await b.reload({ waitUntil: 'networkidle' })
  await b.getByText('Tournois en ligne', { exact: true }).click()
  await b.getByLabel('Identifiant du tournoi', { exact: true }).fill(id)
  await b.getByLabel('Code d’invitation', { exact: true }).fill(secret)
  await b.getByRole('button', { name: 'Rejoindre le tournoi', exact: true }).click()
  await recovered.getByRole('button', { name: 'Démarrer le tableau', exact: true }).waitFor()
  await recovered.getByRole('button', { name: 'Démarrer le tableau', exact: true }).click()
  await recovered.getByRole('button', { name: 'Préparer ma rencontre', exact: true }).click()
  await recovered.getByRole('button', { name: 'Jouer le match', exact: true }).waitFor()
  await finish('forfeit')
  const spectator = await page()
  await spectator.evaluate((id) => window.onlineFixture.showTournament(id), id)
  await spectator
    .locator('.online-bracket')
    .getByText('Vainqueur : Online Hunter A', { exact: true })
    .waitFor()
  const publicText = await (await fetch(`${origin}/__online?tournament=${id}`)).text()
  assert.equal(publicText.includes(code), false)
  assert.equal(publicText.includes(secret), false)
  assert.deepEqual(
    (await (await fetch(`${origin}/__test/ranking`)).json()).entries.map((e) => e.matches),
    [1, 1],
  )
  await recovered.evaluate(() => window.onlineFixture.english())
  await recovered.getByText('Online identity', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        contexts: 4,
        widths: [1280, 390, 320],
        languages: ['fr', 'en'],
        actualEngineMatches: 2,
        rankedSeries: true,
        queueSeparation: true,
        cancellation: true,
        identityRecoveryAfterRestart: true,
        privateReport: true,
        tournamentFromServerForfeit: true,
        publicBracket: true,
        errors,
      },
      null,
      2,
    ) + '\n',
  )
  console.warn(`Clash online services passed; ${output}`)
} catch (error) {
  let index = 0
  for (const context of browser.contexts())
    for (const page of context.pages()) {
      await page
        .screenshot({ path: path.join(output, `failure-${++index}.png`), fullPage: true })
        .catch(() => {})
      console.warn((await page.locator('body').innerText()).slice(-1200))
    }
  throw error
} finally {
  await browser.close()
  await server.close()
}
