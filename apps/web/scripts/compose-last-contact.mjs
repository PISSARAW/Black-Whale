import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const folder = fileURLToPath(new URL('../../../output/fighting-last-contact/', import.meta.url))
const file = (name) => path.join(folder, name)
const report = JSON.parse(readFileSync(file('combat-report.json'), 'utf8'))
assert.equal(report.winner, 'opponent')
assert.equal(report.finalHealth.player, 0)
assert.deepEqual(report.continuity, { resets: 0, backwards: false, healed: false })
assert.ok(report.proof.finalParry)
assert.ok(report.comboCancels.every((e) => e.legal && e.confirmedHit))
const run = (args) =>
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { maxBuffer: 128 * 1024 * 1024 })
const probe = (name) =>
  JSON.parse(
    execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', name], {
      encoding: 'utf8',
    }),
  )
const picture = file('Hisoka-vs-Chrollo-Le-Dernier-Contact-picture.mp4')
const destination = file('Hisoka-vs-Chrollo-Le-Dernier-Contact.mp4')
const soundFile = file(
  existsSync(file('game-audio.wav')) ? 'game-audio.wav' : 'game-audio-chunked.wav',
)
assert.equal(Number(probe(picture).streams[0].nb_frames), report.frameCount)
run([
  '-i',
  picture,
  '-i',
  soundFile,
  '-map',
  '0:v:0',
  '-map',
  '1:a:0',
  '-c:v',
  'copy',
  '-af',
  `atrim=duration=${report.duration},afade=t=in:d=0.1,afade=t=out:st=${report.duration - 0.7}:d=0.7,loudnorm=I=-17:TP=-1.5:LRA=11,alimiter=limit=0.94:level=0:latency=1`,
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ar',
  '48000',
  '-ac',
  '2',
  '-t',
  String(report.duration),
  '-movflags',
  '+faststart',
  '-metadata',
  'title=Black Whale — Hisoka × Chrollo / Le dernier contact',
  destination,
])
run(['-xerror', '-i', destination, '-f', 'null', '-'])
const metadata = probe(destination)
const video = metadata.streams.find((s) => s.codec_type === 'video')
const audio = metadata.streams.find((s) => s.codec_type === 'audio')
assert.equal(video.width, 1920)
assert.equal(video.height, 1080)
assert.equal(video.r_frame_rate, '60/1')
assert.equal(Number(video.nb_frames), report.frameCount)
assert.equal(audio.codec_name, 'aac')
assert.equal(audio.channels, 2)
assert.ok(Math.abs(Number(metadata.format.duration) - report.duration) < 0.025)
const pcm = run(['-i', destination, '-vn', '-f', 'f32le', '-'])
let peak = 0,
  squares = 0,
  clipped = 0
for (let i = 0; i < pcm.length; i += 4) {
  const n = pcm.readFloatLE(i)
  peak = Math.max(peak, Math.abs(n))
  squares += n * n
  if (Math.abs(n) >= 1) clipped++
}
assert.equal(clipped, 0)
const verification = {
  artifact: destination,
  sha256: createHash('sha256').update(readFileSync(destination)).digest('hex'),
  fullDecode: 'passed',
  metadata,
  audio: {
    source: soundFile,
    peak,
    rms: Math.sqrt(squares / (pcm.length / 4)),
    clippedSamples: clipped,
  },
  nativeFight: {
    seconds: report.duration,
    combos: report.confirmedCombos,
    cancels: report.comboCancels.length,
    health: report.finalHealth,
    continuity: report.continuity,
    proof: report.proof,
  },
  cinematography: report.cinematography,
  expressions: report.expressions,
}
writeFileSync(file('video-verification.json'), JSON.stringify(verification, null, 2) + '\n')
process.stdout.write(
  JSON.stringify(
    {
      destination,
      seconds: report.duration,
      frames: report.frameCount,
      combos: report.confirmedCombos,
      realCancels: report.comboCancels.length,
      audioPeak: peak,
      fullDecode: 'passed',
    },
    null,
    2,
  ) + '\n',
)
