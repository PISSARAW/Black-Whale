import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.PHYSICAL_ROSTER_OUTPUT ?? '/tmp/clash-physical-roster'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, watch: null, hmr: false },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
let browser
const errors = [],
  cases = []
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  })
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-physical-roster/`,
  )
  await page.waitForFunction(() => window.physicalRoster)
  const ids = await page.evaluate(() => window.physicalRoster.ids)
  assert.equal(ids.length, 40)
  for (const id of ids) {
    for (const facing of [1, -1]) {
      for (const technique of ['ryu', 'ko']) {
        const result = await page.evaluate(
          ({ id, technique, facing }) => window.physicalRoster.show(id, technique, facing),
          { id, technique, facing },
        )
        assert.equal(result.finite, true, id)
        assert.equal(result.glError, 0, id)
        assert.equal(result.unchanged, true, id)
        assert.equal(result.hits, 2, id)
        assert.ok(result.reactions >= 2, id)
        assert.ok(result.overlap <= 1e-6, id)
        assert.ok(result.rebuilds > 0, id)
        assert.ok(result.colours.length > 0, id)
        assert.ok(result.flowColours.length > 0, id)
        assert.ok(
          result.colours.every((c) => c === result.expected),
          id,
        )
        assert.ok(
          result.flowColours.every((c) => c === result.expected),
          id,
        )
        if (technique === 'ko') assert.ok(result.koFrames > 0, id)
        cases.push(result)
        if (facing === 1 && technique === 'ryu')
          await page.screenshot({ path: path.join(output, `${id}.png`) })
      }
    }
    process.stdout.write(`${id}: Ryu/Ko, two facings, native aura colour.\n`)
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, cases, errors }, null, 2),
  )
  process.stdout.write(`Verified ${cases.length} physical WebGL presentations. ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
