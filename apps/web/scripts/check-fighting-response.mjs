import assert from 'node:assert/strict'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { mkdir, writeFile, readFile, symlink } from 'node:fs/promises'
import path from 'node:path'
import { build, preview } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { responseApi } from './fighting-response-api.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.RESPONSE_OUTPUT ?? '/tmp/black-whale-response'
const runId = new Date().toISOString()
const serialCommit = process.env.RESPONSE_SERIAL_COMMIT ?? ''
assert.ok(
  !serialCommit || /^[a-f0-9]{8,40}$/.test(serialCommit),
  'Use an immutable baseline commit',
)
const serialSource = serialCommit
  ? execFileSync('git', ['show', `${serialCommit}:apps/web/src/lib/fighting/pvp/client.ts`], {
      cwd: process.env.RESPONSE_SOURCE_REPO ?? root,
      encoding: 'utf8',
    })
  : null
const clientPath = realpathSync(path.join(root, 'src/lib/fighting/pvp/client.ts'))
let serialLoaded = false
const seconds = Number(process.env.RESPONSE_SECONDS ?? 30)
const requestedFighters = process.env.RESPONSE_FIGHTERS?.split(',') ?? [
  'kurapika',
  'hisoka',
  'chrollo',
  'benjamin',
]
await mkdir(output, { recursive: true })
try {
  await symlink(path.join(root, '../../node_modules'), path.join(output, 'node_modules'))
} catch (error) {
  if (error.code !== 'EEXIST') throw error
}
const config = {
  configFile: false,
  root,
  publicDir: 'static',
  mode: 'production',
  plugins: [
    {
      name: 'serial-input-baseline',
      enforce: 'pre',
      load(id) {
        if (
          serialSource &&
          (id === clientPath || id === path.join(root, 'src/lib/fighting/pvp/client.ts'))
        ) {
          serialLoaded = true
          return serialSource
        }
      },
    },
    svelte({ configFile: false, compilerOptions: { dev: false } }),
  ],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  logLevel: 'warn',
}
if (!process.env.RESPONSE_SKIP_BUILD) {
  await build({
    ...config,
    build: {
      outDir: path.join(output, 'client'),
      sourcemap: true,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'ui-tests/fighting-response/index.html') },
    },
  })
  await build({
    ...config,
    publicDir: false,
    build: {
      outDir: path.join(output, 'server'),
      ssr: path.join(root, 'ui-tests/fighting-response/server.ts'),
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: 'server.mjs' } },
    },
  })
  if (serialSource)
    assert.ok(serialLoaded, 'Serial client baseline must actually replace the client module')
}
try {
  await symlink(path.join(root, 'node_modules'), path.join(output, 'server/node_modules'))
} catch (error) {
  if (error.code !== 'EEXIST') throw error
}
const api = await import(pathToFileURL(path.join(output, 'server/server.mjs')).href)
const fighters =
  process.env.RESPONSE_ROSTER === '1' ? api.FIGHTING_ROSTER.map(({ id }) => id) : requestedFighters
