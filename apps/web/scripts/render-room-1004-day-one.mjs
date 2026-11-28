import {
  arrival,
  training,
  routeA,
  swampBall,
  casinoMangaShots,
  casinoCanonShots,
  mainDeck,
} from './room-1004-shots.mjs'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const output = path.join(root, 'output/room-1004')
const dayTwo = process.argv.includes('--day-2')
const episodeThree = process.argv.includes('--day-3')
const episodeFive = process.argv.includes('--day-5')
const casinoCanon = process.argv.includes('--day-4-canon')
const casinoManga = process.argv.includes('--day-4-manga')
const episodeFour = casinoCanon || casinoManga || process.argv.includes('--day-4')
const filename = episodeFive
  ? 'room-1004-ep-05-one-more-time'
  : casinoCanon
    ? 'room-1004-ep-04-laplace-tour'
    : casinoManga
      ? 'room-1004-ep-04-tour-scenes'
      : episodeFour
        ? 'room-1004-ep-04-swamp-ball'
        : episodeThree
          ? 'room-1004-ep-03-route-a'
          : `room-1004-day-${dayTwo ? '02' : '01'}`
const destination = path.join(output, `${filename}-tiktok-en.mp4`)
const music = path.join(root, 'Musique/Le dernier jeton.mp3')
const base = process.env.BLACK_WHALE_TOUR_URL ?? 'http://127.0.0.1:3011'
const viewport = { width: 1080, height: 1920 }
const fps = 24
const shots = episodeFive
  ? mainDeck
  : casinoCanon
    ? casinoCanonShots
    : casinoManga
      ? casinoMangaShots
      : episodeFour
        ? swampBall
        : episodeThree
          ? routeA
          : dayTwo
            ? training
            : arrival
const duration = shots.reduce((total, shot) => total + shot.seconds, 0)
const laplaceStyle = casinoCanon
  ? await readFile(
      new URL('../src/lib/components/fighting/laplace-vision.css', import.meta.url),
      'utf8',
    )
  : ''
const pictureFilters = [
  episodeFive ? "eq=gamma=1.48:gamma_weight=0.8:enable='lt(t,9)'" : '',
  casinoCanon ? '' : `fade=t=out:st=${duration - 0.4}:d=0.4`,
].filter(Boolean)

async function stageFrame(page, shot) {
  if (shot.forecast) await page.addStyleTag({ content: laplaceStyle })
  await page.evaluate(({ kicker, line, title, revealAt, vision, forecast }) => {
    const stage = document.querySelector('#tour-stage-container')
    const canvas = stage?.querySelector('canvas')
    const visual = canvas?.parentElement
    if (!stage || !canvas || !visual) throw new Error('Tour canvas unavailable')
    for (const child of visual.children) if (child !== canvas) child.style.display = 'none'
    stage.replaceChildren(visual)
    Object.assign(stage.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      background: '#090a0b',
      zIndex: '99999',
    })
    Object.assign(visual.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
    if (vision)
      canvas.style.filter =
        'grayscale(1) sepia(.65) hue-rotate(301deg) saturate(2.4) contrast(1.23)'
    if (forecast) {
      const overlay = document.createElement('div')
      overlay.className = 'future-vision-screen'
      stage.append(overlay)
    }
    if (line) {
      const card = document.createElement('div')
      card.id = 'room-1004-film-card'
      Object.assign(card.style, {
        position: 'absolute',
        bottom: '23%',
        left: '8%',
        width: '75%',
        textShadow: '0 2px 8px #080807, 0 0 24px #080807',
        color: '#fff5de',
        font: title ? 'bold 106px Georgia' : 'italic 58px Georgia',
        lineHeight: '1.05',
        visibility: revealAt === undefined ? 'visible' : 'hidden',
      })
      if (kicker) {
        const label = document.createElement('div')
        Object.assign(label.style, {
          color: '#ebcf9e',
          font: '700 28px Arial',
          letterSpacing: '.18em',
          marginBottom: '18px',
        })
        label.textContent = kicker
        card.append(label)
      }
      card.append(line)
      stage.append(card)
    }
    canvas.focus({ preventScroll: true })
  }, shot)
}

