import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const folder = path.resolve(root, '../../output/fighting-last-contact')
await mkdir(folder, { recursive: true })
const server = await createServer({
  configFile: false,
  root,
  publicDir: 'static',
  cacheDir: path.join(folder, 'audio-cache'),
  resolve: { alias: { $lib: path.join(root, 'src/lib') } },
  optimizeDeps: {
    entries: ['demos/fighting-showcase/last-contact-audio.html'],
    holdUntilCrawlEnd: false,
  },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({
  executablePath: existsSync(chrome) ? chrome : undefined,
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const url = `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-showcase/last-contact-audio.html`
const report = JSON.parse(await readFile(path.join(folder, 'combat-report.json'), 'utf8'))
const parts = Array.from({ length: Math.ceil(report.frameCount / 1800) }, (_, index) => ({
  index,
  start: index * 1800,
  end: Math.min(report.frameCount, (index + 1) * 1800),
}))
let next = 0
async function worker() {
  while (next < parts.length) {
    const part = parts[next++]
    const context = await browser.newContext()
    const page = await context.newPage()
    page.on('pageerror', (e) => process.stderr.write(e.stack + '\n'))
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForFunction(() => window.clashAudio)
    assert.equal(await page.evaluate(() => window.clashAudio.count), report.frameCount)
    const start = Math.max(0, part.start - 120),
      end = Math.min(report.frameCount, part.end + 120)
    const base64 = await page.evaluate((range) => window.clashAudio.render(range), { start, end })
    await writeFile(
      path.join(folder, `audio-part-${part.index}.wav`),
      Buffer.from(base64, 'base64'),
    )
    await context.close()
    process.stdout.write(`Native audio: ${part.end / 60} / ${report.duration}s\n`)
  }
}
try {
  await Promise.all([worker(), worker()])
  const samples = report.frameCount * 800
  const mix = new Float32Array(samples * 2)
  let header
  const fade = 960
  for (const part of parts) {
    const wav = await readFile(path.join(folder, `audio-part-${part.index}.wav`))
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF')
    header = Buffer.from(wav.subarray(0, 44))
    const offset = Math.max(0, part.start - 120) * 800
    const start = part.start * 800,
      end = part.end * 800
    for (let t = Math.max(0, start - fade); t < Math.min(samples, end + fade); t++) {
      let weight = 1
      if (part.index > 0 && t < start + fade) weight = (t - start + fade) / (fade * 2)
      if (part.index < parts.length - 1 && t > end - fade) weight *= (end + fade - t) / (fade * 2)
      for (let channel = 0; channel < 2; channel++)
        mix[t * 2 + channel] += wav.readInt16LE(44 + (t - offset) * 4 + channel * 2) * weight
    }
  }
  const result = Buffer.alloc(44 + samples * 4)
  header.copy(result)
  result.writeUInt32LE(result.length - 8, 4)
  result.writeUInt32LE(samples * 4, 40)
  for (let i = 0; i < mix.length; i++)
    result.writeInt16LE(Math.round(Math.max(-32767, Math.min(32767, mix[i]))), 44 + i * 2)
  await writeFile(path.join(folder, 'game-audio-chunked.wav'), result)
  await writeFile(
    path.join(folder, 'audio-render.json'),
    JSON.stringify(
      {
        source: 'Production sound director',
        duration: report.duration,
        frames: report.frameCount,
        prerollFrames: 120,
        overlapSeconds: 0.04,
        parts,
      },
      null,
      2,
    ),
  )
  process.stdout.write('Continuous native mix saved\n')
} finally {
  await browser.close()
  await server.close()
}
