import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { chromium } from 'playwright'
const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.NEN_EXCHANGES_OUTPUT ?? path.join(root, 'output/nen-exchanges')
const inspect = process.argv.includes('--inspect')
await mkdir(output, { recursive: true })
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache'),
  publicDir: path.join(root, 'apps/web/static'),
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  optimizeDeps: {
    entries: ['demos/fighting-nen-exchanges/index.html', 'demos/fighting-nen-exchanges/audio.html'],
  },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  css: { postcss: { plugins: [] } },
  logLevel: 'error',
})
await server.listen()
const base = `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-nen-exchanges/`
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
})
const errors = [],
  reports = []
async function encode(args) {
  const process = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  })
  const [code] = await once(process, 'exit')
  assert.equal(code, 0)
}
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  })
  page.setDefaultTimeout(180000)
  page.setDefaultNavigationTimeout(180000)
  page.on('pageerror', (error) => {
    errors.push(error.stack)
    process.stderr.write(error.stack + '\n')
  })
  await page.goto(base)
  await page.waitForFunction(() => window.nenFilm)
  const indices = process.env.NEN_CHAPTER ? [Number(process.env.NEN_CHAPTER)] : [0, 1, 2]
  for (const index of indices) {
    if (index) await page.evaluate((i) => window.nenFilm.select(i), index)
    await page.locator('.fight-scene.ready').waitFor()
    const report = await page.evaluate(() => window.nenFilm.report())
    await writeFile(
      path.join(output, `bout-${index + 1}.replay.json`),
      JSON.stringify(report.replay),
    )
    delete report.replay
    reports.push(report)
    assert.equal(report.verified, true)
    if (index === 1) assert.ok(report.ko > 0, 'The real bout must contain a paid Ko')
    for (const side of ['player', 'opponent'])
      assert.ok(
        report.impacts.some((hit) => hit.attacker === side && hit.damage > 0 && !hit.blocked),
        `No actual wound by ${side}`,
      )
    process.stdout.write(
      JSON.stringify({
        bout: index + 1,
        frames: report.frames,
        moves: report.moves,
        hits: report.impacts.length,
        combo: report.maxCombo,
        transfers: report.transfers,
        ko: report.ko,
      }) + '\n',
    )
    await page.evaluate(() => window.nenFilm.seek(150))
    await page.screenshot({ path: path.join(output, `bout-${index + 1}.png`) })
    if (inspect) continue
    const encoder = spawn(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-f',
        'image2pipe',
        '-framerate',
        '30',
        '-vcodec',
        'mjpeg',
        '-i',
        '-',
        '-an',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '19',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        path.join(output, `bout-${index + 1}-silent.mp4`),
      ],
      { stdio: ['pipe', 'ignore', 'inherit'] },
    )
    for (let frame = 0; frame < report.frames; frame++) {
      await page.evaluate((n) => window.nenFilm.seek(n), frame)
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      )
      const buffer = await page.screenshot({ type: 'jpeg', quality: 88 })
      if (!encoder.stdin.write(buffer)) await once(encoder.stdin, 'drain')
      if (frame % 150 === 0)
        process.stdout.write(`Capture ${index + 1}/3 ${frame}/${report.frames}\n`)
    }
    encoder.stdin.end()
    const [code] = await once(encoder, 'exit')
    assert.equal(code, 0)
    const audio = await browser.newPage()
    audio.setDefaultTimeout(180000)
    await audio.goto(`${base}audio.html?chapter=${index}`)
    await audio.waitForFunction(() => window.nenFilmAudio)
    const wav = await audio.evaluate(() => window.nenFilmAudio())
    await writeFile(path.join(output, `bout-${index + 1}.wav`), Buffer.from(wav, 'base64'))
    await audio.close()
    await encode([
      '-i',
      path.join(output, `bout-${index + 1}-silent.mp4`),
      '-i',
      path.join(output, `bout-${index + 1}.wav`),
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-shortest',
      '-movflags',
      '+faststart',
      path.join(output, `bout-${index + 1}.mp4`),
    ])
  }
  await writeFile(
    path.join(output, 'combat-report.json'),
    JSON.stringify({ fps: 30, speed: 1, simulatedHz: 60, errors, bouts: reports }, null, 2),
  )
  assert.deepEqual(errors, [])
  if (!inspect) {
    const list = path.join(output, 'concat.txt')
    await writeFile(
      list,
      [1, 2, 3].map((n) => `file '${path.join(output, `bout-${n}.mp4`)}'`).join('\n'),
    )
    await encode([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      list,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      path.join(output, 'nen-combats-1x.mp4'),
    ])
  }
} finally {
  await browser.close()
  await server.close()
}
