import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import {
  createRollbackNetwork,
  percentile,
  recordConfirmedHashes,
  rollbackNetworkProfile,
  RTT_TOLERANCE_MS,
} from './fighting-rollback-network.mjs'

const webRoot = fileURLToPath(new URL('..', import.meta.url))
const server = process.env.CLASH_TEST_URL
  ? null
  : await createServer({
      root: webRoot,
      optimizeDeps: {
        entries: ['src/routes/fighting/pvp/**/*.svelte', 'src/routes/+layout.svelte'],
      },
      server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
    })
await server?.listen()
const base = process.env.CLASH_TEST_URL ?? server.resolvedUrls.local[0]
const args = ['--disable-background-timer-throttling', '--disable-renderer-backgrounding']
const launch = {
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  channel: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? undefined : 'chrome',
  args,
}

const browsers = []
const errors = []
const traffic = new Map()
const profile = rollbackNetworkProfile()
const networkBench = await createRollbackNetwork(base, profile)
const exerciseFuture = process.env.CLASH_TEST_FUTURE === '1'
const browserLoad = { waitUntil: 'domcontentloaded' }

async function openPlayer(seed) {
  const browser = await chromium.launch(launch)
  browsers.push(browser)
  const page = await browser.newPage({
    viewport: { width: 920, height: 720 },
    // Only these test pages route the game socket through a different loopback port.
    bypassCSP: Boolean(networkBench),
  })
  page.setDefaultTimeout(60_000)
  page.setDefaultNavigationTimeout(180_000)
  const network = {
    epochs: new Set(),
    sent: 0,
    received: 0,
    httpInputs: 0,
    attempted: 0,
    dropped: 0,
    rtts: [],
    hashes: new Map(),
  }
  await networkBench?.install(page, seed, network)
  traffic.set(page, network)
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.method() !== 'POST' || !request.url().includes('/fighting/pvp/api/matches')) return
    if (['input', 'inputs'].includes(request.postDataJSON()?.kind)) network.httpInputs++
  })
  page.on('websocket', (socket) => {
    const url = new URL(socket.url())
    if (!url.pathname.startsWith('/fighting/pvp/socket/')) return
    const epoch = Number(url.searchParams.get('epoch'))
    network.epochs.add(epoch)
    socket.on('framesent', ({ payload }) => {
      if (Buffer.isBuffer(payload) && payload[1] === 0) network.sent++
      recordConfirmedHashes(payload, epoch, network.hashes)
    })
    socket.on('framereceived', ({ payload }) => {
      if (Buffer.isBuffer(payload) && payload[1] === 0) network.received++
    })
  })
  return page
}

