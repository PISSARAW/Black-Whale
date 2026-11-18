import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.resolve(process.env.PURSUIT_REVIEW_OUTPUT ?? 'output/fighting-pursuit-review')
const movie = process.argv.includes('--video')
const temporary = await mkdtemp(path.join(tmpdir(), 'clash-pursuit-'))
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(temporary, 'vite'),
  plugins: [svelte({ configFile: false })],
  optimizeDeps: {
    entries: ['ui-tests/fighting-pursuit-review/index.html'],
    holdUntilCrawlEnd: false,
  },
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  server: { host: '127.0.0.1', port: 0, watch: null, hmr: false },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})

let browser
const errors = []
try {
  await server.listen()
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  const base = `http://127.0.0.1:${server.httpServer.address().port}/ui-tests/fighting-pursuit-review/`
  const review = await load('comparison')
  const [centre, corner] = review.summary
  assert.equal(centre.opening - centre.launch, 37)
  assert.equal(centre.contact - centre.launch, 41)
  assert.equal(corner.contact - corner.launch, 41)
  assert.equal(corner.command, centre.command)
  assert.equal(corner.opening, -1)
  assert.equal(corner.finisher, 'hisoka:finisher')
  assert.equal(centre.winner, 'opponent')
  assert.equal(corner.winner, 'player')
  const ready = centre.opening - centre.command
  const hit = centre.contact - centre.command
  await verifyCue(review.page, ready - 1, null)
  await verifyCue(review.page, ready, 'ready')
  await review.page.screenshot({ path: path.join(output, 'hisoka-f37.png') })
  await verifyCue(review.page, hit, 'reply')
  await review.page.screenshot({ path: path.join(output, 'hisoka-f41.png') })
  const hanzo = await load('hanzo')
  const [double] = hanzo.summary
  assert.equal(double.winner, 'player')
  assert.equal(double.hits, 4)
  assert.equal(double.finisher, 'hanzo:finisher')
  assert.equal(double.sleepingBody, 76)
  await seek(hanzo.page, double.contact - double.command)
  await hanzo.page.screenshot({ path: path.join(output, 'hanzo-impact.png') })
  const kurapika = await load('kurapika')
  const [whip] = kurapika.summary
  assert.equal(whip.winner, 'player')
  assert.equal(whip.hits, 4)
  assert.equal(whip.finisher, 'kurapika:forwardSpecial')
  if (movie)
    await capture([
      { ...kurapika, through: whip.contact - whip.command + 10 },
      { ...hanzo, through: double.contact - double.command + 10 },
      { ...review, through: hit + 10, holds: [ready, hit] },
    ])
  assert.deepEqual(errors, [])
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify({ centre, corner, double, whip }, null, 2),
  )
  process.stdout.write(`Poursuites vérifiées dans Chromium. ${output}\n`)

  async function load(id) {
    const page = await browser.newPage({ viewport: { width: 540, height: 960 } })
    page.on('pageerror', (error) => {
      errors.push(error.message)
      process.stderr.write(error.message + '\n')
    })
    await page.goto(id === 'comparison' ? base : `${base}?${id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    })
    await page.waitForFunction(
      () => window.pursuitReview?.ready() || window.pursuitReview?.failed(),
      {},
      { timeout: 120000 },
    )
    assert.equal(await page.evaluate(() => window.pursuitReview.failed()), false)
    return { page, summary: await page.evaluate(() => window.pursuitReview.summary) }
  }
} finally {
  await browser?.close()
  await server.close()
  await rm(temporary, { recursive: true, force: true })
}

async function seek(page, frame, pause = false) {
  await page.evaluate(({ frame, pause }) => window.pursuitReview.frame(frame, pause), {
    frame,
    pause,
  })
}

async function verifyCue(page, frame, kind) {
  await seek(page, frame)
  const centre = page.getByRole('region', { name: 'Centre', exact: true })
  const corner = page.getByRole('region', { name: 'Coin droit', exact: true })
  assert.equal(await corner.locator('[data-recovery-cue]').count(), 0)
  const cue = centre.locator('[data-recovery-cue]')
  assert.equal(await cue.count(), Number(kind !== null))
  if (kind) {
    assert.equal(await cue.getAttribute('data-recovery-cue'), kind)
    assert.equal(
      await cue.textContent().then((text) => text.trim()),
      kind === 'ready' ? 'Peut agir' : 'Riposte',
    )
    assert.ok((await cue.boundingBox())?.width > 0)
  }
}

async function capture(tracks) {
  let number = 0
  const file = () => path.join(temporary, `shot-${String(number++).padStart(4, '0')}.png`)
  for (const { page, through, holds = [] } of tracks) {
    await seek(page, -12)
    for (let step = -10; step <= through; step += 2) {
      const at = holds.includes(step - 1) ? step - 1 : step
      const hold = holds.includes(at)
      await seek(page, at, hold)
      const image = file()
      await page.screenshot({ path: image })
      for (let i = 0; i < (hold ? 21 : 0); i++) await copyFile(image, file())
    }
  }
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-framerate',
      '30',
      '-i',
      path.join(temporary, 'shot-%04d.png'),
      '-vf',
      'scale=1080:1920:flags=lanczos',
      '-c:v',
      'libx264',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      path.join(output, 'Black-Whale-Clash-Poursuites-Comparatif.mp4'),
    ],
    { stdio: 'inherit' },
  )
}
