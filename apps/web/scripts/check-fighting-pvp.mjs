import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'

const output = process.env.PVP_CHECK_OUTPUT ?? '/tmp/black-whale-pvp-ui'
await mkdir(output, { recursive: true })
const root = fileURLToPath(new URL('../../../', import.meta.url))
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [
    svelte({ configFile: false }),
    {
      name: 'clash-pvp-api-check',
      configureServer(vite) {
        vite.middlewares.use(serveApi)
      },
    },
  ],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  optimizeDeps: { entries: ['ui-tests/fighting-pvp/index.html'], holdUntilCrawlEnd: false },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
const api = await server.ssrLoadModule('/src/lib/server/clashPvpHttp.ts')
const registry = await server.ssrLoadModule('/src/lib/server/clashPvp.ts')
async function serveApi(req, res, next) {
  if (!req.url?.startsWith('/__pvp')) return next()
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const request = new Request('http://localhost' + req.url, {
    method: req.method,
    headers: req.headers,
    body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
  })
  const id = req.url.split('/')[2]
  let response
  if (!id) response = api.createClashLobby(await api.clashBody(request))
  else if (req.method === 'POST')
    response = api.updateClashLobby(id, request, await api.clashBody(request))
  else {
    try {
      response = Response.json(registry.clashPvpRegistry.view(id, api.clashBearer(request)))
    } catch (error) {
      response = api.clashPvpFailure(error)
    }
  }
  res.statusCode = response.status
  for (const [key, value] of response.headers) res.setHeader(key, value)
  res.end(await response.text())
}
await server.listen()
const base = `http://127.0.0.1:${server.httpServer.address().port}`
const browser = await chromium.launch({
  headless: true,
  args:
    process.env.PVP_CHECK_NO_WEBGL === '1'
      ? ['--disable-3d-apis', '--no-proxy-server']
      : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'],
})
const errors = []
async function readView(page) {
  return page.evaluate(async () => {
    const matchId = new URLSearchParams(location.search).get('match')
    const token = sessionStorage.getItem(`black-whale:clash:pvp:${matchId}`)
    return fetch(`/__pvp/${matchId}`, {
      headers: { authorization: `Bearer ${token}` },
    }).then((response) => response.json())
  })
}
try {
  const hostContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const guestContext = await browser.newContext({ viewport: { width: 390, height: 1000 } })
  const host = await hostContext.newPage(),
    guest = await guestContext.newPage()
  for (const page of [host, guest]) {
    page.setDefaultTimeout(60000)
    page.on('pageerror', (error) => {
      errors.push(error.message)
      process.stderr.write(error.stack + '\n')
    })
    page.on('response', (response) => {
      if (response.status() >= 500) errors.push(`HTTP ${response.status()} ${response.url()}`)
    })
    page.on('console', (message) => {
      if (message.type() === 'error' && !/ERR_FAILED|409/.test(message.text()))
        process.stderr.write(`${message.text()}\n`)
    })
  }
  await host.goto(`${base}/ui-tests/fighting-pvp/`, { waitUntil: 'networkidle' })
  process.stdout.write('Setup loaded\n')
  await host.getByRole('button', { name: 'Créer une invitation', exact: true }).click()
  await host.waitForURL(/match=/)
  process.stdout.write('Invitation created\n')
  await host.getByText('En attente du second joueur', { exact: false }).waitFor()
  const invite = await host.getByLabel('Invitation à transmettre').inputValue()
  assert.equal(invite, host.url())
  assert.ok(!invite.includes('token'))
  await guest.goto(invite, { waitUntil: 'domcontentloaded' })
  await guest.getByRole('button', { name: 'Rejoindre ce duel privé', exact: true }).click()
  await guest.getByText('Ta place : P2', { exact: false }).waitFor()
  process.stdout.write('Guest authenticated\n')
  await host
    .getByRole('button', { name: 'Confirmer cette configuration', exact: true })
    .click({ force: true })
  process.stdout.write('Host confirmed\n')
  assert.equal((await readView(host)).status, 'ready')
  await guest
    .getByRole('button', { name: 'Confirmer cette configuration', exact: true })
    .click({ force: true })
  await host.getByText('Combat en cours', { exact: false }).waitFor()
  await guest.getByText('Combat en cours', { exact: false }).waitFor()
  process.stdout.write('Both confirmations accepted\n')
  // The existing Hatsu panel sends a semantic command to the real server.
  await host.bringToFront()
  await host
    .getByRole('button', { name: 'Écrire sur le papier · 25 aura', exact: true })
    .last()
    .click()
  await host.waitForFunction(
    async () => {
      const id = new URLSearchParams(location.search).get('match'),
        token = sessionStorage.getItem(`black-whale:clash:pvp:${id}`)
      const view = await fetch(`/__pvp/${id}`, {
        headers: { authorization: `Bearer ${token}` },
      }).then((response) => response.json())
      return JSON.parse(view.snapshot).player.bashoPoem?.ready === true
    },
    null,
    { timeout: 30000 },
  )
  const h = await readView(host),
    g = await readView(guest)
  assert.equal(h.configHash, g.configHash)
  assert.equal(JSON.parse(h.snapshot).player.id, 'basho')
  assert.equal(JSON.parse(g.snapshot).player.id, 'hisoka')
  await guest.bringToFront()
  await guest.keyboard.down('q')
  await guest.waitForTimeout(180)
  await guest.keyboard.up('q')
  await guest.reload({ waitUntil: 'domcontentloaded' })
  await guest.getByText('Ta place : P2', { exact: false }).waitFor()
  for (const width of [1440, 390, 320]) {
    await guest.setViewportSize({ width, height: 1000 })
    assert.equal(
      await guest.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await guest.screenshot({ path: path.join(output, `pvp-${width}.png`), fullPage: true })
  }
  // Both browsers stop heartbeats for long enough to exercise suspension.
  const beforeCut = await readView(host)
  await guest.route('**/__pvp/*', (route) => route.abort())
  await guest.waitForTimeout(3400)
  await host.getByText('Duel suspendu', { exact: false }).waitFor()
  await guest.unroute('**/__pvp/*')
  await host.getByText('Combat en cours', { exact: false }).waitFor()
  const resumed = await readView(host)
  assert.ok(resumed.inputEpoch > beforeCut.inputEpoch)
  const stale = await host.evaluate(async (old) => {
    const id = new URLSearchParams(location.search).get('match')
    const token = sessionStorage.getItem(`black-whale:clash:pvp:${id}`)
    const response = await fetch(`/__pvp/${id}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'inputs',
        round: JSON.parse(old.snapshot).roundNumber,
        inputEpoch: old.inputEpoch,
        packets: [
          {
            sequence: old.nextSequence,
            input: 2,
            commands: [{ kind: 'move', action: 'special', input: 0 }],
          },
        ],
      }),
    })
    return { status: response.status, ...(await response.json()) }
  }, beforeCut)
  assert.equal(stale.status, 409)
  assert.equal(stale.error, 'STALE_INPUT')
  await guest.getByRole('button', { name: 'Quitter le duel', exact: true }).click()
  await host.getByText('Duel interrompu définitivement', { exact: false }).waitFor()
  assert.deepEqual(errors, [])
  process.stdout.write(`Private PvP browser checks passed; ${output}\n`)
} finally {
  await browser.close()
  await server?.close()
}
