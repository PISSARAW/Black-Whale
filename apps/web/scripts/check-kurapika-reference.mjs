import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(root, '../../output/kurapika-reference')
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 790 } })
  page.setDefaultTimeout(90000)
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/kurapika-reference/`,
    { timeout: 90000 },
  )
  await page.waitForFunction(() => window.kurapikaReference)
  const slots = await page.evaluate(() => window.kurapikaReference.slots)
  for (const slot of slots) {
    for (const facing of [1, -1]) {
      const result = await page.evaluate(
        ({ slot, facing }) => window.kurapikaReference.show(slot, facing),
        { slot, facing },
      )
      assert.equal(result.glError, 0)
      assert.ok(result.audits.every((audit) => audit.finite))
      if (slot === 'capture') assert.ok(result.audits.every((audit) => audit.captured))
      cases.push(result)
      await page.screenshot({ path: path.join(output, `${slot}-${facing}.png`) })
    }
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, cases, errors }, null, 2),
  )
  process.stdout.write(
    `Kurapika: ${cases.length} planches / ${cases.length * 3} poses vérifiées dans ${output}\n`,
  )
} finally {
  await browser?.close()
  await server.close()
}
