import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.HANZO_COMBAT_OUTPUT ?? '/tmp/clash-hanzo-combat'
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
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
let browser
const errors = [],
  cases = []
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync(chrome) ? chrome : undefined),
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal'],
  })
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-tests/hanzo-combat/`)
  await page.waitForFunction(() => window.hanzoCombat)
  async function shot(options, name) {
    const result = await page.evaluate((options) => window.hanzoCombat.show(options), options)
    assert.equal(result.finite, true)
    assert.equal(result.glError, 0)
    assert.deepEqual(result.violations, [], JSON.stringify(options))
    assert.ok(result.plan)
    if (result.grounded) assert.ok(Math.abs(result.lowestFoot) < 0.04, JSON.stringify(result))
    cases.push(result)
    if (name) await page.screenshot({ path: path.join(output, `${name}.png`) })
    return result
  }
  for (const facing of [1, -1]) {
    await shot({ phase: 'idle', facing }, `idle-${facing}`)
    for (const slot of [
      'standingLight',
      'standingHeavy',
      'lowLight',
      'lowHeavy',
      'airLight',
      'airHeavy',
      'forwardLight',
      'forwardHeavy',
      'backHeavy',
      'forwardSpecial',
      'downSpecial',
      'backSpecial',
    ]) {
      const first = await shot({ phase: 'strike', slot, facing })
      for (const frame of [
        0,
        first.timing.startup,
        first.timing.startup + first.timing.active + 4,
      ]) {
        const value = await shot(
          { phase: 'strike', slot, facing, frame },
          `${slot}-${frame}-${facing}`,
        )
        assert.equal(value.moveId, `hanzo:${slot}`)
        assert.equal(value.blade.parent, 'elbow-right')
        if (['forwardSpecial', 'backSpecial'].includes(slot) && frame === first.timing.startup) {
          assert.equal(value.blade.extension, 1)
          assert.equal(value.blade.deployed, true)
          assert.ok(value.blade.ahead > 0.12)
        }
      }
    }
    for (const disabled of [{ confiscated: true }, { projected: true }]) {
      const result = await shot(
        { phase: 'idle', facing, ...disabled },
        `blade-unavailable-${Object.keys(disabled)[0]}-${facing}`,
      )
      assert.equal(result.blade.visible, false)
      assert.equal(result.blade.extension, 0)
    }
    for (const phase of ['advance', 'retreat', 'dash', 'backdash'])
      for (const frame of [0, 5, 11])
        await shot({ phase, facing, frame }, `${phase}-${frame}-${facing}`)
  }
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, cases, errors }, null, 2),
  )
  process.stdout.write(`Hanzo: ${cases.length} rendered poses verified, both facings. ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
