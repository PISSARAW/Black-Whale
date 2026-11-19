import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(root, '../../output/kalluto-reference')
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
  const page = await browser.newPage({ viewport: { width: 1120, height: 650 } })
  page.setDefaultTimeout(90000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/kalluto-reference/`,
    { timeout: 90000 },
  )
  await page.waitForFunction(() => window.kallutoReference)
  for (const kind of ['idle', 'fan', 'scatter', 'serpent']) {
    for (const facing of [1, -1]) {
      const result = await page.evaluate(
        ({ kind, facing }) => window.kallutoReference.show(kind, facing),
        { kind, facing },
      )
      assert.ok(result.finite, `${kind}/${facing}: non-finite position`)
      assert.equal(result.glError, 0)
      if (kind === 'serpent') assert.ok(result.marked && result.shots > 0)
      cases.push(result)
      await page.screenshot({ path: path.join(output, `${kind}-${facing}.png`) })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, cases, errors }, null, 2),
  )
  process.stdout.write(`Kalluto: ${cases.length} vues vérifiées dans ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
