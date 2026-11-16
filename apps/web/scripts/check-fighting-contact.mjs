import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.FIGHT_CONTACT_OUTPUT ?? '/tmp/black-whale-fighting-contact'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(output, 'vite-cache'),
  plugins: [
    {
      name: 'report-scene-fixture-errors',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('/FightScene.svelte')) return
        return code.replace(
          '} catch {\n        failed = true',
          '} catch (error) {\n        console.error(error); failed = true',
        )
      },
    },
    svelte({ configFile: false }),
  ],
  optimizeDeps: { entries: ['ui-tests/fighting-contact/index.html'], holdUntilCrawlEnd: false },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
let browser
const errors = []
const report = []
try {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync(chrome) ? chrome : undefined),
    args: ['--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  })
  page.setDefaultTimeout(90000)
  page.on('pageerror', (error) => {
    errors.push(error.message)
    process.stderr.write(error.message + '\n')
  })
  page.on('console', (message) => {
    if (message.type() === 'error') process.stderr.write(message.text() + '\n')
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-contact/`,
    { waitUntil: 'domcontentloaded' },
  )
  await page
    .waitForFunction(() => window.contactFixture?.snapshot()?.renders > 2, undefined, {
      timeout: 20000,
    })
    .catch(async (error) => {
      await page.screenshot({ path: path.join(output, 'failed.png') })
      process.stderr.write(await page.locator('body').innerText())
      throw error
    })
  const ids = ['kurapika', 'hisoka', 'chrollo', 'benjamin']
  const normals = [
    'standingLight',
    'standingHeavy',
    'lowLight',
    'lowHeavy',
    'airLight',
    'airHeavy',
    'forwardLight',
    'forwardHeavy',
    'backHeavy',
  ]
  // A one-pixel WebGL line can cover half a physical pixel under MSAA.
  const debugColour = ([r, g, b]) =>
    (b > 100 && g > 90 && b > r + 50 && g > r + 35) ||
    (b > 100 && r > 80 && b > g + 30 && r > g + 15) ||
    (r > 140 && r > g + 45 && r > b + 35)
  for (const width of [1440, 844, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const id of ids)
      for (const facing of [1, -1]) {
        const slots =
          width === 1440 || width === 390 ? normals : ['standingHeavy', 'airHeavy', 'lowHeavy']
        for (const slot of slots)
          for (const phase of ['startup', 'active', 'recovery']) {
            await page.evaluate((options) => window.contactFixture.show(options), {
              id,
              facing,
              slot,
              phase,
            })
            const snapshot = await page.evaluate(() => window.contactFixture.snapshot())
            assert(snapshot.visible)
            assert(snapshot.boxes.length >= 4)
            for (const box of snapshot.boxes) {
              assert(
                box.error < 0.01,
                `Projection drift: ${JSON.stringify({ id, facing, slot, phase, width, error: box.error })}`,
              )
              const inside =
                box.edge.x > 4 &&
                box.edge.x < snapshot.width - 4 &&
                box.edge.y > 4 &&
                box.edge.y < snapshot.height - 4
              if (inside && !box.samples.some(debugColour)) {
                await page.screenshot({ path: path.join(output, 'pixel-failure.png') })
                await writeFile(
                  path.join(output, 'pixel-failure.json'),
                  JSON.stringify(snapshot, null, 2),
                )
              }
              if (inside)
                assert(
                  box.samples.some(debugColour),
                  `Missing collision pixels: ${JSON.stringify({ id, facing, slot, phase, width, kind: box.kind })}`,
                )
            }
            report.push({ id, facing, slot, phase, width, boxes: snapshot.boxes.length })
          }
        await page.evaluate((options) => window.contactFixture.show(options), {
          id,
          facing,
          slot: 'standingHeavy',
          phase: 'active',
          x: 7,
        })
        await page
          .locator('.arena')
          .screenshot({ path: path.join(output, `${id}-${width}-${facing}.png`) })
      }
    process.stdout.write(`${width}px: contact, recovery, aerial and crouching bounds checked\n`)
  }
  await page.evaluate(() => window.contactFixture.show({ id: 'hisoka', facing: 1, versus: true }))
  assert.equal((await page.evaluate(() => window.contactFixture.snapshot())).visible, false)
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ cases: report.length, errors, report }, null, 2),
  )
  process.stdout.write(`${report.length} rendered cases passed; screenshots: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
