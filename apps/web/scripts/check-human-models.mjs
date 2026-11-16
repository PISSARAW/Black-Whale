import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const focus = process.env.HUMAN_MODELS_FOCUS === 'kurapika'
const output = process.env.HUMAN_MODELS_OUTPUT ?? '/tmp/black-whale-human-models'
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  plugins: process.env.HUMAN_MODELS_BASELINE
    ? [
        {
          name: 'original-shared-models',
          load(id) {
            const relative = path.relative(root, id)
            const original = [
              'apps/web/src/lib/tour/humanFigure.ts',
              'apps/web/src/lib/tour/humanHead.ts',
              'apps/web/src/lib/tour/humanHair.ts',
              'apps/web/src/lib/tour/humanLimbs.ts',
              'apps/web/src/lib/fighting/fightFigureEyes.ts',
            ]
            if (original.includes(relative))
              return execFileSync('git', ['show', `HEAD:${relative}`], {
                cwd: root,
                encoding: 'utf8',
              })
          },
        },
      ]
    : [],
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
let browser
const errors = []
try {
  browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: { width: focus ? 1440 : 1400, height: 1140 } })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/${focus ? 'kurapika-model' : 'human-models'}/`,
  )
  await page.waitForFunction(() => window.humanModelsFixture, undefined, { timeout: 120000 })
  assert.equal(await page.evaluate(() => window.humanModelsFixture.count), focus ? 3 : 8)
  for (const view of ['body', 'face', 'profile', 'combat']) {
    await page.evaluate((view) => window.humanModelsFixture.show(view), view)
    await page.screenshot({ path: path.join(output, `${view}.png`) })
  }
  const pixels = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const sample = document.createElement('canvas')
    sample.width = canvas.width
    sample.height = canvas.height
    const ctx = sample.getContext('2d')
    ctx.drawImage(canvas, 0, 0)
    const data = ctx.getImageData(0, 0, sample.width, sample.height).data
    let drawn = 0
    for (let i = 0; i < data.length; i += 4) {
      const difference =
        Math.abs(data[i] - data[0]) +
        Math.abs(data[i + 1] - data[1]) +
        Math.abs(data[i + 2] - data[2])
      if (difference > 20) drawn++
    }
    return drawn
  })
  assert.ok(pixels > 10000, 'the WebGL canvas must contain visible models')
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ passed: true, models: focus ? 3 : 8, pixels, errors }, null, 2),
  )
  process.stdout.write(`Shared and fighting models rendered in four views: ${output}\n`)
} finally {
  await browser?.close()
  await server.close()
}
