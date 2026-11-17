import assert from 'node:assert/strict'
import { readFile, writeFile, copyFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-feitan-fatality')
const report = JSON.parse(await readFile(path.join(folder, 'combat-report.json'), 'utf8'))
const start = report.victory.startSecond
const delay = (second) => `adelay=${Math.round(second * 1000)}:all=1`
await copyFile(
  'output/fighting-kurapika-fatality/fatality-announcer.wav',
  path.join(folder, 'fatality-announcer.wav'),
)
const armour = [1.5, 1.85, 2.2, 2.65].map(
  (second, i) =>
    `aevalsrc=0.06*(sin(2*PI*${1250 - i * 210}*t)+0.4*sin(2*PI*${2300 - i * 290}*t))*exp(-14*t):s=48000:d=0.6,${delay(start + second)}[lock${i}]`,
)
const filter = [
  `[1:a]volume='if(lt(t,${start}),1,0)':eval=frame[game]`,
  `aevalsrc=0.06*sin(2*PI*(36*t+2.1*t*t))*sin(PI*t/3.5)^2:s=48000:d=3.5,${delay(start)}[tension]`,
  ...armour,
  `anoisesrc=c=brown:a=0.1:d=4.0:r=48000:seed=22,lowpass=f=700,afade=t=in:d=1.2,afade=t=out:st=3.3:d=0.7,${delay(start + 3.2)}[sun]`,
  `aevalsrc=0.12*sin(2*PI*(52*t-3*t*t))*(0.7+0.3*sin(13*t))*exp(-0.65*t):s=48000:d=3.5,${delay(start + 3.5)}[power]`,
  `anoisesrc=c=pink:a=0.17:d=2.2:r=48000:seed=75,highpass=f=220,lowpass=f=5500,afade=t=in:d=0.1,afade=t=out:st=1.3:d=0.9,${delay(start + 4.5)}[heat]`,
  `anoisesrc=c=white:a=0.035:d=2.6:r=48000:seed=90,highpass=f=1300,tremolo=f=37:d=0.85,afade=t=out:st=1.8:d=0.8,${delay(start + 5)}[fire]`,
  `aevalsrc=0.2*sin(2*PI*47*t)*exp(-5*t):s=48000:d=1.1,${delay(start + 6)}[impact]`,
  `[2:a]volume=0.95,${delay(start + 7)}[announcer]`,
  `[game][tension][lock0][lock1][lock2][lock3][sun][power][heat][fire][impact][announcer]amix=inputs=12:normalize=0,afade=t=out:st=${report.duration - 0.5}:d=0.5,loudnorm=I=-17:TP=-1.5:LRA=10,alimiter=limit=0.94:level=0:latency=1[audio]`,
].join(';')
async function encode(args) {
  const job = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const destination = path.join(folder, 'Feitan-Rising-Sun-Fatality.mp4')
await encode([
  '-i',
  path.join(folder, 'Feitan-Rising-Sun-Fatality-picture.mp4'),
  '-i',
  path.join(folder, 'game-audio.wav'),
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
  String(report.duration),
  '-movflags',
  '+faststart',
  '-metadata',
  'title=Black Whale Clash — Feitan / Le soleil du supplice',
  destination,
])
await encode([
  '-ss',
  String(start),
  '-i',
  destination,
  '-t',
  '10',
  '-frames:v',
  '600',
  '-c:v',
  'libx264',
  '-preset',
  'fast',
  '-crf',
  '17',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-movflags',
  '+faststart',
  path.join(folder, 'Feitan-Fatality-10s.mp4'),
])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: report.duration,
      victorySeconds: 10,
      victoryFrames: 600,
      nativeOutcome: 'Hisoka defeated by solar heat; Feitan protected by Pain Packer',
      soundCues: {
        armour: [1.5, 1.85, 2.2, 2.65],
        sun: 3.5,
        heat: 4.5,
        combustion: 5,
        death: 6,
        announcer: 7,
      },
      announcement:
        'Local Daniel system voice, lowered pitch and short echo; original synthesized sound design.',
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved: ${destination}\n`)
