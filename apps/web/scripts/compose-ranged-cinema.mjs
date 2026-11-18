import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const folder = fileURLToPath(new URL('../../../output/fighting-ranged-cinema/', import.meta.url))
const file = (name) => path.join(folder, name)
const report = JSON.parse(readFileSync(file('combat-report.json'), 'utf8'))
const presentation = JSON.parse(readFileSync(file('presentation-audit.json'), 'utf8'))
const fatalityAudio = fileURLToPath(
  new URL('../static/clash-victories/franklin.m4a', import.meta.url),
)
assert.equal(report.winner, 'opponent')
assert.equal(report.frameCount - report.combatFrames, 600)
assert.equal(report.cinematography.insetCount, 0)
assert.ok(report.comboCancels.length >= 25)
assert.ok(report.comboCancels.every((e) => e.legal && e.confirmedHit))
assert.deepEqual(report.continuity, { resets: 0, backwards: false, healed: false })
assert.ok(
  presentation
    .filter((s) => s.kind === 'native-franklin-fatality')
    .every(
      (s) =>
        s.fighter === 'franklin' && s.target === 'leorio' && s.stage === 'princes-burial-chamber',
    ),
)
function probe(filename) {
  return JSON.parse(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', filename],
      { encoding: 'utf8' },
    ),
  )
}
function ffmpeg(args) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { maxBuffer: 32 * 1024 * 1024 })
}
const picture = file('Leorio-vs-Franklin-Cinema-picture.mp4')
assert.equal(Number(probe(picture).streams[0].nb_frames), report.frameCount)
const audio = file('cinema-audio.m4a')
const filter = [
  `[0:a]atrim=duration=${report.combatSeconds},asetpts=PTS-STARTPTS,afade=t=in:d=0.15,afade=t=out:st=${report.combatSeconds - 0.05}:d=0.05[combat]`,
  '[1:a]atrim=duration=10,asetpts=PTS-STARTPTS[finish]',
  '[combat][finish]concat=n=2:v=0:a=1,loudnorm=I=-17:TP=-1.5:LRA=11,alimiter=limit=0.94:level=0:latency=1[audio]',
].join(';')
ffmpeg([
  '-i',
  file('game-audio.wav'),
  '-i',
  fatalityAudio,
  '-filter_complex',
  filter,
  '-map',
  '[audio]',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ar',
  '48000',
  '-ac',
  '2',
  audio,
])
const destination = file('Leorio-vs-Franklin-Cinema-Fatality.mp4')
ffmpeg([
  '-i',
  picture,
  '-i',
  audio,
  '-map',
  '0:v:0',
  '-map',
  '1:a:0',
  '-c',
  'copy',
  '-t',
  String(report.duration),
  '-shortest',
  '-movflags',
  '+faststart',
  '-metadata',
  'title=Black Whale — Leorio × Franklin / Cinéma et Fatality',
  destination,
])
ffmpeg(['-xerror', '-i', destination, '-f', 'null', '-'])
const metadata = probe(destination)
const video = metadata.streams[0]
assert.equal(video.width, 1920)
assert.equal(video.height, 1080)
assert.equal(video.r_frame_rate, '60/1')
assert.equal(Number(video.nb_frames), report.frameCount)
assert.equal(metadata.streams[1].codec_name, 'aac')
assert.equal(metadata.streams[1].channels, 2)
assert.ok(Math.abs(Number(metadata.format.duration) - report.duration) < 0.025)
const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', destination, '-vn', '-f', 'f32le', '-'], {
  maxBuffer: 32 * 1024 * 1024,
})
let peak = 0,
  squares = 0,
  clipped = 0
for (let i = 0; i < pcm.length; i += 4) {
  const sample = pcm.readFloatLE(i)
  peak = Math.max(peak, Math.abs(sample))
  squares += sample * sample
  if (Math.abs(sample) >= 1) clipped++
}
assert.equal(clipped, 0)
const sha = (name) => createHash('sha256').update(readFileSync(name)).digest('hex')
writeFileSync(
  file('video-verification.json'),
  JSON.stringify(
    {
      artifact: destination,
      sha256: sha(destination),
      metadata,
      fullDecode: 'passed',
      audio: {
        peak,
        rms: Math.sqrt(squares / (pcm.length / 4)),
        clippedSamples: clipped,
        existingFatalitySoundtrack: fatalityAudio,
        fatalitySha256: sha(fatalityAudio),
        fatalityStartsAtSecond: report.combatSeconds,
      },
      nativeFight: {
        seconds: report.combatSeconds,
        winner: report.winner,
        health: report.finalHealth,
        combos: report.confirmedCombos,
        comboCancels: report.comboCancels,
        reversals: report.reversals,
        continuity: report.continuity,
      },
      cinematography: report.cinematography,
      fatality: report.fatality,
      presentation,
    },
    null,
    2,
  ) + '\n',
)
process.stdout.write(
  JSON.stringify(
    {
      destination,
      seconds: report.duration,
      frames: report.frameCount,
      realComboCancels: report.comboCancels.length,
      audioPeak: peak,
      fullDecode: 'passed',
    },
    null,
    2,
  ) + '\n',
)
