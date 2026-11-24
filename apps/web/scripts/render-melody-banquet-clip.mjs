import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const vertical = process.env.MELODY_CLIP_VERTICAL === '1'
const cover = process.env.MELODY_CLIP_COVER === '1'
const folder = cover
  ? 'melody-clash-covers'
  : vertical
    ? 'melody-clash-tiktok'
    : 'melody-clash-reactions'
const output = process.env.MELODY_CLIP_OUTPUT ?? path.join(root, 'output', folder)
const baseUrl = process.env.MELODY_CLIP_URL ?? 'http://127.0.0.1:3000'
const preview = cover || process.env.MELODY_CLIP_PREVIEW === '1'
const video = path.join(
  output,
  vertical ? 'melody-clash-tiktok-9x16.mp4' : 'melody-clash-reactions-1080p.mp4',
)
const soundtrack = path.join(root, 'apps/web/static/audio/melody-concert.mp3')
const width = vertical ? 1080 : cover ? 1280 : 1920
const height = vertical ? 1920 : cover ? 720 : 1080
const fps = 24
const intro = [
  ['hall-wide', 3],
  ['hall-stage', 3],
]
const concert = [
  ['manga', 10],
  ['meadow', 9],
  ['flute', 8],
  ['cast:kurapika', 5],
  ['cast:theta', 5],
  ['profile', 10],
  ['vista', 11],
  ['cast:hisoka', 5],
  ['cast:machi-komacine', 5],
  ['flute', 9],
  ['cast:leorio-paradinight', 5],
  ['cast:biscuit-krueger', 5],
  ['meadow', 12],
  ['profile', 10],
  ['cast:prince-tserriednich', 5],
  ['cast:chrollo-lucilfer', 5],
  ['cast:feitan-portor', 5],
  ['vista', 10],
  ['flute', 10],
  ['cast:bill', 5],
  ['cast:gel', 5],
  ['cast:kalluto-zoldyck', 5],
  ['meadow', 9],
  ['manga', 12],
]
const outro = [
  ['hall-stage', 3],
  ['hall-wide', 3],
]
const concertSeconds = concert.reduce((seconds, [, duration]) => seconds + duration, 0)
assert.equal(concertSeconds, 180)
const duration = 6 + concertSeconds + 6

await mkdir(path.join(output, 'stills'), { recursive: true })
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
const problems = new Set()
page.on('pageerror', (error) => problems.add(error.message))
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('pointer lock'))
    problems.add(message.text())
})

