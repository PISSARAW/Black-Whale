import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-bonolenov-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const voice = path.join(folder, 'bonolenov-announcer.aiff')
if (!existsSync(voice)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality.'])
const phrases = [['jupiter', 'Jupiter.', 3.55, 160]]
const speech = []
for (const [name, words, , rate] of phrases) {
  const file = path.join(folder, `bonolenov-${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', 'Thomas', '-r', String(rate), '-o', file, words])
  speech.push(file)
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add(
  'breath',
  'anoisesrc=c=pink:a=0.045:d=3.5:r=48000:seed=11,highpass=f=800,lowpass=f=2200,afade=t=in:d=0.4,afade=t=out:st=3:d=0.5',
)
const notes = [
  440, 523.25, 659.25, 587.33, 440, 783.99, 659.25, 523.25, 880, 783.99, 659.25, 1046.5,
]
notes.forEach((frequency, i) => {
  const at = i < 4 ? 0.2 + i * 0.5 : 2.25 + (i - 4) * 0.32
  add(
    `note${i}`,
    `aevalsrc=0.07*(sin(2*PI*${frequency}*t)+0.18*sin(2*PI*${frequency * 2}*t))*sin(PI*t/0.48)^2:s=48000:d=0.48,aecho=0.8:0.5:90:0.22,${delay(at)}`,
  )
})
for (const [i, at] of [2.2, 2.8].entries())
  add(
    `tap${i}`,
    `aevalsrc=0.24*(sin(2*PI*190*t)+0.3*sin(2*PI*1200*t))*exp(-35*t):s=48000:d=0.24,${delay(at)}`,
  )
add(
  'planet',
  `aevalsrc=0.11*(sin(2*PI*43*t)+0.25*sin(2*PI*66*t))*sin(PI*t/3.1)^2:s=48000:d=3.1,${delay(3.5)}`,
)
add(
  'pursuit',
  `anoisesrc=c=brown:a=0.26:d=1.8:r=48000:seed=26,highpass=f=80,lowpass=f=1200,afade=t=in:d=1.6,afade=t=out:st=1.65:d=0.15,${delay(4.8)}`,
)
for (const [i, at] of [4.95, 5.2, 5.45, 5.7, 5.92, 6.12, 6.3].entries())
  add(`foot${i}`, `aevalsrc=0.13*sin(2*PI*130*t)*exp(-45*t):s=48000:d=0.17,${delay(at)}`)
add(
  'crush',
  `aevalsrc=0.62*(sin(2*PI*(68*t-19*t*t))+0.2*sin(2*PI*127*t))*exp(-5*t):s=48000:d=1.1,${delay(6.6)}`,
)
add(
  'debris',
  `anoisesrc=c=brown:a=0.35:d=0.8:r=48000:seed=71,highpass=f=350,lowpass=f=3500,afade=t=out:d=0.8,${delay(6.6)}`,
)
add('ending', `aevalsrc=0.045*sin(2*PI*440*t)*sin(PI*t/1.5)^2:s=48000:d=1.5,${delay(8.4)}`)
phrases.forEach(([name, , at], i) =>
  add(name, `[${i + 1}:a]aresample=48000,highpass=f=130,lowpass=f=5500,volume=1.35,${delay(at)}`),
)
add(
  'announcer',
  `[0:a]asetrate=22050*0.82,aresample=48000,atempo=1.3,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.75,${delay(8.1)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Bonolenov-Le-Dernier-Mouvement-audio.m4a')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  voice,
  ...speech.flatMap((file) => ['-i', file]),
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
  '-t',
  '10',
  audio,
])
const probe = JSON.parse(
  execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', audio],
    { encoding: 'utf8' },
  ),
)
assert.equal(Number(probe.format.duration), 10)
await copyFile(audio, 'apps/web/static/clash-victories/bonolenov.m4a')
const picture = path.join(folder, 'Bonolenov-Le-Dernier-Mouvement-picture.mp4')
if (existsSync(picture) && !process.argv.includes('--audio-only'))
  await run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    picture,
    '-i',
    audio,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c',
    'copy',
    '-t',
    '10',
    '-movflags',
    '+faststart',
    path.join(folder, 'Bonolenov-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      tapSeconds: [2.2, 2.8],
      formationSecond: 3.5,
      chaseSecond: 4.8,
      impactSecond: 6.6,
      commands: phrases.map(([name, words, second]) => ({ name, words, second })),
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Bonolenov soundtrack: ${audio}\n`)
