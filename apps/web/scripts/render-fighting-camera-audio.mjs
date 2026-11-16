import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const output = process.env.CAMERA_VIDEO_OUTPUT ?? path.join(root, 'output/fighting-camera-showcase')
await mkdir(output, { recursive: true })
const report = JSON.parse(await readFile(path.join(output, 'combat-report.json'), 'utf8'))
const server = await createServer({
  configFile: false,
  root: path.join(root, 'apps/web'),
  cacheDir: path.join(output, 'vite-cache-audio'),
  optimizeDeps: { entries: ['demos/fighting-camera-showcase/audio.html'] },
  resolve: { alias: { $lib: path.join(root, 'apps/web/src/lib') } },
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  logLevel: 'error',
})
await server.listen()
let browser
const audit = []
try {
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  })
  const page = await browser.newPage()
  page.on('pageerror', (error) => process.stderr.write(error.stack + '\n'))
  for (const [index, c] of report.chapters.entries()) {
    const stem = `${String(index + 1).padStart(2, '0')}-${c.id}`
    await page.goto(
      `http://127.0.0.1:${server.httpServer.address().port}/demos/fighting-camera-showcase/audio.html?id=${c.id}`,
    )
    await page.waitForFunction(() => window.cameraFilmAudio)
    const encoded = await page.evaluate(() => window.cameraFilmAudio())
    const bytes = Buffer.from(encoded, 'base64')
    let peak = 0,
      squares = 0
    for (let i = 44; i < bytes.length; i += 2) {
      const value = bytes.readInt16LE(i) / 32768
      peak = Math.max(peak, Math.abs(value))
      squares += value * value
    }
    const rms = Math.sqrt(squares / ((bytes.length - 44) / 2))
    assert.ok(peak > 0.001, `${c.id}: silent audio`)
    assert.ok(peak < 1, `${c.id}: clipped audio`)
    const wav = path.join(output, 'chapters', `${stem}.wav`)
    await writeFile(wav, bytes)
    const video = path.join(output, 'chapters', `${stem}.mp4`)
    const temporary = path.join(output, 'chapters', `${stem}-sound.mp4`)
    const encoder = spawn(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        video,
        '-i',
        wav,
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-b:a',
        '160k',
        '-ar',
        '48000',
        '-af',
        `afade=t=in:d=0.03,afade=t=out:st=${c.duration - 0.08}:d=0.08`,
        '-t',
        String(c.duration),
        '-movflags',
        '+faststart',
        temporary,
      ],
      { stdio: 'inherit' },
    )
    const [code] = await once(encoder, 'exit')
    assert.equal(code, 0)
    await rename(temporary, video)
    audit.push({ id: c.id, peak, rms, frames: c.frames })
    process.stdout.write(
      `${index + 1}/40 ${c.id}: peak ${(20 * Math.log10(peak)).toFixed(1)} dB, RMS ${(20 * Math.log10(rms)).toFixed(1)} dB\n`,
    )
  }
  await writeFile(
    path.join(output, 'audio-verification.json'),
    JSON.stringify({ passed: true, chapters: audit }, null, 2),
  )
} finally {
  await browser?.close()
  await server.close()
}
