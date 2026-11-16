import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { preview } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = process.env.FIGHT_PERF_OUTPUT ?? '/tmp/black-whale-render-equivalence'
const directories = [process.env.FIGHT_PERF_BEFORE_BUNDLE, process.env.FIGHT_PERF_AFTER_BUNDLE]
assert.ok(directories.every(Boolean), 'Set before/after production bundles')
await mkdir(output, { recursive: true })
const servers = await Promise.all(
  directories.map((outDir) =>
    preview({
      root,
      configFile: false,
      build: { outDir },
      preview: { host: '127.0.0.1', port: 0 },
      logLevel: 'error',
    }),
  ),
)
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--no-proxy-server'],
})
async function settle(page) {
  for (let index = 0; index < 100; index++) {
    await page.clock.runFor(16)
    await setTimeout(20)
    if (
      await page.evaluate(() => {
        const canvas = document.querySelector('.fight-scene canvas')
        return canvas?.width > 2000 && window.fightingPerformance.result().renderer !== 'unknown'
      })
    )
      return
  }
  throw Error('Fight renderer did not initialise')
}
async function capture(side, fighter, frame) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.clock.install({ time: 0 })
  await page.goto(
    `http://127.0.0.1:${servers[side].httpServer.address().port}/ui-tests/fighting-performance/`,
  )
  await page.waitForFunction(() => !!window.fightingPerformance)
  await settle(page)
  await page.clock.runFor(Math.max(0, 3000 - (await page.evaluate(() => performance.now()))))
  await page.evaluate(
    ({ fighter, frame }) =>
      window.fightingPerformance.freeze({ fighter, stage: 'banquet-hall', effects: true }, frame),
    { fighter, frame },
  )
  await settle(page)
  await page.clock.runFor(Math.max(0, 6000 - (await page.evaluate(() => performance.now()))))
  assert.deepEqual(errors, [])
  const state = await page.evaluate(() => window.fightingPerformance.result())
  assert.equal(state.failedScene, false)
  assert.equal(state.failure, '')
  const png = await page.locator('.fight-arena').screenshot({ animations: 'disabled' })
  await writeFile(path.join(output, `${fighter}-${frame}-${side ? 'after' : 'before'}.png`), png)
  await context.close()
  return { png: png.toString('base64'), frame: state.stateFrame, hash: state.tapeHash }
}
const results = []
try {
  const compare = await browser.newPage()
  for (const fighter of process.env.FIGHT_RENDER_FIGHTERS?.split(',') ?? [
    'kurapika',
    'hisoka',
    'chrollo',
    'benjamin',
  ]) {
    for (const frame of process.env.FIGHT_RENDER_FRAMES?.split(',').map(Number) ?? [90, 645]) {
      const before = await capture(0, fighter, frame)
      const after = await capture(1, fighter, frame)
      assert.equal(before.frame, after.frame)
      assert.equal(before.hash, after.hash)
      const diff = await compare.evaluate(
        async ({ before, after }) => {
          async function decode(png) {
            const image = new Image()
            image.src = 'data:image/png;base64,' + png
            await image.decode()
            const canvas = document.createElement('canvas')
            canvas.width = image.width
            canvas.height = image.height
            const context = canvas.getContext('2d')
            context.drawImage(image, 0, 0)
            return {
              width: image.width,
              height: image.height,
              data: context.getImageData(0, 0, image.width, image.height).data,
            }
          }
          const a = await decode(before),
            b = await decode(after)
          if (a.width !== b.width || a.height !== b.height)
            throw Error('Different image dimensions')
          let sum = 0,
            changed = 0,
            large = 0,
            max = 0
          for (let i = 0; i < a.data.length; i += 4) {
            let delta = 0
            for (let channel = 0; channel < 3; channel++) {
              const d = Math.abs(a.data[i + channel] - b.data[i + channel])
              delta = Math.max(delta, d)
              sum += d
            }
            if (delta > 1) changed++
            if (delta > 8) large++
            max = Math.max(max, delta)
          }
          const pixels = a.width * a.height
          return {
            width: a.width,
            height: a.height,
            meanDelta: sum / (pixels * 3),
            over1: changed / pixels,
            over8: large / pixels,
            max,
          }
        },
        { before: before.png, after: after.png },
      )
      const row = { fighter, frame, ...diff, pass: diff.meanDelta <= 0.25 && diff.over8 <= 0.001 }
      results.push(row)
      await writeFile(path.join(output, 'report.json'), JSON.stringify(results, null, 2))
      process.stdout.write(
        `${fighter} frame ${frame}: ${JSON.stringify(diff)} ${row.pass ? 'PASS' : 'FAIL'}\n`,
      )
    }
  }
  assert.ok(
    results.every((row) => row.pass),
    'Render equivalence failed; inspect saved images',
  )
} finally {
  await browser.close()
  await Promise.all(
    servers.map((server) => new Promise((resolve) => server.httpServer.close(resolve))),
  )
}