async function readView(page) {
  return page.evaluate(async () => {
    const id = location.pathname.split('/').at(-1)
    const token = sessionStorage.getItem(`black-whale:clash:pvp:${id}`)
    const response = await fetch(`/fighting/pvp/api/matches/${id}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!response.ok) throw Error(`View returned ${response.status}`)
    return response.json()
  })
}

async function waitForView(page, condition, description) {
  const deadline = Date.now() + 60_000
  do {
    const view = await readView(page)
    if (condition(view)) return view
    await new Promise((resolve) => setTimeout(resolve, 250))
  } while (Date.now() < deadline)
  throw Error(description)
}

function confirm(page) {
  return page.getByRole('button', { name: 'Confirm this setup' }).click()
}

async function startRound(host, guest) {
  await Promise.all([confirm(host), confirm(guest)])
  await Promise.all(
    [host, guest].map((page) => page.getByText('Fight in progress', { exact: false }).waitFor()),
  )
  return waitForView(host, (view) => view.rollback?.frame > 8, 'No confirmed rollback frames')
}

async function fireUntilRoundEnds(host) {
  const deadline = Date.now() + 90_000
  do {
    const before = await readView(host)
    if (before.status !== 'playing') return before
    await host.keyboard.press('o')
    await new Promise((resolve) => setTimeout(resolve, 150))
  } while (Date.now() < deadline)
  throw Error('No round verdict after firing through the browser controls')
}

try {
  const [host, guest] = await Promise.all([openPlayer(51), openPlayer(89)])
  await host.goto(new URL('/fighting/pvp', base).href, browserLoad)
  const create = host.getByRole('button', { name: 'Create invite' })
  await create.and(host.locator(':enabled')).waitFor()
  await host.getByLabel('Your fighter').selectOption('theta')
  if (exerciseFuture) await host.getByLabel('Guest fighter').selectOption('tserriednich')
  await host.getByRole('checkbox', { name: /Interactive arena/ }).uncheck()
  await host.getByRole('checkbox', { name: /Experimental rollback/ }).check()
  const [created] = await Promise.all([
    host.waitForResponse(
      (response) =>
        response.url().endsWith('/fighting/pvp/api/matches') &&
        response.request().method() === 'POST',
    ),
    create.click(),
  ])
  assert.equal(created.status(), 201, 'Private lobby creation failed')
  assert.equal(created.request().postDataJSON().setup.player, 'theta')
  assert.equal(created.request().postDataJSON().setup.environment.arenaInteractions, false)
  process.stdout.write('Created the private rollback invitation\n')
  await host.getByText('Waiting for the second player', { exact: false }).waitFor()
  const invite = await host.getByLabel('Invite to share').inputValue()
  await guest.goto(invite, browserLoad)
  await guest.getByRole('button', { name: 'Join this private duel' }).click()
  await guest.getByText('Your seat', { exact: false }).waitFor()
  const first = await startRound(host, guest)
  process.stdout.write(`Round 1 started over WebSocket epoch ${first.rollback.epoch}\n`)
  await guest.reload()
  await guest.getByText('Fight in progress', { exact: false }).waitFor()
  const resumed = await waitForView(
    host,
    (view) => view.rollback?.epoch > first.rollback.epoch && view.rollback.frame > 8,
    'Rollback did not resume from a server checkpoint',
  )
  assert.ok(resumed.tick > first.tick)
  process.stdout.write(`Reconnected on epoch ${resumed.rollback.epoch}\n`)
  if (exerciseFuture) {
    await guest.keyboard.press('l')
    await waitForView(
      guest,
      (view) => JSON.parse(view.snapshot).parallelFuture?.phase === 'vision',
      'Parallel Future did not reach vision',
    )
    await guest.locator('[data-prediction-phase="vision"]:not(.dormant)').waitFor()
    await guest.keyboard.press('l')
    await waitForView(
      guest,
      (view) => JSON.parse(view.snapshot).parallelFuture?.phase === 'diverging',
      'Parallel Future did not reach divergence',
    )
    process.stdout.write('Parallel Future rendered and diverged over the rollback connection\n')
  }
  const round = await fireUntilRoundEnds(host)
  assert.equal(round.status, 'ready')
  const result = JSON.parse(round.snapshot)
  assert.equal(
    result.winner,
    'player',
    JSON.stringify({
      finish: result.finishReason,
      tick: round.tick,
      playerHealth: result.player.health,
      guestHealth: result.opponent.health,
      player: result.player.id,
      opponent: result.opponent.id,
    }),
  )
  const second = await startRound(host, guest)
  assert.ok(second.rollback.epoch > resumed.rollback.epoch)
  process.stdout.write(`Round 2 started over WebSocket epoch ${second.rollback.epoch}\n`)
  const terminal = await fireUntilRoundEnds(host)
  assert.equal(terminal.status, 'finished')
  await Promise.all(
    [host, guest].map((page) =>
      page.getByText('Match finished · server verdict', { exact: false }).waitFor(),
    ),
  )
  const guestView = await readView(guest)
  assert.equal(guestView.status, 'finished')
  assert.equal(terminal.authorityHash, guestView.authorityHash)
  assert.equal(JSON.parse(terminal.snapshot).matchWinner, 'player')
  assert.equal(JSON.parse(guestView.snapshot).matchWinner, 'opponent')
  assert.equal(JSON.parse(terminal.snapshot).roundsWon.player, 2)
  assert.equal(terminal.ranking, 'unranked')
  for (const network of traffic.values()) {
    assert.equal(network.httpInputs, 0)
    assert.ok(network.sent > 100 && network.received > 100)
    assert.ok(network.epochs.size >= 3)
  }
  assert.deepEqual(errors, [])
  const rows = [...traffic.values()]
  const common = [...rows[0].hashes].filter(([key]) => rows[1].hashes.has(key))
  assert.ok(common.length >= 10, 'Too few confirmed checkpoints were exchanged')
  for (const [key, hash] of common) assert.equal(rows[1].hashes.get(key), hash, `Desync at ${key}`)
  const rtts = rows.flatMap(({ rtts }) => rtts)
  if (profile.loss) assert.ok(rows.every(({ dropped }) => dropped > 0))
  if (profile.rtt) assert.ok(rtts.length >= 10)
  process.stdout.write(
    JSON.stringify({
      profile,
      attempted: rows.reduce((sum, row) => sum + row.attempted, 0),
      dropped: rows.reduce((sum, row) => sum + row.dropped, 0),
      samples: rtts.length,
      matchingCheckpoints: common.length,
      rttP50: percentile(rtts, 0.5),
      rttP95: percentile(rtts, 0.95),
      playerRttP50: rows.map((row) => percentile(row.rtts, 0.5)),
      finalLegDelay: networkBench?.legDelay,
    }) + '\n',
  )
  if (profile.rtt) {
    for (const { rtts: samples } of rows) {
      const median = percentile(samples, 0.5)
      assert.ok(
        Math.abs(median - profile.rtt) <= RTT_TOLERANCE_MS,
        `Browser RTT median ${median} ms missed ${profile.rtt} ± ${RTT_TOLERANCE_MS} ms`,
      )
    }
  }
  process.stdout.write(
    `Two browsers completed the match 2–0; server hash ${terminal.authorityHash}\n`,
  )
} catch (error) {
  for (const [page, network] of traffic) {
    const status = await page
      .getByRole('status')
      .allTextContents()
      .catch(() => [])
    const alerts = await page
      .getByRole('alert')
      .allTextContents()
      .catch(() => [])
    process.stderr.write(
      JSON.stringify({ status, alerts, ...network, epochs: [...network.epochs] }) + '\n',
    )
  }
  if (errors.length) process.stderr.write(errors.join('\n') + '\n')
  throw error
} finally {
  await Promise.all(browsers.map((browser) => browser.close()))
  await networkBench?.close()
  await server?.close()
}
