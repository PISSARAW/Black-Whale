import assert from 'node:assert/strict'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output =
  process.env.FEITAN_COMBAT_OUTPUT ?? path.join(root, '../../output/clash-feitan-combat')
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
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-feitan-combat/`,
  )
  await page.waitForFunction(() => window.feitanCombatFixture)
  assert.equal(await page.evaluate(() => window.feitanCombatFixture.count), 16)
  for (const facing of [1, -1])
    for (const phase of ['startup', 'active', 'recovery']) {
      await page.evaluate(({ phase, facing }) => window.feitanCombatFixture.show(phase, facing), {
        phase,
        facing,
      })
      await page.screenshot({ path: path.join(output, `${phase}-${facing}.png`), fullPage: true })
      if (phase === 'active') {
        const contacts = await page.evaluate(() => window.feitanCombatFixture.diagnostics())
        for (const contact of contacts.slice(0, 12))
          assert.ok(
            (contact.tip[0] - contact.hand[0]) * facing > 0.1,
            `${contact.slot}: weapon must face its hitbox`,
          )
        await writeFile(
          path.join(output, `contacts-${facing}.json`),
          JSON.stringify(contacts, null, 2),
        )
      }
    }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, views: 6, poses: 16, errors }, null, 2),
  )
  process.stdout.write(
    `Feitan combat: 12 attacks + 4 movements × 3 phases × 2 facings: ${output}\n`,
  )
} finally {
  await browser?.close()
  await server.close()
}
