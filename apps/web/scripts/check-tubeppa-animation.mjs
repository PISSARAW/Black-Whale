import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const character = process.env.KAMEO_ANIMATION_CHARACTER ?? 'tubeppa'
assert.ok(['tubeppa', 'marayam', 'zhanglei', 'morena', 'luzurus', 'salesale'].includes(character))
const output =
  process.env.KAMEO_ANIMATION_OUTPUT ??
  process.env.TUBEPPA_ANIMATION_OUTPUT ??
  `/tmp/black-whale-${character}-animation`
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  cacheDir: path.join(output, 'vite-cache'),
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
let browser
const errors = []
try {
  browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1300, height: 780 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/tubeppa-animation/?character=${character}`,
  )
  await page.waitForFunction(() => window.tubeppaFixture, undefined, { timeout: 120000 })
  await page.screenshot({ path: path.join(output, `${character}-expressions.png`) })
  const report = await page.evaluate(() => window.tubeppaFixture.report())
  assert.deepEqual(
    report.map(({ mode }) => mode),
    ['concentration', 'concentration', 'effort', 'effort', 'pain'],
  )
  assert.ok(report[2].effort > report[3].effort)
  assert.equal(report[4].effort, 0)
  assert.ok(report[4].pain > 0.3)
  if ((process.env.KAMEO_ANIMATION_FILM ?? process.env.TUBEPPA_ANIMATION_FILM) === '1') {
    const frames = path.join(output, 'frames')
    await mkdir(frames, { recursive: true })
    const count = await page.evaluate(() => window.tubeppaFixture.frameCount)
    for (let frame = 0; frame < count; frame++) {
      await page.evaluate((frame) => window.tubeppaFixture.movie(frame), frame)
      await page.screenshot({ path: path.join(frames, `${String(frame).padStart(3, '0')}.png`) })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, report, errors }, null, 2),
  )
  console.log(`${character}: expressions and production kameo scene verified. ${output}`)
} finally {
  await browser?.close()
  await server.close()
}
