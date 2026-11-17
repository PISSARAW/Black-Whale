import assert from 'node:assert/strict'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { preview } from 'vite'
import { chromium } from 'playwright'

const root = path.resolve('apps/web')
const output = path.resolve(process.env.HATSU_VISUAL_OUTPUT ?? 'output/clash-hatsu-visuals')
const bundles = [process.env.HATSU_VISUAL_BEFORE, process.env.HATSU_VISUAL_AFTER]
assert.ok(
  bundles.every(Boolean),
  'Set HATSU_VISUAL_BEFORE and HATSU_VISUAL_AFTER to production bundles',
)
const cases = [
  {
    id: 'projectiles',
    fighter: 'franklin',
    stage: 'banquet-hall',
    scenario: 'projectiles',
    tick: 180,
  },
  {
    id: 'future-vision',
    fighter: 'tserriednich',
    stage: 'banquet-hall',
    scenario: 'future',
    tick: 100,
  },
  {
    id: 'future-divergence',
    fighter: 'tserriednich',
    stage: 'banquet-hall',
    scenario: 'future',
    tick: 360,
  },
  {
    id: 'post-mortem',
    fighter: 'camilla',
    stage: 'whale-hold',
    scenario: 'post-mortem',
    tick: 150,
  },
  { id: 'guards', fighter: 'yokotani', stage: 'heilly-hideout', scenario: 'guards', tick: 60 },
  {
    id: 'transformation',
    fighter: 'biscuit',
    stage: 'whale-hold',
    scenario: 'transformation',
    tick: 100,
  },
]
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--no-proxy-server'],
})
const results = new Map()
try {
  for (const [index, bundle] of bundles.entries()) {
    const label = index ? 'after' : 'before'
    const server = await preview({
      configFile: false,
      root,
      build: { outDir: path.resolve(bundle) },
      preview: { host: '127.0.0.1', port: 0 },
    })
    try {
      for (const entry of cases) {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 900 },
          deviceScaleFactor: 2,
        })
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.goto(
          `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-performance/`,
        )
        await page.waitForFunction(() => !!window.fightingPerformance)
        await page.evaluate(
          (entry) =>
            window.fightingPerformance.freeze(
              { ...entry, effects: true, graphics: 'quality' },
              entry.tick,
            ),
          entry,
        )
        await page.locator('.fight-scene.ready').first().waitFor({ timeout: 120000 })
        await page.waitForTimeout(1500)
        const result = await page.evaluate(() => window.fightingPerformance.result())
        assert.equal(result.failure, '')
        assert.equal(result.failedScene, false)
        assert.deepEqual(errors, [])
        assert.equal(result.expressions.length, 2)
        // The primary pose is frozen before the camera's intro. Prediction
        // context reuse is checked separately during the live cadence campaign.
        const views = 1
        await page
          .locator('.fight-scene > canvas')
          .first()
          .screenshot({ path: path.join(output, `${entry.id}-${label}.png`) })
        results.set(`${entry.id}-${label}`, {
          tapeHash: result.tapeHash,
          stateFrame: result.stateFrame,
          expressions: result.expressions,
          views,
        })
        await context.close()
      }
    } finally {
      await new Promise((resolve) => server.httpServer.close(resolve))
    }
  }
} finally {
  await browser.close()
}
const comparisons = []
for (const entry of cases) {
  const before = results.get(`${entry.id}-before`),
    after = results.get(`${entry.id}-after`)
  assert.deepEqual(after, before, `Expression or replay changed: ${entry.id}`)
  const pixels = Array.from({ length: after.views }, (_, view) => {
    const suffix = view ? '-prediction' : ''
    return JSON.parse(
      execFileSync(
        'python3',
        [
          '-c',
          `
import json,sys
from PIL import Image,ImageChops,ImageStat
a,b=[Image.open(p).convert('RGB') for p in sys.argv[1:]]
assert a.size==b.size
d=ImageChops.difference(a,b)
changed=sum(max(pixel)>3 for pixel in d.getdata())
print(json.dumps({'width':a.width,'height':a.height,'changedOver3':changed,'changedRatio':changed/(a.width*a.height),'meanDifference':sum(ImageStat.Stat(d).mean)/3}))
`,
          path.join(output, `${entry.id}${suffix}-before.png`),
          path.join(output, `${entry.id}${suffix}-after.png`),
        ],
        { encoding: 'utf8' },
      ),
    )
  })
  comparisons.push({
    id: entry.id,
    tick: entry.tick,
    ...after,
    pixels,
    pass: pixels.every((image) => image.changedRatio <= 0.002),
  })
}
const report = {
  date: new Date().toISOString(),
  pass: comparisons.every((entry) => entry.pass),
  comparisons,
}
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
assert.equal(report.pass, true, 'Frozen render comparison failed; inspect report.json and PNGs')
process.stdout.write('Six frozen render pairs preserve expressions and visible surfaces.\n')
