/**
 * Photographs the walk, so a change to how the ship looks can be looked at.
 *
 * Everything else in this repository can be checked by a test: the geometry, the
 * bake's own arithmetic, where a mote is allowed to hang. What no test can answer
 * is whether a room reads — whether a hall is legible, whether a cone of additive
 * light passes for light or for paper, whether a deck looks like a different deck
 * from the one above it. That is a question about pixels, and this is how to ask
 * it without a pair of eyes on a real screen.
 *
 * It found something the arithmetic could not: the light columns drawn under every
 * lamp of a tall room were correct in every particular and looked like stalactites,
 * and they were taken out because of what these pictures showed.
 *
 * Usage, with `pnpm --filter @black-whale/web dev` already running on :3000:
 *
 *   node scripts/tour-shots.mjs <outDir> [room] [deck]
 *   node scripts/tour-shots.mjs /tmp/shots                       # spawn, then a walk
 *   node scripts/tour-shots.mjs /tmp/shots 'Observation Deck' 'Tier 3'
 *
 * With a room, it jumps there and turns a full circle, one frame per snap.
 *
 * Chromium needs to be told to render WebGL at all when there is no GPU: the flags
 * below put it on ANGLE over SwiftShader, which is slow and correct. Install it
 * with `npx playwright install chromium` — `playwright` itself is a dev dependency
 * of the workspace root.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const [out, room, deck = 'Tier 1'] = process.argv.slice(2)
if (!out) {
  console.error('usage: node scripts/tour-shots.mjs <outDir> [room] [deck]')
  process.exit(1)
}
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const problems = []
page.on('console', (message) => {
  if (message.type() === 'error') problems.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))

/** Just the canvas, so a frame is the walk and not the page around it. */
const VIEWPORT = { x: 16, y: 236, width: 912, height: 560 }

await page.goto('http://localhost:3000/tour', { waitUntil: 'networkidle', timeout: 120_000 })
// The deck is extruded on mount; give it the frames to do it in. SwiftShader is
// software, so this is generous on purpose.
await page.waitForTimeout(6000)

const renderer = await page.evaluate(() => {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
  if (!gl) return 'none'
  const info = gl.getExtension('WEBGL_debug_renderer_info')
  return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown'
})
console.log('renderer:', renderer)
if (renderer === 'none') console.log('no WebGL: every frame below will be empty')

const frame = async (name) => {
  await page.screenshot({ path: `${out}/${name}.png`, clip: VIEWPORT })
  console.log(`${out}/${name}.png`)
}

if (room) {
  await page.getByRole('button', { name: deck, exact: true }).click()
  await page.waitForTimeout(2500)
  const entry = page.getByRole('button', { name: new RegExp(room, 'i') }).first()
  if (!(await entry.count())) throw new Error(`no room in the index matching ${room}`)
  await entry.click()
  await page.waitForTimeout(3500)
  // The walk ignores a key aimed at a control, and the jump left focus on one.
  await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.blur() : null,
  )

  // A full circle at the visitor's own snap angle: eight frames at the default 45°.
  for (let step = 0; step < 8; step++) {
    await frame(`turn-${step}`)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500)
  }
} else {
  await frame('spawn')
  // Pointer lock is refused headless, which is harmless: the keys still walk.
  await page.evaluate(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement.blur() : null,
  )
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(4000)
  await page.keyboard.up('KeyW')
  await page.waitForTimeout(600)
  await frame('walked')
}

// Pointer lock is refused in headless Chromium and says so; it is not a fault.
const real = problems.filter((problem) => !problem.includes('pointer lock'))
if (real.length) {
  console.log('--- page problems ---')
  for (const problem of real.slice(0, 10)) console.log(problem)
}
await browser.close()