let encoder
let encoded
let frames = 0
let encoderError = ''
try {
  const url = new URL('/tour', baseUrl)
  url.search =
    'clip=clash&clipFraming=film&mangaView=banquet-melody-concert&space=tier-1-banquet-hall'
  await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  const canvas = page.locator('#tour-stage-container canvas').first()
  await canvas.waitFor({ timeout: 120_000 })
  await page.locator('button.play-melody').waitFor({ state: 'attached', timeout: 120_000 })
  await page.waitForTimeout(5_000)
  await page.clock.install()
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  await page.evaluate(() => {
    const play = document.querySelector('button.play-melody')
    if (!(play instanceof HTMLButtonElement) || play.disabled)
      throw new Error('Melody concert control unavailable')
    play.click()
  })
  await page.clock.runFor(100)
  await page.evaluate(() => {
    const canvas = document.querySelector('#tour-stage-container canvas')
    const visual = canvas?.parentElement
    const stage = document.querySelector('#tour-stage-container')
    if (!(canvas instanceof HTMLCanvasElement) || !visual || !(stage instanceof HTMLElement))
      throw new Error('Tour stage missing')
    for (const child of visual.children) {
      if (child instanceof HTMLElement && child !== canvas) child.style.display = 'none'
    }
    stage.replaceChildren(visual)
    Object.assign(stage.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '99999',
      background: '#050505',
    })
    Object.assign(visual.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
  })
  const captureSession = await page.context().newCDPSession(page)
  if (!preview) {
    encoder = spawn(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-f',
        'image2pipe',
        '-vcodec',
        'mjpeg',
        '-framerate',
        String(fps),
        '-i',
        'pipe:0',
        '-i',
        soundtrack,
        '-filter_complex',
        '[1:a]adelay=6000:all=1,apad=pad_dur=6[music]',
        '-map',
        '0:v:0',
        '-map',
        '[music]',
        '-t',
        String(duration),
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '256k',
        '-movflags',
        '+faststart',
        video,
      ],
      { stdio: ['pipe', 'inherit', 'pipe'] },
    )
    encoder.stderr.on('data', (bytes) => (encoderError += bytes.toString()))
    encoder.stdin.on('error', () => {})
    encoded = once(encoder, 'close')
  }

  async function shoot(shots, chapter) {
    for (const [index, [name, seconds]] of shots.entries()) {
      await canvas.evaluate((element, shot) => (element.dataset.concertShot = shot), name)
      await captureShot({ name, seconds, index, chapter })
    }
  }

  async function captureShot({ name, seconds, index, chapter }) {
    const count = preview ? 1 : seconds * fps
    for (let frame = 0; frame < count; frame++) {
      const step = Math.round(((frame + 1) * 1000) / fps) - Math.round((frame * 1000) / fps)
      await page.clock.runFor(preview ? 100 : step)
      const result = await captureSession.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 96,
        fromSurface: true,
      })
      const bytes = Buffer.from(result.data, 'base64')
      if (encoder) {
        if (encoder.exitCode !== null) throw new Error(encoderError || 'Encoder stopped')
        if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain')
      }
      if (frame === 0) {
        const file = `${chapter}-${String(index + 1).padStart(2, '0')}-${name.replace('cast:', '')}.jpg`
        await writeFile(path.join(output, 'stills', file), bytes)
      }
      frames++
    }
    process.stdout.write(`${chapter} ${index + 1} ${name} (${frames} frames)\n`)
  }

  if (cover) {
    await canvas.evaluate((element) => (element.dataset.concertShot = 'cover'))
    await page.clock.runFor(8_000)
    await placeCoverTitle(page)
    await page.screenshot({
      path: path.join(output, vertical ? 'melody-clash-tiktok.jpg' : 'melody-clash-youtube.jpg'),
      type: 'jpeg',
      quality: 96,
    })
  } else {
    await shoot(intro, 'intro')
    await page.clock.runFor(preview ? 7_600 : 1_700)
    await shoot(concert, 'concert')
    await page.keyboard.press('KeyJ')
    await page.clock.runFor(900)
    await shoot(outro, 'outro')
  }
} finally {
  encoder?.stdin.end()
  await browser.close()
}

if (encoded) {
  const [code] = await encoded
  assert.equal(code, 0, encoderError)
  assert.equal(frames, duration * fps)
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        video,
        duration,
        fps,
        width,
        height,
        frames,
        intro,
        concert,
        outro,
        problems: [...problems],
      },
      null,
      2,
    ),
  )
}
assert.equal(problems.size, 0, [...problems].join('\n'))

async function placeCoverTitle(page) {
  await page.evaluate((vertical) => {
    const stage = document.querySelector('#tour-stage-container')
    const title = document.createElement('div')
    title.innerHTML =
      '<span>HUNTER × HUNTER · CH. 383</span><em>Le concert de</em><strong>MELODY</strong>'
    Object.assign(title.style, {
      position: 'absolute',
      top: vertical ? '10.5%' : '5.5%',
      right: vertical ? '0' : '5%',
      width: vertical ? '100%' : 'auto',
      textAlign: vertical ? 'center' : 'right',
      color: '#fff6d9',
      textShadow: '0 3px 8px #151b19, 0 0 24px #151b19a0',
      lineHeight: '1',
    })
    const [series, concert, name] = title.children
    Object.assign(series.style, {
      display: 'block',
      marginBottom: vertical ? '22px' : '12px',
      letterSpacing: '.18em',
      font: vertical ? '700 24px Arial' : '700 17px Arial',
    })
    series.style.letterSpacing = '.18em'
    Object.assign(concert.style, {
      display: 'block',
      font: vertical ? 'italic 55px Georgia' : 'italic 41px Georgia',
    })
    Object.assign(name.style, {
      display: 'block',
      font: vertical ? 'bold 136px Georgia' : 'bold 99px Georgia',
      letterSpacing: '-.07em',
    })
    stage.append(title)
  }, vertical)
}
