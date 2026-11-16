import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const original = path.resolve(
  'output/fighting-cats-grip/Chrollo-vs-Camilla-Prise-et-Resurrection.mp4',
)
const output = path.resolve('output/fighting-cats-still')
const report = JSON.parse(await readFile(path.join(output, 'combat-report.json'), 'utf8'))
const earlier = JSON.parse(await readFile('output/fighting-cats-grip/combat-report.json', 'utf8'))
assert.deepEqual(report.contactsBySide, earlier.contactsBySide)
assert.deepEqual(report.storyEvents, earlier.storyEvents)
const startFrame = 2265,
  portraitFrames = 90,
  totalFrames = startFrame + portraitFrames
const duration = totalFrames / 60
const filter = [
  `[0:v]trim=end_frame=${startFrame},setpts=PTS-STARTPTS[opening]`,
  '[1:v]setpts=PTS-STARTPTS[portrait]',
  '[opening][portrait]concat=n=2:v=1:a=0[video]',
  '[0:a]afade=t=out:st=37.66:d=0.09[before]',
  'anoisesrc=color=pink:amplitude=0.65:sample_rate=48000:duration=0.65:seed=741,highpass=f=330,lowpass=f=3200,afade=t=in:d=0.055,afade=t=out:st=0.38:d=0.27,volume=1.7,adelay=38550:all=1[inhale]',
  '[before][inhale]amix=inputs=2:normalize=0,alimiter=limit=0.94:level=0:latency=1[audio]',
].join(';')
const destination = path.join(output, 'Chrollo-vs-Camilla-Le-Souffle.mp4')
const encoder = spawn(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    original,
    '-i',
    path.join(output, 'Chrollo-vs-Camilla-Le-Souffle-picture.mp4'),
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
    String(totalFrames),
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-ar',
    '48000',
    '-t',
    String(duration),
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale — Camilla / Le souffle',
    destination,
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)
const [code] = await once(encoder, 'exit')
assert.equal(code, 0)
await writeFile(
  path.join(output, 'composition.json'),
  JSON.stringify(
    {
      original,
      preservedOpeningFrames: startFrame,
      preservedOpeningSeconds: startFrame / 60,
      totalFrames,
      duration,
      portraitFrames,
      fixedPose: true,
      fixedCamera: true,
      eyeOpeningSecond: 2309 / 60,
      inhaleStartSecond: 38.55,
      inhaleDuration: 0.65,
      ending:
        'Closed eyes; sudden opening; one audible inhalation; immediate end. No standing or celebration.',
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved: ${destination}\n`)