const adapter = responseApi(api)
const server = await preview({
  ...config,
  plugins: [
    ...config.plugins,
    {
      name: 'response-api',
      configurePreviewServer(vite) {
        vite.middlewares.use((req, res, next) => {
          void adapter.serve(req, res, next).catch((error) => {
            process.stderr.write(String(error) + '\n')
            if (!res.destroyed) {
              res.statusCode = 500
              res.end('INTERNAL')
            }
          })
        })
      },
    },
  ],
  build: { outDir: path.join(output, 'client') },
  preview: { host: '127.0.0.1', port: 0 },
})
const url = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-response/`
const errors = [],
  results = [],
  failures = []
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--no-proxy-server'],
})
function distribution(values) {
  const sorted = values.slice().sort((a, b) => a - b)
  const at = (p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? 0
  return {
    count: sorted.length,
    p50: at(0.5),
    p95: at(0.95),
    p99: at(0.99),
    max: sorted.at(-1) ?? 0,
    mean: values.reduce((a, b) => a + b, 0) / Math.max(1, values.length),
  }
}
async function pageFor(rendered) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: Number(process.env.RESPONSE_DPR ?? 2),
  })
  const page = await context.newPage()
  page.setDefaultTimeout(120000)
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForFunction(() => !!window.responseLab)
  return { page, context, rendered }
}
async function duel(fighter, legacy) {
  const host = await pageFor(true),
    guest = await pageFor(false)
  const network = process.env.RESPONSE_NETWORK ?? '100-jitter-loss'
  const opponent = fighter === 'chrollo' ? 'hisoka' : 'chrollo'
  try {
    const session = await host.page.evaluate((options) => window.responseLab.setup(options), {
      fighter,
      opponent,
      rendered: true,
      legacy,
      network,
    })
    await guest.page.evaluate((options) => window.responseLab.join(options), {
      matchId: session.matchId,
      invitation: session.inviteHref.split('#')[1],
      network,
      rendered: false,
    })
    await host.page.evaluate(() => window.responseLab.ready())
    await guest.page.evaluate(() => window.responseLab.ready())
    await host.page.waitForFunction(
      () => window.responseLab.result().state?.view?.status === 'playing',
    )
    await host.page.waitForFunction(
      () => document.querySelector('.fight-scene canvas')?.width > 1000,
    )
    // Approach through ordinary controls, then keep the opponent guarding for repeated trials.
    await host.page.evaluate(() => window.responseLab.control('right', true))
    await guest.page.evaluate(() => window.responseLab.control('left', true))
    await host.page.waitForTimeout(1200)
    await host.page.evaluate(() => window.responseLab.control('right', false))
    await guest.page.evaluate(() => {
      window.responseLab.control('left', false)
      window.responseLab.control('guard', true)
    })
    await host.page.waitForTimeout(Number(process.env.RESPONSE_WARMUP_MS ?? 6000))
    await host.page.evaluate(() => window.responseLab.reset())
    for (let second = 0; second < seconds; second++) {
      if (second % 2 === 0) {
        if (process.env.RESPONSE_IMPACT === '1') {
          await host.page.evaluate(() => {
            const state = window.responseLab.result().state.state
            window.responseLab.control(state.player.x < state.opponent.x ? 'right' : 'left', true)
          })
          await host.page.waitForFunction(
            () => {
              const state = window.responseLab.result().state.state
              return Math.abs(state.player.x - state.opponent.x) <= 5
            },
            undefined,
            { timeout: 5000 },
          )
          await host.page.evaluate(() => {
            window.responseLab.control('right', false)
            window.responseLab.control('left', false)
          })
          await host.page.waitForTimeout(150)
        }
        await host.page.evaluate(() => window.responseLab.move('light'))
      }
      if (second === 6) await host.page.evaluate(() => window.responseLab.control('aura', true))
      if (second === 12) await host.page.evaluate(() => window.responseLab.control('aura', false))
      await host.page.waitForTimeout(1000)
      if (second % 10 === 9)
        process.stdout.write(
          `${fighter} ${legacy ? 'baseline' : 'prediction'}: ${second + 1}/${seconds}s\n`,
        )
    }
    const raw = await host.page.evaluate(() => window.responseLab.result())
    const remote = await guest.page.evaluate(() => window.responseLab.result())
    const attempted = Math.ceil(seconds / 2)
    const intervals = raw.samples.map((row) => row.interval)
    const result = {
      runId,
      fighter,
      legacy,
      network,
      attempted,
      unobservedAnimations: attempted - raw.latency.length,
      latency: distribution(raw.latency.map((row) => row.ms)),
      impactTrials: raw.impacts,
      commandSend: distribution(
        raw.impacts.flatMap((row) => (row.sentMs === undefined ? [] : [row.sentMs])),
      ),
      authoritativeApplication: distribution(
        raw.impacts.flatMap((row) => (row.appliedMs === undefined ? [] : [row.appliedMs])),
      ),
      authoritativeContact: distribution(
        raw.impacts.flatMap((row) => (row.contactMs === undefined ? [] : [row.contactMs])),
      ),
      cadence: distribution(intervals),
      fps: (1000 * intervals.length) / intervals.reduce((a, b) => a + b, 0),
      over25ms: intervals.filter((ms) => ms > 25).length,
      renderCpu: distribution(raw.samples.map((row) => row.work)),
      otherRafCpu: Object.entries(raw.callbacks)
        .filter(([id]) => Number(id) !== raw.renderCallback)
        .map(([id, row]) => ({
          id,
          name: row.name,
          count: row.count,
          mean: row.total / Math.max(1, row.count),
          max: row.max,
        })),
      renderGpu: distribution(
        raw.samples.flatMap((row) => (row.gpuMs === undefined ? [] : [row.gpuMs])),
      ),
      prediction: raw.prediction,
      renderer: raw.renderer,
      resolution: raw.resolution,
      authorityTick: raw.state.view.tick,
      received: raw.state.view.nextSequence,
      applied: raw.state.view.appliedSequence,
      remoteSeat: remote.state.view.side,
    }
    await writeFile(
      path.join(output, `${fighter}-${legacy ? 'before' : 'after'}.frames.json`),
      JSON.stringify({
        samples: raw.samples,
        latency: raw.latency,
        callbacks: raw.callbacks,
        attempts: raw.attempts,
      }),
    )
    await writeFile(
      path.join(output, `${fighter}-${legacy ? 'before' : 'after'}.case.json`),
      JSON.stringify(result, null, 2),
    )
    await host.page.screenshot({
      path: path.join(output, `${fighter}-${legacy ? 'before' : 'after'}.png`),
      fullPage: true,
    })
    assert.equal(raw.state.connection, 'connected')
    if (!legacy) assert.equal(raw.prediction.streaming, true, 'Private SSE must be active')
    assert.equal(remote.prediction.streaming, true, 'P2 private SSE must be active')
    assert.equal(remote.state.connection, 'connected')
    assert.equal(raw.state.view.status, 'playing')
    assert.equal(await host.page.locator('.fight-scene.failed').count(), 0)
    assert.match(raw.renderer, /Metal Renderer/)
    assert.ok(raw.latency.length >= 3, `${fighter}: no rendered attacks`)
    if (!legacy)
      assert.equal(raw.latency.length, attempted, 'Every trial must produce an animation')
    if (process.env.RESPONSE_IMPACT === '1') {
      assert.equal(
        result.authoritativeApplication.count,
        attempted,
        'Every trial must be applied by authority',
      )
      assert.equal(
        result.authoritativeContact.count,
        attempted,
        'Every trial must produce a confirmed contact',
      )
      assert.ok(
        raw.impacts.every((row) => row.blocked),
        'The defender must actually block every trial',
      )
    }
    process.stdout.write(JSON.stringify(result) + '\n')
    return result
  } finally {
    await host.page.evaluate(() => window.responseLab.finish()).catch(() => {})
    await guest.page.evaluate(() => window.responseLab.finish()).catch(() => {})
    await host.context.close()
    await guest.context.close()
  }
}
try {
  for (const fighter of fighters) {
    for (const legacy of process.env.RESPONSE_AFTER_ONLY === '1' ? [false] : [true, false]) {
      try {
        results.push(await duel(fighter, legacy))
      } catch (error) {
        failures.push({ fighter, legacy, error: String(error) })
        process.stderr.write(`${fighter}: ${String(error)}\n`)
        const saved = await readFile(
          path.join(output, `${fighter}-${legacy ? 'before' : 'after'}.case.json`),
          'utf8',
        ).catch(() => '')
        if (saved) {
          const result = JSON.parse(saved)
          if (result.runId === runId) results.push({ ...result, validationError: String(error) })
        }
      }
      await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
    }
  }
  const after = results.filter((row) => !row.legacy)
  const report = {
    date: new Date().toISOString(),
    runId,
    browser: browser.version(),
    serialCommit: serialCommit || null,
    impactTrials: process.env.RESPONSE_IMPACT === '1',
    production: true,
    seconds,
    warmupMs: Number(process.env.RESPONSE_WARMUP_MS ?? 6000),
    roster: fighters,
    scope:
      'Production client and SSR API bundles, real authenticated POST + filtered SSE through a test-only latency shaper. Two browser contexts; only the primary renders WebGL. Rows with legacy=true reproduce completion+50ms polling and no prediction. Rows with legacy=false retain prediction and SSE. When serialCommit is set, only the input client module is loaded from that immutable commit; otherwise the current cumulative sender is used. Timing is input queue to an actual scene render with a startup, not physical controller-to-photon latency. Dropped receipts and skipped view events simulate application faults, not Internet packet delivery.',
    results,
    transport: adapter.stats,
    errors,
    failures,
    pass:
      failures.length === 0 &&
      errors.length === 0 &&
      after.every(
        (row) =>
          row.fps >= 59 &&
          row.cadence.p99 <= 20 &&
          row.latency.p95 <= 34 &&
          row.unobservedAnimations === 0,
      ),
  }
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
  assert.equal(report.pass, true, 'Response/cadence target failed; inspect retained report')
} finally {
  await browser.close()
  await new Promise((resolve) => server.httpServer.close(resolve))
}
