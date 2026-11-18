import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.ROSTER_MOTION_OUTPUT ?? '/tmp/clash-roster-motion'
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
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-roster-motion/`,
  )
  await page.waitForFunction(() => window.rosterMotion)
  const ids = await page.evaluate(() => window.rosterMotion.ids)
  assert.equal(ids.length, 40)
  for (const id of ids) {
    for (const facing of [1, -1]) {
      for (const technique of ['ryu', 'ko']) {
        const result = await page.evaluate(
          ({ id, technique, facing }) => window.rosterMotion.show(id, technique, facing),
          { id, technique, facing },
        )
        assert.equal(result.finite, true, id)
        assert.equal(result.glError, 0, id)
        assert.equal(result.allocation.technique, technique, id)
        assert.ok(result.skins.length > 0, id)
        assert.ok(result.fluxColours.length > 0, id)
        assert.ok(
          result.skins.every((skin) => skin.colour === result.expected),
          id,
        )
        assert.ok(
          result.fluxColours.every((colour) => colour === result.expected),
          id,
        )
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
  process.stdout.write(`Verified ${cases.length} WebGL presentations. ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
