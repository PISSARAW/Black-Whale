import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.REPLAY_CHECK_OUTPUT ?? '/tmp/black-whale-replay-performance'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: { entries: ['ui-tests/fighting-replay-lab/index.html'], holdUntilCrawlEnd: false },
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
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'],
})
const errors = []
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  page.on('pageerror', (error) => {
    errors.push(error.message)
    process.stderr.write(`${error.message}\n`)
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-replay-lab/`,
  )
  await page.waitForFunction(() => Boolean(window.replayBench))
  const engine = await page.evaluate(() => window.replayBench.engine())
  await writeFile(path.join(output, 'engine.json'), JSON.stringify(engine, null, 2))
  process.stdout.write(`Engine benchmark: ${engine.length} runs, hashes match\n`)
  const rendering = []
  for (const id of ['kurapika', 'hisoka', 'chrollo', 'benjamin']) {
    for (const recording of [false, true]) {
      await page.evaluate(({ id, recording }) => window.replayBench.start(id, recording), {
        id,
        recording,
      })
      await page.waitForTimeout(3000)
      await page.evaluate(() => window.replayBench.resetSamples())
      await page.waitForTimeout(5000)
      let result = await page.evaluate(() => window.replayBench.result())
      for (let extra = 0; result.renderMilliseconds.count < 20 && extra < 4; extra++) {
        await page.waitForTimeout(5000)
        result = await page.evaluate(() => window.replayBench.result())
      }
      assert.ok(result.renderMilliseconds.count >= 5, `No rendered frames for ${id}`)
      rendering.push({ id, recording, ...result })
      process.stdout.write(
        `${id}, recording=${recording}: render p95=${result.renderMilliseconds.p95.toFixed(2)} ms\n`,
      )
    }
  }
  await page.screenshot({ path: path.join(output, 'reference.png'), fullPage: true })
  assert.deepEqual(errors, [])
  const report = {
    date: new Date().toISOString(),
    browser: browser.version(),
    machine: execFileSync(
      'sysctl',
      ['hw.model', 'machdep.cpu.brand_string', 'hw.ncpu', 'hw.memsize'],
      { encoding: 'utf8' },
    ).trim(),
    limitations:
      'Headless Chrome, SwiftShader software WebGL, Vite development source. Concurrent workstation activity is uncontrolled. Not a physical input-to-photon latency measurement. Render samples include the real HUD and replay panel.',
    engine,
    rendering,
    errors,
  }
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
  process.stdout.write(`Replay performance report: ${output}/report.json\n`)
} finally {
  await browser.close()
  await server.close()
}
