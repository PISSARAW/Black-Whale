import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { validateRangedDuel } from './showcase-ranged-validation.mjs'

const directory = fileURLToPath(
  new URL('../../../output/fighting-ranged-dynamic/', import.meta.url),
)
const file = (name) => path.join(directory, name)
const report = JSON.parse(readFileSync(file('combat-report.json'), 'utf8'))
const presentation = JSON.parse(readFileSync(file('presentation-audit.json'), 'utf8'))
validateRangedDuel(report)
assert.ok(report.rangedDynamic && presentation.minimumFrontalAlignment > 0.99)
assert.ok(presentation.faces.player > 0 && presentation.faces.opponent > 0)

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
const picture = file('Leorio-vs-Franklin-Chambre-Funeraire-picture.mp4')
const pictureMeta = probe(picture)
assert.equal(Number(pictureMeta.streams[0].nb_frames), Math.round(report.duration * report.fps))
assert.equal(pictureMeta.streams[0].r_frame_rate, '60/1')
const audio = file('game-audio.m4a')
ffmpeg([
  '-i',
  file('game-audio.wav'),
  '-af',
  `afade=t=in:d=0.3,afade=t=out:st=${report.duration - 1.5}:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11`,
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ar',
  '48000',
  audio,
])
const destination = file('Leorio-vs-Franklin-Duel-Dynamique.mp4')
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
  'title=Black Whale — Leorio × Franklin / Duel dynamique et visages',
  destination,
])
ffmpeg(['-xerror', '-i', destination, '-f', 'null', '-'])
const metadata = probe(destination)
assert.equal(metadata.streams[0].width, 1920)
assert.equal(metadata.streams[0].height, 1080)
assert.equal(Number(metadata.streams[0].nb_frames), Math.round(report.duration * 60))
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
const verification = {
  artifact: destination,
  sha256: createHash('sha256').update(readFileSync(destination)).digest('hex'),
  metadata,
  fullDecode: 'passed',
  audio: { peak, rms: Math.sqrt(squares / (pcm.length / 4)), clippedSamples: clipped },
  story: {
    duration: report.duration,
    confirmedCombos: report.confirmedCombos,
    reversals: report.reversals,
    remoteHits: report.remoteHits,
    bullets: report.projectilesEmitted,
    winner: report.winner,
    continuity: report.continuity,
    maximumIdleSeconds: report.maxIdleSeconds,
  },
  closeups: report.closeups,
  presentation,
  camera: report.camera,
  checks: {
    nativeChoreography: 'passed',
    frontalPortraits: 'passed',
    decodedFrames: 'passed',
  },
}
writeFileSync(file('video-verification.json'), JSON.stringify(verification, null, 2) + '\n')
process.stdout.write(
  JSON.stringify(
    {
      destination,
      seconds: report.duration,
      frames: metadata.streams[0].nb_frames,
      audioPeak: peak,
      fullDecode: 'passed',
    },
    null,
    2,
  ) + '\n',
)
