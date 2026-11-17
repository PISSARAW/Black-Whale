import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { build, preview } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
import { distribution } from './command-qualification-report.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(
  process.env.FIGHT_EXPRESSIONS_OUTPUT ?? path.join(root, '../../output/fighting-expressions'),
)
const duration = Number(process.env.FIGHT_EXPRESSIONS_SECONDS ?? 15)
const fighters = ['kurapika', 'benjamin', 'hisoka', 'chrollo', 'feitan', 'phinks']
assert.ok(duration >= 0 && duration <= 120)
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
    rollupOptions: { input: path.join(root, 'ui-tests/fighting-expressions/index.html') },
  },
}
if (process.env.FIGHT_EXPRESSIONS_REUSE !== '1') await build(config)
const server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } })
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--no-proxy-server'],
})
const errors = [],
  cases = [],
  cadence = []
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
page.setDefaultTimeout(60000)
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error' && /THREE|WebGL|shader/i.test(message.text()))
    errors.push(message.text())
})
try {
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-expressions/`,
  )
  await page.waitForFunction(() => window.fightExpressions?.snapshot().renders > 3)
  for (const fighter of fighters) {
    for (const situation of ['concentration', 'effort', 'pain']) {
      const initial = await page.evaluate((options) => window.fightExpressions.select(options), {
        fighter,
        situation,
      })
      await page.waitForFunction(
        (situation) => window.fightExpressions.snapshot().mode === situation,
        situation,
      )
      await page.waitForTimeout(300)
      const snapshot = await page.evaluate(() => window.fightExpressions.snapshot())
      assert.equal(snapshot.hash, initial.hash, 'The face renderer changed combat/replay state')
      assert.equal(snapshot.failed, false)
      assert.equal(
        snapshot.actualPose,
        { concentration: 'idle', effort: 'heavy', pain: 'hit' }[situation],
      )
      if (situation === 'pain') {
        assert.ok(snapshot.face.pain > 0.4)
        assert.equal(snapshot.face.smile, 0)
      }
      await page.screenshot({ path: path.join(output, `${fighter}-${situation}.png`) })
      assert.ok(snapshot.clip.width > 10 && snapshot.clip.height > 10)
      await page.screenshot({
        path: path.join(output, `${fighter}-${situation}-face.png`),
        clip: snapshot.clip,
      })
      cases.push({ fighter, situation, ...snapshot, intervals: undefined, probe: undefined })
    }
    await page.evaluate(
      (fighter) => window.fightExpressions.select({ fighter, situation: 'pain', facing: -1 }),
      fighter,
    )
    await page.waitForFunction(() => window.fightExpressions.snapshot().mode === 'pain')
    await page.waitForTimeout(200)
    const mirrored = await page.evaluate(() => window.fightExpressions.snapshot())
    assert.ok(mirrored.face.pain > 0.4)
    await page.screenshot({ path: path.join(output, `${fighter}-pain-left.png`) })
    cases.push({
      ...mirrored,
      fighter,
      situation: 'pain-left',
      intervals: undefined,
      probe: undefined,
    })
    process.stdout.write(`${fighter}: three real combat expressions and both facings verified\n`)
    if (duration)
      for (const expressions of [false, true]) {
        await page.evaluate((options) => window.fightExpressions.select(options), {
          fighter,
          situation: 'combat',
          expressions,
        })
        await page.waitForTimeout(3000)
        await page.evaluate(() => window.fightExpressions.resetMetrics())
        const load = os.loadavg()
        await page.waitForTimeout(duration * 1000)
        const result = await page.evaluate(() => window.fightExpressions.snapshot())
        const samples = result.probe.samples
        const intervals = distribution(samples.map((sample) => sample.interval))
        const cpu = distribution(samples.map((sample) => sample.work))
        const fps =
          (samples.length * 1000) / samples.reduce((sum, sample) => sum + sample.interval, 0)
        const pass = fps >= 59 && intervals.p95 <= 17.5 && intervals.p99 <= 20 && cpu.p95 <= 12
        assert.match(result.probe.renderer, /Metal/)
        assert.ok(
          result.frame >= duration * 40,
          'Simulation must progress during the cadence check',
        )
        cadence.push({
          fighter,
          expressions,
          duration,
          load,
          fps,
          intervals,
          cpu,
          pass,
          frame: result.frame,
          renderer: result.probe.renderer,
          geometries: result.geometries,
          textures: result.textures,
        })
        await writeFile(
          path.join(output, `${fighter}-${expressions ? 'expressions' : 'baseline'}.frames.json`),
          JSON.stringify(result.probe),
        )
        process.stdout.write(
          `${fighter}/${expressions ? 'expressions' : 'baseline'}: ${fps.toFixed(2)} FPS; p95=${intervals.p95.toFixed(1)}ms; CPU p95=${cpu.p95.toFixed(1)}ms; pass=${pass}\n`,
        )
      }
  }
  assert.deepEqual(errors, [])
  const cards = await Promise.all(
    fighters.map(
      async (fighter) =>
        `<section><h2>${fighter}</h2><div>${(await Promise.all(['concentration', 'effort', 'pain'].map(async (situation) => `<figure><img src="data:image/png;base64,${(await readFile(path.join(output, `${fighter}-${situation}-face.png`))).toString('base64')}"><figcaption>${situation === 'pain' ? 'douleur' : situation}</figcaption></figure>`))).join('')}</div></section>`,
    ),
  )
  await page.setContent(
    `<html><head><style>body{margin:0;padding:24px;background:#101820;color:#edf0e8;font:16px system-ui}h1{font-size:23px;margin:0 0 8px}p{color:#b5c5cb}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}section{background:#18242d;padding:12px;border-radius:8px}h2{text-transform:capitalize;margin:0 0 8px}section>div{display:flex;gap:12px}figure{margin:0;flex:1;text-align:center}img{width:150px;height:160px;object-fit:contain;image-rendering:auto}figcaption{font-size:14px;color:#cad8dc}</style></head><body><h1>Clash · expressions pendant le combat</h1><p>Les six personnages · détails capturés avec la caméra habituelle · concentration, effort, douleur</p><main>${cards.join('')}</main></body></html>`,
  )
  await page.screenshot({ path: path.join(output, 'expressions-six.png'), fullPage: true })
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        version: 1,
        scope: 'six-fighter-emotion-rendering',
        machine: { cpu: os.cpus()[0].model, cores: os.cpus().length },
        cases,
        cadence,
        errors,
        pass: errors.length === 0 && cadence.every((row) => row.pass),
      },
      null,
      2,
    ) + '\n',
  )
  if (cadence.some((row) => !row.pass)) process.exitCode = 1
} finally {
  await browser.close()
  await new Promise((done) => server.httpServer.close(done))
}
