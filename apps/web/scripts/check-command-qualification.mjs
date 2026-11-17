import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import { build, preview } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
import { cadenceResult, latencyResult, bundleFingerprint } from './command-qualification-report.mjs'

const installedRoot = fileURLToPath(new URL('../', import.meta.url))
const root = path.resolve(process.env.QUALIFICATION_SOURCE_ROOT ?? installedRoot)
const repository = path.resolve(installedRoot, '../..')
const output = path.resolve(
  process.env.CLASH_QUALIFICATION_OUTPUT ??
    path.join(repository, 'output/clash-command-qualification'),
)
const duration = Number(process.env.QUALIFICATION_SECONDS ?? 30)
const warmup = Number(process.env.QUALIFICATION_WARMUP ?? 12)
const soakSeconds = Number(process.env.QUALIFICATION_SOAK_SECONDS ?? 600)
const latencyTrials = Number(process.env.QUALIFICATION_LATENCY_TRIALS ?? 100)
const stressGraphics = process.env.QUALIFICATION_STRESS_GRAPHICS ?? 'quality'
assert.ok(['performance', 'balanced', 'quality'].includes(stressGraphics))
const fighters = ['kurapika', 'benjamin', 'hisoka', 'chrollo', 'feitan', 'phinks']
const requested = process.env.QUALIFICATION_CASES?.split(',')
const latencyFighters = process.env.QUALIFICATION_LATENCY_FIGHTERS?.split(',') ?? fighters
assert.ok(duration > 0 && duration <= 600 && warmup >= 0 && soakSeconds >= 0 && soakSeconds <= 600)
assert.ok(Number.isInteger(latencyTrials) && latencyTrials >= 0 && latencyTrials <= 200)
assert.ok(latencyFighters.every((fighter) => fighters.includes(fighter)))
await mkdir(output, { recursive: true })
const reference = JSON.parse(await readFile(path.join(output, 'frozen-tapes.json'), 'utf8'))
const buildDirectory = path.resolve(
  process.env.QUALIFICATION_BUNDLE ?? path.join(output, 'production'),
)
const config = {
  configFile: false,
  root,
  publicDir: 'static',
  mode: 'production',
  plugins: [svelte({ configFile: false, compilerOptions: { dev: false } })],
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  css: { postcss: { plugins: [] } },
  logLevel: 'warn',
  build: {
    outDir: buildDirectory,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: { input: path.join(root, 'ui-tests/fighting-qualification/index.html') },
  },
}
if (!process.env.QUALIFICATION_BUNDLE) {
  await build(config)
  await copyFile(
    path.join(output, 'frozen-tapes.json'),
    path.join(buildDirectory, 'qualification-replays.json'),
  )
}
const bundle = await bundleFingerprint(buildDirectory)
const server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } })
const address = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-qualification/`
let browser
const results = [],
  latency = [],
  errors = []
const cases = fighters.flatMap((fighter) =>
  ['neutral', 'interactive'].map((terrain) => ({
    id: `${fighter}-${terrain}`,
    fighter,
    terrain,
    graphics: 'balanced',
  })),
)
for (const [scenario, fighter] of [
  ['projectiles', 'franklin'],
  ['future', 'tserriednich'],
  ['post-mortem', 'camilla'],
  ['guards', 'yokotani'],
  ['transformation', 'biscuit'],
])
  cases.push({
    id: `stress-${scenario}`,
    fighter: 'kurapika',
    terrain: 'interactive',
    graphics: stressGraphics,
    stress: scenario,
    stressFighter: fighter,
  })
if (requested)
  assert.ok(
    requested.every((id) => cases.some((entry) => entry.id === id)),
    'Unknown qualification case',
  )
const selected = cases.filter((entry) => !requested || requested.includes(entry.id))
if (process.env.QUALIFICATION_ONLY_SOAK === '1') selected.splice(0)
const machine = {
  model: execFileSync('sysctl', ['-n', 'hw.model'], { encoding: 'utf8' }).trim(),
  cpu: os.cpus()[0].model,
  cores: os.cpus().length,
  memory: os.totalmem(),
  platform: process.platform,
  arch: process.arch,
  node: process.version,
}
const report = {
  version: 1,
  scope: 'software-on-one-machine',
  startedAt: new Date().toISOString(),
  machine,
  bundle,
  reference: {
    ruleset: reference.ruleset,
    sourceFingerprint: reference.sourceFingerprint,
    archiveSha256: reference.archiveSha256,
  },
  duration,
  warmup,
  soakSeconds,
  latencyTrials,
  physicalController: { status: 'pending', reason: 'User has no controller available' },
  physicalLatency: 'not measured',
  secondMachine: 'not available',
  results,
  lifecycles: [],
  latency,
  errors,
  complete: false,
  pass: false,
}
if (process.env.QUALIFICATION_SOURCE_PROVENANCE)
  report.sourceProvenance = JSON.parse(
    await readFile(process.env.QUALIFICATION_SOURCE_PROVENANCE, 'utf8'),
  )
const save = () =>
  writeFile(path.join(output, 'qualification.json'), JSON.stringify(report, null, 2) + '\n')

async function newPage() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  page.setDefaultTimeout(30000)
  page.on('pageerror', (error) => {
    errors.push(error.message)
    process.stderr.write(`Browser error: ${error.message}\n`)
  })
  await page.goto(address, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => Boolean(window.commandQualification))
  const loaded = await page.evaluate(() => window.commandQualification.load())
  assert.equal(loaded.archiveSha256, reference.archiveSha256)
  if (report.measuredRuleset) assert.equal(loaded.measuredRuleset, report.measuredRuleset)
  report.measuredRuleset = loaded.measuredRuleset
  report.referenceCheckpointsVerified = loaded.checkpointsVerified
  return { page, context }
}

async function measureCase(entry) {
  const { page, context } = await newPage()
  try {
    await page.evaluate((options) => window.commandQualification.start(options), entry)
    await page.waitForFunction(() => window.commandQualification.result().samples.length > 10)
    await page.waitForTimeout(warmup * 1000)
    await page.evaluate(() => window.commandQualification.resetMeasurement())
    const load = []
    for (let elapsed = 0; elapsed < duration; elapsed += 10) {
      load.push({ elapsed, load: os.loadavg(), freeMemory: os.freemem() })
      await page.waitForTimeout(Math.min(10, duration - elapsed) * 1000)
      process.stdout.write(`${entry.id}: ${Math.min(duration, elapsed + 10)}/${duration}s\n`)
    }
    const raw = await page.evaluate(() => window.commandQualification.result())
    assert.match(raw.renderer, /Metal/)
    assert.equal(raw.failure, '')
    const result = {
      ...entry,
      load,
      renderer: raw.renderer,
      resolution: raw.resolution,
      verified: raw.verified,
      ...cadenceResult(raw),
    }
    results.push(result)
    await writeFile(path.join(output, `${entry.id}.frames.json`), JSON.stringify(raw))
    await page.locator('main').screenshot({ path: path.join(output, `${entry.id}.png`) })
    await save()
    process.stdout.write(
      `${entry.id}: ${result.fps.toFixed(2)} FPS; p95=${result.intervals.p95.toFixed(1)}ms; pass=${result.pass}\n`,
    )
  } finally {
    await context.close()
  }
}

async function measureLatency(fighter, simulated) {
  const { page, context } = await newPage()
  try {
    await page.evaluate(
      ({ fighter, simulated }) => window.commandQualification.latency(fighter, simulated),
      { fighter, simulated },
    )
    for (let index = 0; index < latencyTrials; index++) {
      await page.evaluate(() => window.commandQualification.resetTrial())
      await page.waitForFunction(() => window.commandQualification.ready())
      if (simulated) await page.evaluate(() => window.commandQualification.pressPad())
      else await page.keyboard.press('j')
      await page
        .waitForFunction(() => window.commandQualification.completed(), null, { timeout: 1000 })
        .catch(() => {})
    }
    const raw = await page.evaluate(() => window.commandQualification.inputResult())
    const result = {
      fighter,
      source: simulated ? 'simulated-gamepad-state' : 'keyboard-event',
      ...latencyResult(raw, latencyTrials),
      trials: raw,
    }
    latency.push(result)
    await save()
    process.stdout.write(
      `${fighter}/${result.source}: ${raw.length} trials; p95=${result.eventToDrawMs.p95}; missing=${result.missing}; pass=${result.pass}\n`,
    )
    if (!simulated) report.lifecycles.push({ fighter, ...(await lifecycle(page)) })
  } finally {
    await context.close()
  }
}

async function lifecycle(page) {
  await page.evaluate(() => window.commandQualification.resetTrial())
  await page.waitForFunction(() => window.commandQualification.ready())
  await page.keyboard.down('d')
  await page.waitForTimeout(50)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.keyboard.up('d')
  const released = await page.evaluate(() => window.commandQualification.inputSnapshot())
  assert.equal(Object.values(released.held).some(Boolean), false)
  await page.evaluate(() => window.commandQualification.pause(true))
  const before = await page.evaluate(() => window.commandQualification.inputSnapshot().state.frame)
  await page.waitForTimeout(80)
  assert.equal(
    await page.evaluate(() => window.commandQualification.inputSnapshot().state.frame),
    before,
  )
  await page.evaluate(() => window.commandQualification.pause(false))
  await page.evaluate(() => window.commandQualification.resetTrial())
  await page.waitForFunction(() => window.commandQualification.ready())
  await page.keyboard.down('l')
  await page.waitForTimeout(50)
  assert.equal(
    (await page.evaluate(() => window.commandQualification.inputSnapshot())).held.hatsu,
    true,
  )
  await page.keyboard.up('l')
  await page.waitForTimeout(100)
  const special = await page.evaluate(() => window.commandQualification.inputSnapshot())
  assert.equal(special.held.hatsu, false)
  assert.equal(special.attempts.length, 1)
  await page.keyboard.up('l')
  await page.waitForTimeout(40)
  assert.equal(
    (await page.evaluate(() => window.commandQualification.inputSnapshot())).attempts.length,
    1,
  )
  return {
    focusCleared: true,
    pauseFrameStable: true,
    hatsuHeld: true,
    singleRelease: true,
    specialOutcome: special.attempts[0].outcome,
  }
}

async function measureSoak() {
  const { page, context } = await newPage()
  try {
    await page.evaluate(() =>
      window.commandQualification.start({
        fighter: 'kurapika',
        terrain: 'interactive',
        graphics: 'balanced',
        soak: true,
      }),
    )
    await page.waitForFunction(() => window.commandQualification.result().samples.length > 10)
    await page.evaluate(() => window.commandQualification.resetMeasurement())
    const load = []
    for (let elapsed = 0; elapsed < soakSeconds; elapsed += 10) {
      load.push({ elapsed, load: os.loadavg(), freeMemory: os.freemem() })
      await page.waitForTimeout(Math.min(10, soakSeconds - elapsed) * 1000)
      assert.equal(errors.length, 0, 'Invalid soak: browser error')
      const progress = await page.evaluate(() => window.commandQualification.status())
      assert.equal(progress.failure, '', 'Invalid soak: replay divergence')
      assert.ok(progress.verified > 0, 'Invalid soak: simulation did not complete a replay')
      if ((elapsed + 10) % 30 === 0)
        process.stdout.write(
          `Six-fighter soak: ${Math.min(soakSeconds, elapsed + 10)}/${soakSeconds}s\n`,
        )
    }
    const raw = await page.evaluate(() => window.commandQualification.result())
    const groups = fighters.map((fighter) => {
      const samples = raw.samples.filter((sample) => sample.fighter === fighter)
      const start = samples[0]?.at ?? 0
      return {
        fighter,
        warmupFrames: samples.filter((sample) => sample.at - start < 12000).length,
        ...cadenceResult({
          ...raw,
          samples: samples.filter((sample) => sample.at - start >= 12000),
        }),
      }
    })
    report.soak = {
      seconds: soakSeconds,
      load,
      transitions: raw.transitions,
      groups,
      pass: groups.every(
        (group) =>
          group.pass && group.resourceDrift.geometries <= 0 && group.resourceDrift.textures <= 0,
      ),
    }
    await writeFile(path.join(output, 'soak.frames.json'), JSON.stringify(raw))
    await save()
  } finally {
    await context.close()
  }
}

try {
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: [
      '--use-angle=metal',
      '--enable-gpu',
      '--no-proxy-server',
      '--autoplay-policy=no-user-gesture-required',
    ],
  })
  report.browser = await browser.version()
  for (const entry of selected) await measureCase(entry)
  if (latencyTrials)
    for (const fighter of latencyFighters)
      for (const simulated of [false, true]) await measureLatency(fighter, simulated)
  if (soakSeconds) await measureSoak()
  report.complete = true
  report.fullScope =
    selected.length === cases.length &&
    duration >= 30 &&
    latencyTrials >= 100 &&
    latencyFighters.length === 6 &&
    soakSeconds >= 600
  report.pass =
    errors.length === 0 &&
    results.every((row) => row.pass) &&
    latency.every((row) => row.pass) &&
    (!soakSeconds || report.soak.pass)
  await save()
  process.stdout.write(
    `Qualification finished: pass=${report.pass}; fullScope=${report.fullScope}; ${output}\n`,
  )
  if (!report.pass) process.exitCode = 1
} catch (error) {
  report.errors.push(`Runner: ${error.message}`)
  report.pass = false
  await save()
  throw error
} finally {
  await browser?.close()
  await new Promise((done) => server.httpServer.close(done))
}
