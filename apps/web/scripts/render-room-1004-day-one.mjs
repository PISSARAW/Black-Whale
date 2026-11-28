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
const filename = episodeFive ? 'room-1004-ep-05-one-more-time'
  : casinoCanon ? 'room-1004-ep-04-laplace-tour'
  : casinoManga ? 'room-1004-ep-04-tour-scenes'
  : episodeFour ? 'room-1004-ep-04-swamp-ball'
  : episodeThree ? 'room-1004-ep-03-route-a' : `room-1004-day-${dayTwo ? '02' : '01'}`
const destination = path.join(output, `${filename}-tiktok-en.mp4`)
const music = path.join(root, 'Musique/Le dernier jeton.mp3')
const base = process.env.BLACK_WHALE_TOUR_URL ?? 'http://127.0.0.1:3011'
const viewport = { width: 1080, height: 1920 }
const fps = 24
const arrival = [
  { view: 'royal-liner-prince-view', seconds: 3, kicker: 'TSERRIEDNICH · PRIVATE LOG', line: 'Day 01', title: true },
  { view: 'room-1004-log-walk-in', seconds: 3, kicker: 'BLACK WHALE · TIER 1', line: 'Room 1004', title: true },
  { view: 'room-1004-log-walk-in', seconds: 5, walk: [0.55, 3.35] },
  { view: 'tserriednich-salon-seating', seconds: 4, line: 'They gave me a room.' },
  { view: 'tserriednich-clock-panelling', seconds: 5, walk: [0.7, 1.18], line: 'I asked how thick the walls were.' },
  { view: 'room-1004-log-door-closed', seconds: 3 },
]
const training = [
  { view: 'tserriednich-clock-panelling', seconds: 3, kicker: 'TSERRIEDNICH · PRIVATE LOG', line: 'Day 02', title: true },
  { view: 'room-1004-log-training-wide', seconds: 5, walk: [0.5, 1.15], kicker: 'ROOM 1004 · TRAINING LOG', line: 'Theta calls it Zetsu.' },
  { view: 'room-1004-log-theta', seconds: 5, walk: [1.3, 1.54] },
  { view: 'room-1004-log-prince-training', seconds: 5, walk: [0.55, 0.78] },
  { view: 'tserriednich-clock-panelling', seconds: 4, walk: [0.65, 0.97], line: 'I watched the clock.' },
  { view: 'room-1004-log-theta', seconds: 4, line: 'She watched me.' },
]
const routeA = [
  { view: 'room-1004-log-door-closed', seconds: 4, walk: [0.6, 1.2], kicker: 'PRIVATE LOG · EPISODE 03', line: 'Route A', title: true },
  { view: 'room-1004-log-starboard', seconds: 5, walk: [0.2, 3.8], kicker: 'BLACK WHALE · TIER 1', line: 'I left Room 1004.' },
  { view: 'room-1004-log-field-limit', seconds: 5, walk: [0.4, 0.78], kicker: "LAPLACE’S DEVIL · FIELD LIMIT", line: '≈ 36 metres', title: true },
  { view: 'vvip-recreation-double-staircase', seconds: 5, walk: [0.6, 3.2], kicker: 'ROYAL DISTRICT', line: 'I took the VVIP passage.' },
  { view: 'room-1004-log-vvip-portrait', seconds: 4, walk: [0.45, 0.7], line: 'Then came the lockdown.' },
  { view: 'room-1004-log-route-a', seconds: 7, retractAt: 1.2, kicker: 'ROUTE A · TIER 2 ACCESS', line: 'The bridge was gone.', revealAt: 3.4 },
]
const swampBall = [
  { view: 'room-1004-log-casino-passage', seconds: 4, walk: [0.3, 3.7], kicker: 'DAY 04 · TSERRIEDNICH’S PRIVATE LOG', line: 'Swamp Ball', title: true },
  { view: 'casino-420-gaming-floor', seconds: 5, walk: [0.3, 3.5], kicker: 'TIER 1 · VIP CASINO', line: 'The room was almost empty.' },
  { view: 'casino-420-swamp-ball', seconds: 5, walk: [0.65, 1.05], line: 'One machine was still running.' },
  { view: 'room-1004-log-casino-prince', seconds: 4, walk: [0.55, 0.9], line: 'I closed my eyes.' },
  { view: 'room-1004-log-casino-vision', seconds: 3, walk: [0.3, 0.68], vision: true, kicker: 'LAPLACE’S DEVIL', line: 'I saw how I would die.' },
  { view: 'room-1004-log-casino-return', seconds: 4, kicker: 'BACK IN THE PRESENT', line: 'He was still playing.' },
  { view: 'room-1004-log-casino-exit', seconds: 5, walk: [0.25, 2.15], kicker: 'EMERGENCY EXIT', line: 'I made for the stairs.', revealAt: 1.15 },
]
const casinoMangaShots = [
  { view: 'casino-420-gaming-floor', seconds: 4, walk: [0.3, 3.25], kicker: 'DAY 04 · TSERRIEDNICH’S PRIVATE LOG', line: 'Swamp Ball', title: true },
  { view: 'room-1004-log-casino-return', seconds: 3, walk: [0.35, 0.62], kicker: 'TIER 1 · VIP CASINO', line: 'One player stayed behind.' },
  { view: 'room-1004-log-casino-prince', seconds: 3, walk: [0.4, 0.72], line: 'I wanted to see how he’d react.' },
  { view: 'room-1004-log-casino-empty-machine', seconds: 2, line: 'His seat was empty.' },
  { view: 'room-1004-log-casino-overhead-surprise', seconds: 3 },
  { view: 'room-1004-log-casino-hisoka-stare', seconds: 3, walk: [0.45, 0.69] },
  { view: 'room-1004-log-casino-hisoka-departs', seconds: 3, line: 'He walked away.' },
  { view: 'room-1004-log-casino-exit', seconds: 4, walk: [0.2, 2.2], kicker: 'EMERGENCY EXIT', line: 'My Zetsu has to be faster.' },
  { view: 'room-1004-log-exterior-deck', seconds: 4, walk: [0.4, 2.4], kicker: 'TIER 1 · EXTERIOR DECK', line: 'Under a second.' },
]
const casinoCanonShots = [
  { view: 'casino-420-laplace-activation', seconds: 2, kicker: 'ZETSU', line: 'Laplace’s Devil', title: true },
  { view: 'casino-420-laplace-approach', seconds: 2, forecast: true, kicker: 'TEN SECONDS AHEAD', line: 'He called out to me.' },
  { view: 'casino-420-laplace-disappearance', seconds: 2, forecast: true, line: 'Then he was behind me.' },
  { view: 'casino-420-laplace-kneel', seconds: 3, forecast: true },
  { view: 'casino-420-laplace-corpse', seconds: 3, forecast: true, line: 'I saw myself fall.' },
  { view: 'casino-420-laplace-replay', seconds: 2, walk: [0.12, 0.42], kicker: 'THE PRESENT', line: 'He caught my wrist.' },
  { view: 'casino-420-laplace-divergence', seconds: 3, kicker: 'DIVERGENCE', line: 'I slipped out of the future he could see.' },
]
const mainDeck = [
  { view: 'room-1004-log-deck-threshold', seconds: 4, kicker: 'DAY 05 · TSERRIEDNICH’S PRIVATE LOG', line: 'One More Time', title: true },
  { view: 'room-1004-log-deck-patrol', seconds: 5, kicker: 'TIER 1 · MAIN DECK', line: 'The Royal Army was everywhere.' },
  { view: 'room-1004-log-route-a', seconds: 4, retractAt: 0, kicker: 'MARTIAL LAW', line: 'Every bridge was gone.' },
  { view: 'room-1004-log-deck-prince', seconds: 5, line: 'My Nen beast was running out of power.' },
  { view: 'royal-liner-prince-view', seconds: 6, line: 'Back to the princes’ quarters. Or hide aboard and recharge.' },
  { view: 'room-1004-log-deck-decision', seconds: 6, kicker: 'ZETSU', line: 'If I break it now, I can use my ability one more time.', revealAt: 0.75 },
]
const shots = episodeFive ? mainDeck : casinoCanon ? casinoCanonShots : casinoManga ? casinoMangaShots : episodeFour ? swampBall : episodeThree ? routeA : dayTwo ? training : arrival
const duration = shots.reduce((total, shot) => total + shot.seconds, 0)
const laplaceStyle = casinoCanon
  ? await readFile(new URL('../src/lib/components/fighting/laplace-vision.css', import.meta.url), 'utf8')
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
      position: 'fixed', inset: '0', width: '100vw', height: '100vh',
      background: '#090a0b', zIndex: '99999',
    })
    Object.assign(visual.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
    if (vision) canvas.style.filter = 'grayscale(1) sepia(.65) hue-rotate(301deg) saturate(2.4) contrast(1.23)'
    if (forecast) {
      const overlay = document.createElement('div')
      overlay.className = 'future-vision-screen'
      stage.append(overlay)
    }
    if (line) {
      const card = document.createElement('div')
      card.id = 'room-1004-film-card'
      Object.assign(card.style, {
        position: 'absolute', bottom: '23%', left: '8%', width: '75%',
        textShadow: '0 2px 8px #080807, 0 0 24px #080807',
        color: '#fff5de', font: title ? 'bold 106px Georgia' : 'italic 58px Georgia',
        lineHeight: '1.05',
        visibility: revealAt === undefined ? 'visible' : 'hidden',
      })
      if (kicker) {
        const label = document.createElement('div')
        Object.assign(label.style, {
          color: '#ebcf9e', font: '700 28px Arial', letterSpacing: '.18em', marginBottom: '18px',
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
    await page.addInitScript((comfort) => {
      localStorage.setItem('black-whale:tour-comfort', JSON.stringify(comfort))
    }, episodeFive ? { exposure: 1.6, restingAura: false }
      : episodeFour ? { exposure: 1.4, restingAura: false } : { exposure: 1.4 })
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
        const control = page.locator('button').filter({ hasText: /Retract gangway|Rétracter la passerelle|Replier la passerelle/i })
        await control.dispatchEvent('click', {}, { timeout: 3000 })
        await page.locator('button').filter({ hasText: /Extend gangway|Déployer la passerelle/i })
          .waitFor({ state: 'attached', timeout: 3000 })
      }
      if (frame === reveal) {
        await page.locator('#room-1004-film-card').evaluate((card) => { card.style.visibility = 'visible' })
      }
      const step = Math.round((frame + 1) * 1000 / fps) - Math.round(frame * 1000 / fps)
      await page.clock.runFor(step)
      const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg', quality: 94, fromSurface: true,
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
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-shader-disk-cache'],
})
const audio = dayTwo ? [
  '-f', 'lavfi', '-i', `aevalsrc=0.17*(sin(2*PI*1450*t)+0.37*sin(2*PI*800*t))*exp(-105*mod(t\\,1)):s=48000:d=${duration}`,
  '-filter_complex',
  `[1:a]volume=0.66,afade=t=in:d=0.35,afade=t=out:st=15:d=3[score];[2:a]volume='if(lt(t,3)+gte(t,18),1,0)':eval=frame[tick];[score][tick]amix=inputs=2:normalize=0,afade=t=out:st=${duration - 0.45}:d=0.45[a]`,
  '-map', '[a]',
] : ['-map', '1:a:0', '-af', `afade=t=in:d=0.25,afade=t=out:st=${duration - 1.25}:d=1.25`]
const encoder = spawn('ffmpeg', [
  '-hide_banner', '-v', 'error', '-y', '-filter_threads', '2',
  '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(fps), '-i', 'pipe:0',
  '-i', music, ...audio, '-map', '0:v:0',
  ...(pictureFilters.length ? ['-vf', pictureFilters.join(',')] : []),
  '-c:v', 'libx264', '-threads', '3', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '256k', '-t', String(duration), '-movflags', '+faststart', destination,
], { stdio: ['pipe', 'inherit', 'inherit'] })
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
