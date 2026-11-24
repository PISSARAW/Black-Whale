import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import { build, preview } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
import { fightingPerformanceCases } from './fighting-performance-cases.mjs'
import { fightingPerformanceBudget, resourceDrift } from './fighting-performance-budget.mjs'
import { renderReference } from './fighting-performance-reference.mjs'
import { fightPerformancePower } from './fighting-performance-host.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.FIGHT_PERF_OUTPUT ?? '/tmp/black-whale-fighting-performance'
const duration = Number(process.env.FIGHT_PERF_SECONDS ?? 45)
const warmup = Number(process.env.FIGHT_PERF_WARMUP ?? 8)
const profileSeconds = Number(process.env.FIGHT_PERF_PROFILE ?? 0)
const headless = process.env.FIGHT_PERF_HEADLESS !== '0'
const cpuThrottle = Number(process.env.FIGHT_PERF_CPU ?? 1)
const selected = process.env.FIGHT_PERF_CASES?.split(',')
const suite =
  process.env.FIGHT_PERF_SUITE ?? (process.argv.includes('--stress') ? 'stress' : 'reference')
assert.ok(
  Number.isFinite(duration) && duration > 0 && duration <= 600,
  'Measurement duration must be between 0 and 600 seconds',
)
assert.ok(Number.isFinite(warmup) && warmup >= 0, 'Invalid warmup duration')
assert.ok(Number.isFinite(cpuThrottle) && cpuThrottle >= 1, 'Invalid CPU throttle')
const available = fightingPerformanceCases(suite)
const cases = available.filter((entry) => !selected || selected.includes(entry.id))
assert.ok(cases.length > 0, 'No performance case selected')
if (selected)
  assert.ok(
    selected.every((id) => available.some((entry) => entry.id === id)),
    'Unknown performance case selected',
  )
await mkdir(output, { recursive: true })
const reference = renderReference(
  root,
  process.env.FIGHT_PERF_RENDER_REF,
  process.env.FIGHT_PERF_RENDER_FILES?.split(','),
)
const config = {
  configFile: false,
  root,
  publicDir: 'static',
  mode: 'production',
  plugins: [
    reference?.plugin,
    svelte({ configFile: false, compilerOptions: { dev: false } }),
  ].filter(Boolean),
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  logLevel: 'warn',
  build: {
    outDir: path.join(output, 'production'),
    emptyOutDir: true,
    sourcemap: process.env.FIGHT_PERF_SOURCEMAP !== '0',
    rollupOptions: { input: path.join(root, 'ui-tests/fighting-performance/index.html') },
  },
}
if (process.env.FIGHT_PERF_BUNDLE) config.build.outDir = path.resolve(process.env.FIGHT_PERF_BUNDLE)
else await build(config)
process.stdout.write('Production fight bundle ready.\n')
if (process.env.FIGHT_PERF_BUILD_ONLY === '1') process.exit(0)
const server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } })
const launchBrowser = () =>
  chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless,
    args: ['--use-angle=metal', '--enable-gpu', '--no-proxy-server'],
  })
let browser = await launchBrowser()
const errors = [],
  results = []
