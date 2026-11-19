// Rollback budget (docs/clash-netcode-rollback.md, lot L0): per-scenario cost of a
// tick, a snapshot, a hash and an 8-frame resimulation, in a production bundle in
// Chrome, at full speed and under a 4x CDP CPU throttle. Fails on any resimulation
// divergence or in-place state mutation; timings are reported, not asserted.
//
//   node scripts/check-fighting-rollback.mjs            # report under /tmp
//   node scripts/check-fighting-rollback.mjs --save     # also write the reference JSON
//   ROLLBACK_ONLY=stress-future,kameos-both-seats node scripts/check-fighting-rollback.mjs
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
import { build, preview } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const output = process.env.ROLLBACK_CHECK_OUTPUT ?? '/tmp/black-whale-rollback-budget'
const only = process.env.ROLLBACK_ONLY?.split(',')
const profiles = [
  { cpu: 1, modes: ['clone', 'reference'] },
  { cpu: 4, modes: ['reference'] },
]
await mkdir(output, { recursive: true })
const config = {
  configFile: false,
  root,
  publicDir: false,
  mode: 'production',
  plugins: [svelte({ configFile: false, compilerOptions: { dev: false } })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  logLevel: 'warn',
  build: {
    outDir: path.join(output, 'production'),
    emptyOutDir: true,
    rollupOptions: { input: path.join(root, 'ui-tests/fighting-rollback-budget/index.html') },
  },
}
await build(config)
const server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } })
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: process.env.ROLLBACK_HEADED !== '1',
  args: ['--no-proxy-server'],
})
const runs = []
try {
  for (const profile of profiles) {
    const context = await browser.newContext()
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu })
    await page.goto(`${base}ui-tests/fighting-rollback-budget/`, { waitUntil: 'load' })
    page.setDefaultTimeout(0)
    const rows = await page.evaluate(
      ([modes, ids]) => window.rollbackBudget(modes, ids ?? undefined),
      [profile.modes, only ?? null],
    )
    runs.push({ cpu: profile.cpu, browser: browser.version(), rows })
    process.stdout.write(`CPU x${profile.cpu}: ${rows.length} measurements\n`)
    await context.close()
  }
} finally {
  await browser.close()
  server.httpServer.close()
}

const report = {
  measuredAt: new Date().toISOString(),
  machine: `${os.cpus()[0]?.model ?? 'unknown'} · ${os.cpus().length} cores · ${Math.round(os.totalmem() / 2 ** 30)} GB`,
  note: 'Production bundle, headless Chrome, no rendering. CPU throttle via CDP. Timings in ms, bytes as JSON length.',
  runs,
}
const file = path.join(output, 'report.json')
await writeFile(file, JSON.stringify(report, null, 2) + '\n')
if (process.argv.includes('--save')) {
  const reference = path.join(root, 'ui-tests/fighting-rollback-budget/reference/budget.json')
  await mkdir(path.dirname(reference), { recursive: true })
  await writeFile(reference, JSON.stringify(report, null, 2) + '\n')
}

const f = (value) => value.toFixed(2).padStart(7)
for (const run of runs) {
  process.stdout.write(`\nCPU x${run.cpu} — tick p99 / rollback p95 p99 / snapshot p99 / KB max\n`)
  for (const row of run.rows)
    process.stdout.write(
      `${row.id.padEnd(28)}${row.mode.padEnd(10)}${f(row.tick.p99)}${f(row.rollback.p95)}${f(row.rollback.p99)}${f(row.clone.p99)}${f(row.bytes.max / 1024)}  div ${row.divergences} mut ${row.mutations} on ${row.manifestedFrames}/${row.frames}\n`,
    )
}
process.stdout.write(`\nReport: ${file}\n`)
const broken = runs.flatMap((run) => run.rows).filter((row) => row.divergences || row.mutations)
assert.equal(broken.length, 0, `Rollback determinism broken: ${broken.map((row) => row.id)}`)
const absent = runs[0].rows.filter((row) => row.group === 'worst-case' && !row.manifestedFrames)
assert.equal(absent.length, 0, `Worst case never on stage: ${absent.map((row) => row.id)}`)