async function filmShot(browser, shot, send) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  try {
    await page.addInitScript(
      (comfort) => {
        localStorage.setItem('black-whale:tour-comfort', JSON.stringify(comfort))
      },
      episodeFive
        ? { exposure: 1.6, restingAura: false }
        : episodeFour
          ? { exposure: 1.4, restingAura: false }
          : { exposure: 1.4 },
    )
    const url = new URL('/tour', base)
    url.searchParams.set('mangaView', shot.view)
    const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    assert.ok(response?.ok(), `Could not open ${shot.view}`)
    await page.locator('#tour-stage-container canvas').first().waitFor({ timeout: 60_000 })
    await page.waitForTimeout(2_500)
    await stageFrame(page, shot)
    await page.waitForTimeout(900)
    const cdp = await page.context().newCDPSession(page)
    await page.clock.install()
    await page.clock.pauseAt(new Date(Date.now() + 500))
    const [start, end] = (shot.walk ?? [-1, -1]).map((seconds) => Math.round(seconds * fps))
    const retract = Math.round(shot.retractAt * fps)
    const reveal = Math.round(shot.revealAt * fps)
    for (let frame = 0; frame < shot.seconds * fps; frame++) {
      if (frame === start) await page.keyboard.down('KeyW')
      if (frame === end) await page.keyboard.up('KeyW')
      if (frame === retract) {
        const control = page
          .locator('button')
          .filter({ hasText: /Retract gangway|Rétracter la passerelle|Replier la passerelle/i })
        await control.dispatchEvent('click', {}, { timeout: 3000 })
        await page
          .locator('button')
          .filter({ hasText: /Extend gangway|Déployer la passerelle/i })
          .waitFor({ state: 'attached', timeout: 3000 })
      }
      if (frame === reveal) {
        await page.locator('#room-1004-film-card').evaluate((card) => {
          card.style.visibility = 'visible'
        })
      }
      const step = Math.round(((frame + 1) * 1000) / fps) - Math.round((frame * 1000) / fps)
      await page.clock.runFor(step)
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 94,
        fromSurface: true,
      })
      await send(Buffer.from(data, 'base64'))
    }
    process.stdout.write(`Captured ${shot.view}\n`)
  } finally {
    await page.close()
  }
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-gpu-shader-disk-cache',
  ],
})
const audio = dayTwo
  ? [
      '-f',
      'lavfi',
      '-i',
      `aevalsrc=0.17*(sin(2*PI*1450*t)+0.37*sin(2*PI*800*t))*exp(-105*mod(t\\,1)):s=48000:d=${duration}`,
      '-filter_complex',
      `[1:a]volume=0.66,afade=t=in:d=0.35,afade=t=out:st=15:d=3[score];[2:a]volume='if(lt(t,3)+gte(t,18),1,0)':eval=frame[tick];[score][tick]amix=inputs=2:normalize=0,afade=t=out:st=${duration - 0.45}:d=0.45[a]`,
      '-map',
      '[a]',
    ]
  : ['-map', '1:a:0', '-af', `afade=t=in:d=0.25,afade=t=out:st=${duration - 1.25}:d=1.25`]
const encoder = spawn(
  'ffmpeg',
  [
    '-hide_banner',
    '-v',
    'error',
    '-y',
    '-filter_threads',
    '2',
    '-f',
    'image2pipe',
    '-vcodec',
    'mjpeg',
    '-framerate',
    String(fps),
    '-i',
    'pipe:0',
    '-i',
    music,
    ...audio,
    '-map',
    '0:v:0',
    ...(pictureFilters.length ? ['-vf', pictureFilters.join(',')] : []),
    '-c:v',
    'libx264',
    '-threads',
    '3',
    '-crf',
    '18',
    '-preset',
    'veryfast',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '256k',
    '-t',
    String(duration),
    '-movflags',
    '+faststart',
    destination,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
)
encoder.stdin.on('error', () => {})
const done = once(encoder, 'close')
try {
  for (const shot of shots) {
    await filmShot(browser, shot, async (bytes) => {
      assert.equal(encoder.exitCode, null, 'Video encoder exited early')
      if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain')
    })
  }
} finally {
  encoder.stdin.end()
  await browser.close()
}
const [code] = await done
assert.equal(code, 0, 'Video encode failed')
process.stdout.write(`${destination}\n`)
