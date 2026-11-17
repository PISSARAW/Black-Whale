import assert from 'node:assert/strict'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-phinks-fatality')
const report = JSON.parse(await readFile(path.join(folder, 'cinematic-report.json'), 'utf8'))
assert.equal(report.frameCount, 600)
assert.equal(report.nativeTurns, 6)
assert.equal(report.finalPunch.move, 'phinks:finisher')
await copyFile(
  'output/fighting-kurapika-fatality/fatality-announcer.wav',
  path.join(folder, 'fatality-announcer.wav'),
)
const delay = (seconds) => `adelay=${Math.round(seconds * 1000)}:all=1`
const turnTimes = Array.from({ length: 6 }, (_, i) => (68 + i * 32) / 60)
const rotations = turnTimes.map(
  (time, i) =>
    `aevalsrc=${0.024 + i * 0.005}*(sin(2*PI*${110 + i * 32}*t)+0.3*sin(2*PI*${850 + i * 140}*t))*sin(PI*t/0.26)^2:s=48000:d=0.26,${delay(time - 0.16)}[turn${i}]`,
)
const filter = [
  'aevalsrc=0.055*sin(2*PI*(32*t+1.4*t*t))*sin(PI*t/4.35)^2:s=48000:d=4.35[pressure]',
  ...rotations,
  `anoisesrc=c=pink:a=0.025:d=3.2:r=48000:seed=44,lowpass=f=1400,tremolo=f=1.875:d=0.95,afade=t=in:d=2.4,afade=t=out:st=3:d=0.2,${delay(0.6)}[wind]`,
  `aevalsrc=0.025*(sin(2*PI*(390*t+31*t*t))+0.35*sin(2*PI*(740*t+43*t*t)))*sin(PI*t/2.4)^2:s=48000:d=2.4,${delay(1.8)}[compression]`,
  `anoisesrc=c=pink:a=0.08:d=0.22:r=48000:seed=75,lowpass=f=3800,afade=t=in:d=0.04,afade=t=out:st=0.09:d=0.13,${delay(4.08)}[punch-air]`,
  `aevalsrc=0.62*sin(2*PI*(61*t-10*t*t))*exp(-6*t):s=48000:d=1.3,${delay(4.5)}[impact]`,
  `anoisesrc=c=white:a=0.24:d=0.14:r=48000:seed=82,highpass=f=350,lowpass=f=6500,afade=t=out:d=0.14,${delay(4.5)}[crack]`,
  `anoisesrc=c=brown:a=0.12:d=1.9:r=48000:seed=54,lowpass=f=1000,afade=t=out:st=0.3:d=1.6,${delay(4.53)}[blast]`,
  `aevalsrc=0.015*sin(2*PI*3400*t)*exp(-1.9*t):s=48000:d=1.7,${delay(4.63)}[ears]`,
  `anoisesrc=c=pink:a=0.055:d=1.8:r=48000:seed=42,highpass=f=650,lowpass=f=3300,tremolo=f=29:d=0.85,afade=t=out:d=1.8,${delay(4.8)}[fragments]`,
  `aevalsrc=0.03*(sin(2*PI*39*t)+0.3*sin(2*PI*77*t))*sin(PI*t/3)^2:s=48000:d=3,${delay(7)}[victory]`,
  `[1:a]volume=0.95,${delay(7)}[announcer]`,
  '[pressure][turn0][turn1][turn2][turn3][turn4][turn5][wind][compression][punch-air][impact][crack][blast][ears][fragments][victory][announcer]amix=inputs=17:normalize=0,afade=t=out:st=9.5:d=0.5,loudnorm=I=-17:TP=-1.5:LRA=11,alimiter=limit=0.94:level=0:latency=1[audio]',
].join(';')
const destination = path.join(folder, 'Phinks-Fatality-10s.mp4')
const job = spawn(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    path.join(folder, 'Phinks-Ripper-Cyclotron-picture.mp4'),
    '-i',
    path.join(folder, 'fatality-announcer.wav'),
    '-filter_complex',
    filter,
    '-map',
    '0:v',
    '-map',
    '[audio]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-t',
    '10',
    '-movflags',
    '+faststart',
    '-metadata',
    'title=Black Whale Clash — Phinks / Ripper Cyclotron',
    destination,
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)
assert.equal((await once(job, 'exit'))[0], 0)
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      turns: 6,
      completedTurnsSeconds: turnTimes,
      impactSecond: 4.5,
      pulverizationSecond: 4.7,
      announcementSecond: 7,
      soundDesign:
        'Six rising rotational pulses, compressed aura, brief pre-impact silence, one impact, pressure wave and fragments.',
      announcement: 'Local Daniel system voice, lowered pitch and short echo.',
      nativePunch: report.finalPunch,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved: ${destination}\n`)
