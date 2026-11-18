import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { link, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { writePursuitAudio } from './pursuit-montage-audio.mjs'

const VIDEO = 'Black-Whale-Clash-TikTok-40-Raccords.mp4'
const FPS = 30
const BEAT_FRAMES = 12

export async function renderPursuitTikTok({ page, review, output, temporary }) {
  const reel = createReel(temporary)
  const ids = await page.evaluate(() => window.pursuitMontage.ids)
  assert.equal(new Set(ids).size, 40)
  const clips = []
  for (const id of ids) {
    const track = await select(page, id)
    assert.ok(track.winner === 'player' && track.hits >= 4 && track.opening < 0, id)
    clips.push(await recordFighter({ page, track, reel }))
    process.stdout.write(`${id} · ${track.hits} touches · ${track.technique}\n`)
  }
  const corner = await select(page, 'recovery')
  assert.ok(corner.winner === 'opponent' && corner.opening < corner.contact)
  clips.push(await recordFighter({ page, track: corner, reel }))
  clips.push(await recordComparison(review, reel))
  await encode({ reel, output, temporary })
  await writeFile(
    path.join(output, 'montage-report.json'),
    JSON.stringify(
      {
        fps: FPS,
        duration: reel.frame / FPS,
        bpm: 150,
        roster: ids.length,
        clips,
      },
      null,
      2,
    ),
  )
}

async function select(page, id) {
  const track = await page.evaluate((fighter) => window.pursuitMontage.select(fighter), id)
  await page.waitForFunction(
    () => window.pursuitMontage.loaded() || window.pursuitMontage.failed(),
    null,
    { timeout: 60000 },
  )
  assert.equal(await page.evaluate(() => window.pursuitMontage.failed()), false, id)
  return track
}

async function recordFighter({ page, track, reel }) {
  const { start, contact, length, opening, impacts } = track
  const firstFrame = reel.frame
  const last = Math.min(length - 1, contact + 10)
  const frames = sampleFrames(start, last, [
    track.launch,
    ...impacts.map(({ index }) => index),
    opening,
  ])
  const cues = []
  for (const frame of frames) {
    await page.evaluate((value) => window.pursuitMontage.frame(value), frame)
    if (frame === opening || frame === contact)
      await verifyFighterFrame(page, { track, frame, cues })
    if (impacts.some(({ index }) => index === frame)) reel.accent(frame === contact)
    await reel.capture(page, frame === opening ? 15 : 1)
  }
  const beatEnd =
    firstFrame + Math.max(4, Math.ceil((reel.frame - firstFrame + 4) / BEAT_FRAMES)) * BEAT_FRAMES
  await reel.hold(beatEnd - reel.frame)
  return { ...track, outputStart: firstFrame, outputFrames: reel.frame - firstFrame, cues }
}

function sampleFrames(start, last, events) {
  const important = new Set(events.filter((frame) => frame >= start && frame <= last))
  for (let frame = start; frame <= last; frame += 2) {
    if (!important.has(frame + 1)) important.add(frame)
  }
  return [...important].sort((a, b) => a - b)
}

async function verifyFighterFrame(page, { track, frame, cues }) {
  if (track.winner === 'player') {
    assert.equal(await page.locator('[data-hits]').getAttribute('data-hits'), String(track.hits))
    return
  }
  const kind = frame === track.opening ? 'ready' : 'reply'
  assert.equal(await page.locator(`[data-recovery-cue="${kind}"]`).count(), 1)
  cues.push({ kind, simulationFrame: frame - track.launch })
}

async function recordComparison({ page, summary }, reel) {
  const [centre, corner] = summary
  const ready = centre.opening - centre.command
  const hit = centre.contact - centre.command
  const firstFrame = reel.frame
  const frames = sampleFrames(-10, hit + 9, [0, ready, hit])
  // Rewind through an earlier frame so the overlay and pose history start together.
  await comparisonFrame(page, -12, false)
  for (const frame of frames) {
    const stop = frame === ready || frame === hit
    await comparisonFrame(page, frame, stop)
    if (frame === hit) reel.accent(true)
    await reel.capture(page, stop ? 22 : 1)
  }
  return {
    test: 'hisoka-centre-coin',
    centre,
    corner,
    outputStart: firstFrame,
    outputFrames: reel.frame - firstFrame,
  }
}

async function comparisonFrame(page, frame, stop) {
  await page.evaluate(({ frame, stop }) => window.pursuitReview.frame(frame, stop), { frame, stop })
}

function createReel(directory) {
  let frame = 0
  let previous
  const impacts = []
  const next = () => path.join(directory, `tiktok-${String(frame++).padStart(5, '0')}.jpg`)
  async function hold(count) {
    for (let repeat = 0; repeat < count; repeat++) await link(previous, next())
  }
  return {
    get frame() {
      return frame
    },
    impacts,
    hold,
    async capture(page, duration) {
      previous = next()
      await page.screenshot({ path: previous, type: 'jpeg', quality: 92 })
      await hold(duration - 1)
    },
    accent(heavy) {
      impacts.push({ frame, heavy })
    },
  }
}

async function encode({ reel, output, temporary }) {
  const audio = path.join(temporary, 'pursuit.wav')
  const video = path.join(temporary, VIDEO)
  await writePursuitAudio(audio, reel.frame / FPS, reel.impacts)
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-framerate',
      String(FPS),
      '-i',
      path.join(temporary, 'tiktok-%05d.jpg'),
      '-i',
      audio,
      '-vf',
      'scale=1080:1920:flags=lanczos',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '19',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-movflags',
      '+faststart',
      '-shortest',
      video,
    ],
    { stdio: 'inherit' },
  )
  await rename(video, path.join(output, VIDEO))
}
