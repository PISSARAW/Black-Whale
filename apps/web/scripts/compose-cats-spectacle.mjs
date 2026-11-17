import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const base = path.resolve('output/fighting-cats-name')
const grip = process.argv.includes('--grip')
const output = path.resolve(grip ? 'output/fighting-cats-grip' : 'output/fighting-cats-spectacle')
const basename = grip
  ? 'Chrollo-vs-Camilla-Prise-et-Resurrection'
  : 'Chrollo-vs-Camilla-Cat-s-Name-Spectaculaire'
const report = JSON.parse(await readFile(path.join(output, 'combat-report.json'), 'utf8'))
const original = JSON.parse(await readFile(path.join(base, 'combat-report.json'), 'utf8'))
const track = report.spectacle
assert.equal(track.unchangedOpeningFrames, 1817)
assert.equal(track.nativeCatFrames, 120)
assert.equal(track.slowMotion, 4)
assert.deepEqual(report.storyEvents, original.storyEvents)
assert.deepEqual(report.contactsBySide, original.contactsBySide)
assert.equal(report.confirmedCombos, original.confirmedCombos)
assert.deepEqual(
  track.shots.map((s) => s.kind),
  ['apparition', 'capture', 'crush', 'resurrection', 'victory'],
)
const start = track.startSecond
const catEnd = start + 2
const victory = track.shots.find((s) => s.kind === 'victory').second
const crush = track.shots.find((s) => s.kind === 'crush').second
const remaining = track.duration - victory
const destination = path.join(output, `${basename}.mp4`)
const filter = [
  `[0:v]trim=end_frame=${track.startFrame},setpts=PTS-STARTPTS[opening]`,
  '[1:v]setpts=PTS-STARTPTS[ending]',
  '[opening][ending]concat=n=2:v=1:a=0[video]',
  '[2:a]asplit=3[a][b][c]',
  `[a]atrim=end=${start},asetpts=PTS-STARTPTS[normal]`,
  `[b]atrim=start=${start}:end=${catEnd},asetpts=PTS-STARTPTS,atempo=0.5,atempo=0.5,apad,atrim=duration=8[slow]`,
  `[c]atrim=start=${catEnd},asetpts=PTS-STARTPTS,apad,atrim=duration=${remaining}[revived]`,
  '[normal][slow][revived]concat=n=3:v=0:a=1[native]',
  `aevalsrc=0.22*sin(2*PI*(74*t-18*t*t))*exp(-6*t):s=48000:d=1,adelay=${Math.round(crush * 1000)}:all=1[weight]`,
  `sine=frequency=660:sample_rate=48000:duration=0.8,afade=t=out:d=0.8,volume=0.35,adelay=${Math.round(victory * 1000)}:all=1[life]`,
  `[native][weight][life]amix=inputs=3:normalize=0,afade=t=in:d=0.3,afade=t=out:st=${track.duration - 1}:d=1,loudnorm=I=-16:TP=-1.5:LRA=11[audio]`,
].join(';')
const ffmpeg = spawn(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    path.join(base, 'Chrollo-vs-Camilla-Nen-Post-Mortem.mp4'),
    '-i',
    path.join(output, `${basename}-picture.mp4`),
    '-i',
    path.join(base, 'game-audio.wav'),
    '-filter_complex',
    filter,
    '-map',
    '[video]',
    '-map',
    '[audio]',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '17',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '60',
    '-frames:v',
    String(track.frameCount),
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-ar',
    '48000',
    '-t',
    String(track.duration),
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale — Chrollo × Camilla / Cat’s Name spectaculaire',
    destination,
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)
const [code] = await once(ffmpeg, 'exit')
assert.equal(code, 0)
await writeFile(
  path.join(output, 'composition.json'),
  JSON.stringify(
    {
      openingSource: 'Chrollo-vs-Camilla-Nen-Post-Mortem.mp4',
      openingFrames: track.startFrame,
      openingSeconds: start,
      totalFrames: track.frameCount,
      duration: track.duration,
      catSlowMotion: 4,
      nativeOutcomeUnchanged: true,
      shots: track.shots,
      audio:
        'Original game audio, retimed only for Cat’s Name, plus a low cinematic impact and resurrection chime.',
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved: ${destination}\n`)
