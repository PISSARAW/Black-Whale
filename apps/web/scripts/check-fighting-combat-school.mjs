import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const hardware = process.env.COMBAT_CHECK_GPU === 'hardware'
const output = process.env.COMBAT_CHECK_OUTPUT ?? '/tmp/black-whale-combat-school'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: ['ui-tests/fighting-combat-school/index.html'],
    holdUntilCrawlEnd: false,
  },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: hardware
    ? ['--use-angle=metal', '--enable-gpu', '--no-proxy-server']
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'],
})
const errors = []
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  page.setDefaultTimeout(90000)
  page.on('pageerror', (error) => {
    errors.push(error.message)
    process.stderr.write(`${error.message}\n`)
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-combat-school/`,
    { waitUntil: 'domcontentloaded', timeout: 90000 },
  )
  await page.waitForFunction(() => Boolean(window.combatFixture))
  const measurements = await page.evaluate(() => window.combatFixture.performanceReport())
  await writeFile(path.join(output, 'engine.json'), JSON.stringify(measurements, null, 2))
  const benchmarkedRoutes = new Set(measurements.combat.map((entry) => entry.route)).size
  process.stdout.write(
    `${benchmarkedRoutes} routes benchmarked with and without capture; hashes match.\n`,
  )
  const fighters = ['kurapika', 'hisoka', 'chrollo', 'benjamin']
  const scenarios = [
    { camera: 0, gap: 6, jump: 0, corner: false },
    { camera: 1, gap: 6, jump: 0, corner: false },
    { camera: 1, gap: 86, jump: 10, corner: false },
    { camera: 1, gap: 6, jump: 10, corner: true },
  ]
  const framing = []
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const fighter of fighters) {
      for (let index = 0; index < scenarios.length; index++) {
        const options = scenarios[index]
        await page.evaluate(
          ({ fighter, options }) => window.combatFixture.scenario(fighter, options),
          { fighter, options },
        )
        await page.waitForFunction(() => window.combatFixture.snapshot().samples.count >= 2)
        await page.waitForTimeout(500)
        const result = await page.evaluate(() => window.combatFixture.snapshot())
        assert.equal(result.failed, false)
        assert.equal(result.pose.anchors.length, 4)
        for (const anchor of result.pose.anchors) {
          assert.ok(
            Math.abs(anchor.x) < 0.95 && anchor.y < 0.82 && anchor.y > -0.98,
            JSON.stringify({ fighter, width, options, anchor }),
          )
        }
        framing.push({ fighter, width, options, pose: result.pose })
        if (index === 1 || index === 3)
          await page.screenshot({
            path: path.join(output, `${fighter}-${width}-${index}.png`),
            fullPage: true,
          })
      }
      process.stdout.write(`Framing verified: ${fighter}, ${width}px\n`)
    }
  }
  await writeFile(path.join(output, 'framing.json'), JSON.stringify(framing, null, 2))
  await page.setViewportSize({ width: 1280, height: 900 })
  const rendering = []
  for (const fighter of fighters)
    for (const camera of [0, 1]) {
      await page.evaluate(({ fighter, camera }) => window.combatFixture.start(fighter, camera), {
        fighter,
        camera,
      })
      await page.waitForTimeout(2000)
      await page.evaluate(() => window.combatFixture.resetSamples())
      await page.waitForTimeout(5000)
      let result = await page.evaluate(() => window.combatFixture.snapshot())
      for (let extra = 0; result.samples.count < 20 && extra < 4; extra++) {
        assert.equal(result.failed, false, `Renderer failed: ${fighter}, camera=${camera}`)
        await page.waitForTimeout(5000)
        result = await page.evaluate(() => window.combatFixture.snapshot())
      }
      assert.equal(result.failed, false)
      assert.ok(result.samples.count >= 5, `Too few rendered frames: ${fighter}, camera=${camera}`)
      rendering.push({ fighter, camera, milliseconds: result.samples })
      await writeFile(path.join(output, 'rendering.json'), JSON.stringify(rendering, null, 2))
      process.stdout.write(
        `${fighter}, camera=${camera}, render p95=${result.samples.p95.toFixed(2)} ms\n`,
      )
    }
  const renderer = await page.evaluate(() => {
    const gl = document.querySelector('canvas')?.getContext('webgl2')
    const info = gl?.getExtension('WEBGL_debug_renderer_info')
    return info && gl ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown'
  })
  assert.deepEqual(errors, [])
  if (hardware)
    assert.match(renderer, /Metal Renderer/, 'Requested hardware renderer is unavailable')
  const report = {
    date: new Date().toISOString(),
    browser: browser.version(),
    renderer,
    machine: execFileSync(
      'sysctl',
      ['hw.model', 'machdep.cpu.brand_string', 'hw.ncpu', 'hw.memsize'],
      { encoding: 'utf8' },
    ).trim(),
    limitations: `${hardware ? 'Headless Chrome with Metal hardware renderer' : 'Headless Chrome with software SwiftShader'}, DPR 1, Heavens Arena, Vite development sources. Workstation load is uncontrolled. Short render passes are not a sustained production benchmark or physical input latency measurement. Camera batch timings are measured over 250 updates per batch.`,
    ...measurements,
    framing,
    rendering,
    errors,
  }
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
  process.stdout.write(`Combat and camera verified: ${output}/report.json\n`)
} finally {
  await browser.close()
  await server.close()
}