function distribution(values) {
  const sorted = values.slice().sort((a, b) => a - b)
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)] ?? 0
  return {
    count: sorted.length,
    min: sorted[0] ?? 0,
    p50: at(0.5),
    p95: at(0.95),
    p99: at(0.99),
    max: sorted.at(-1) ?? 0,
    mean: values.reduce((a, b) => a + b, 0) / Math.max(1, values.length),
  }
}
function summarize(result) {
  const { samples, ...rest } = result
  const intervals = samples.map((s) => s.interval)
  return {
    ...rest,
    intervals: distribution(intervals),
    predictionIntervals: distribution(
      samples.filter((sample) => sample.prediction).map((sample) => sample.interval),
    ),
    predictionRefreshes: samples.filter((sample) => sample.predictionRefreshed).length,
    renderCpu: distribution(samples.map((s) => s.work)),
    renderGpu: distribution(samples.flatMap((s) => (s.gpuMs === undefined ? [] : [s.gpuMs]))),
    drawCalls: distribution(samples.map((s) => s.calls)),
    triangles: distribution(samples.map((s) => s.triangles)),
    geometries: distribution(samples.map((s) => s.geometries)),
    textures: distribution(samples.map((s) => s.textures)),
    resourceDrift: resourceDrift(samples),
    fps: (intervals.length * 1000) / intervals.reduce((a, b) => a + b, 0),
    over25ms: intervals.filter((ms) => ms > 25).length,
    over33ms: intervals.filter((ms) => ms > 33.5).length,
  }
}
try {
  for (const entry of cases) {
    if (!browser.isConnected()) browser = await launchBrowser()
    const hostLoad = []
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: entry.dpr,
    })
    const page = await context.newPage()
    page.setDefaultTimeout(120000)
    page.on('pageerror', (error) => {
      errors.push(error.message)
      process.stderr.write(error.message + '\n')
    })
    await page.goto(
      `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-performance/`,
      { waitUntil: 'domcontentloaded', timeout: 120000 },
    )
    await page.waitForFunction(() => !!window.fightingPerformance)
    await page.bringToFront()
    if (process.env.FIGHT_PERF_GPU === '1')
      await page.evaluate(() => window.fightingPerformance.gpuTiming(true))
    await page.evaluate((entry) => window.fightingPerformance.start(entry), entry)
    await page.waitForTimeout(warmup * 1000)
    if (cpuThrottle !== 1) {
      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle })
    }
    const powerBefore = fightPerformancePower()
    await page.evaluate(() => window.fightingPerformance.reset())
    for (let seconds = 0; seconds < duration; seconds += 10) {
      hostLoad.push({ elapsed: seconds, load: os.loadavg(), freeMemory: os.freemem() })
      await page.waitForTimeout(Math.min(10, duration - seconds) * 1000)
      process.stdout.write(`${entry.id}: ${Math.min(duration, seconds + 10)}/${duration}s\n`)
    }
    const raw = await page.evaluate(() => window.fightingPerformance.result())
    await writeFile(path.join(output, `${entry.id}.frames.json`), JSON.stringify(raw))
    const result = {
      ...entry,
      hostLoad,
      cpuThrottle,
      power: { before: powerBefore, after: fightPerformancePower() },
      ...summarize(raw),
    }
    result.budget = fightingPerformanceBudget(result)
    result.budget.checks.measurement =
      raw.samples.length >= duration * 20 && /Metal Renderer/.test(raw.renderer)
    result.budget.checks.predictionDraws =
      entry.scenario !== 'future' ||
      (result.predictionIntervals.count >= 60 &&
        result.predictionRefreshes >= result.predictionIntervals.count / 4)
    result.budget.checks.predictionP99 =
      entry.scenario !== 'future' || result.predictionIntervals.p99 <= 20
    result.budget.pass &&=
      result.budget.checks.predictionDraws && result.budget.checks.predictionP99
    result.budget.checks.powerStable =
      result.power.before.source === result.power.after.source &&
      result.power.before.lowPowerMode === result.power.after.lowPowerMode
    result.budget.pass &&= result.budget.checks.measurement && result.budget.checks.powerStable
    results.push(result)
    await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
    process.stdout.write(
      `${entry.id}: ${result.fps.toFixed(2)} FPS; frame p95=${result.intervals.p95.toFixed(2)}ms; render CPU p95=${result.renderCpu.p95.toFixed(2)}ms; calls=${result.drawCalls.p50}\n`,
    )
    await page.screenshot({ path: path.join(output, `${entry.id}.png`), fullPage: true })
    if (profileSeconds > 0) {
      const cdp = await context.newCDPSession(page)
      await cdp.send('Profiler.enable')
      await cdp.send('Profiler.setSamplingInterval', { interval: 1000 })
      await cdp.send('Profiler.start')
      await page.waitForTimeout(profileSeconds * 1000)
      const { profile } = await cdp.send('Profiler.stop')
      await writeFile(path.join(output, `${entry.id}.cpuprofile`), JSON.stringify(profile))
      await cdp.detach()
    }
    await page.evaluate(() => window.fightingPerformance.pause())
    await context.close()
    await browser.close()
  }
  const report = {
    date: new Date().toISOString(),
    label: process.env.FIGHT_PERF_LABEL ?? 'reference',
    revision: process.env.FIGHT_PERF_REVISION ?? 'working-source',
    reusedBundle: process.env.FIGHT_PERF_BUNDLE ?? null,
    production: true,
    headless,
    renderReference: reference ? { revision: reference.revision, files: reference.files } : null,
    browser: browser.version(),
    durationSeconds: duration,
    warmupSeconds: warmup,
    profileSeconds,
    suite,
    pass: errors.length === 0 && results.every((entry) => entry.budget.pass),
    machine: execFileSync(
      'sysctl',
      ['hw.model', 'machdep.cpu.brand_string', 'hw.ncpu', 'hw.memsize'],
      { encoding: 'utf8' },
    ).trim(),
    scope:
      'Production-compiled FightStage, actual engine replay, HUD and effects at 1280x900; arena height 560px. Profile window excluded from cadence samples. Metal; fresh browser process per case; headless flag recorded separately; other workstation load uncontrolled. Not a physical input latency measurement.',
    results,
    errors,
  }
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
  assert.equal(
    report.pass,
    true,
    'Performance budget failed; see report.json (no slow frames were filtered)',
  )
} finally {
  await browser.close()
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  )
}
