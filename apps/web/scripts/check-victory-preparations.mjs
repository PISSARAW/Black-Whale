import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(root, '../../output/victory-preparations')
const entries = (await readdir(path.join(root, 'demos/fighting-showcase')))
  .filter((name) =>
    /(?:-fatality|-victory|hisoka-fear|kurapika-troupe|kurapika-judgment|personal-guard)\.html$/.test(
      name,
    ),
  )
  .sort()
const cases = entries.flatMap((name) =>
  name === 'personal-guard.html'
    ? ['longhi', 'furykov'].map((hero) => ({
        name: `personal-guard-${hero}`,
        url: `${name}?hero=${hero}&capture=1`,
      }))
    : [{ name: name.replace('.html', ''), url: `${name}?capture=1` }],
)
const only = process.argv
  .find((arg) => arg.startsWith('--only='))
  ?.slice(7)
  .split(',')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: entries.map((name) => `demos/fighting-showcase/${name}`),
    holdUntilCrawlEnd: false,
  },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({
  headless: true,
  executablePath: existsSync(chrome) ? chrome : undefined,
  args: ['--enable-unsafe-swiftshader'],
})
const results = []
try {
  for (const entry of cases.filter((entry) => !only || only.includes(entry.name))) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
    })
    page.setDefaultTimeout(90000)
    try {
      await page.goto(
        `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-showcase/${entry.url}`,
        { waitUntil: 'domcontentloaded' },
      )
      assert.deepEqual(errors, [])
      await Promise.race([
        page.waitForFunction(() => window.fightingShowcase?.ready()),
        new Promise((_, reject) => page.once('pageerror', reject)),
      ])
      const report = await page.evaluate(() => window.fightingShowcase.report())
      assert.notEqual(report.failed, true)
      if (!report.standalone)
        assert.equal(report.winner, entry.name === 'chrollo-victory' ? 'opponent' : 'player')
      if (report.maximumFinalStretch !== undefined) assert.ok(report.maximumFinalStretch > 10)
      if (report.chainJailTarget) {
        assert.equal(report.chainJailTarget, 'chrollo')
        assert.equal(report.emperorTimeAtVictory, true)
        assert.ok(
          report.audit.some(
            (event) => event.kind === 'chain-jail-capture' && event.targetNen === 'zetsu',
          ),
        )
      }
      await page.evaluate(
        (age) => window.fightingShowcase.seek(age),
        (report.victory?.startFrame ?? 0) + 324,
      )
      await page.waitForTimeout(500)
      if (report.nativeState) {
        const state = JSON.parse(report.nativeState)
        assert.equal(state.phase, 'finished')
        assert.equal(state.winner, 'player')
        assert.equal(
          await page.evaluate(() => window.fightingShowcase.report().nativeState),
          report.nativeState,
        )
      }
      assert.deepEqual(errors, [])
      await page.screenshot({ path: path.join(output, `${entry.name}.png`) })
      results.push({ name: entry.name, ok: true, winner: report.winner })
      process.stdout.write(`PASS ${entry.name}\n`)
    } catch (error) {
      results.push({ name: entry.name, ok: false, error: String(error), errors })
      process.stdout.write(`FAIL ${entry.name}: ${String(error)} ${JSON.stringify(errors)}\n`)
    } finally {
      await page.close()
    }
    await writeFile(path.join(output, 'report.json'), JSON.stringify(results, null, 2))
  }
  assert.ok(results.length > 0, 'No matching victory demo')
  assert.equal(
    results.filter((entry) => !entry.ok).length,
    0,
    'Victory preparation failures; see report.json',
  )
} finally {
  await browser.close()
  await server.close()
}
