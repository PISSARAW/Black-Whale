import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.FIGHT_MOTION_OUTPUT ?? '/tmp/black-whale-fighting-motion'
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
try {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  browser = await chromium.launch({
    headless: true,
    executablePath: existsSync(chrome) ? chrome : undefined,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1680 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-motion/`)
  await page.waitForFunction(() => window.fightMotionFixture)
  const fixture = await page.evaluate(() => ({
    count: window.fightMotionFixture.count,
    ids: window.fightMotionFixture.ids,
    slots: window.fightMotionFixture.slots,
  }))
  assert.equal(fixture.ids.length, 40)
  assert.equal(fixture.slots.length, 9)
  assert.equal(fixture.count, 360)
  const references = new Set(['kurapika', 'hisoka', 'chrollo', 'benjamin'])
  for (const id of fixture.ids) {
    for (const facing of [1, -1]) {
      for (const phase of ['startup', 'active', 'recovery']) {
        await page.evaluate(
          ({ id, phase, facing }) => window.fightMotionFixture.show(phase, facing, id),
          { id, phase, facing },
        )
        if (references.has(id)) {
          await page.screenshot({ path: path.join(output, `${id}-${phase}-${facing}.png`) })
        }
      }
    }
  }
  assert.equal(await page.evaluate(() => window.fightMotionFixture.renderedCount()), 360)
  assert.deepEqual(errors, [])
  process.stdout.write(
    `40 fighters × 9 attacks × 3 phases × 2 facings rendered; 24 reference sheets captured. Review images: ${output}\n`,
  )
} finally {
  await browser?.close()
  await server.close()
}
