import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-illumi-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const voice = path.join(folder, 'illumi-announcer.aiff')
if (!existsSync(voice)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality.'])
const phrases = [
  ['stay', 'Reste.', 2.12, 170],
  ['kneel', 'À genoux.', 3.6, 185],
  ['rise', 'Debout.', 6.95, 170],
  ['useful-final', 'Encore utile.', 8.6, 220],
]
const speech = []
for (const [name, words, , rate] of phrases) {
  const file = path.join(folder, `illumi-${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', 'Thomas', '-r', String(rate), '-o', file, words])
  speech.push(file)
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('dread', 'aevalsrc=0.04*(sin(2*PI*43*t)+0.3*sin(2*PI*64*t))*sin(PI*t/5.8)^2:s=48000:d=5.8')
add(
  'room',
  'anoisesrc=c=brown:a=0.025:d=10:r=48000:seed=31,highpass=f=150,lowpass=f=850,afade=t=in:d=0.4,afade=t=out:st=9:d=1',
)
for (const [i, at] of [2.2, 4.7, 5].entries()) {
  add(
    `pin${i}`,
    `aevalsrc=0.14*(sin(2*PI*1700*t)+0.4*sin(2*PI*2390*t))*exp(-65*t):s=48000:d=0.15,${delay(at)}`,
  )
  add(
    `skin${i}`,
    `anoisesrc=c=pink:a=0.085:d=0.12:r=48000:seed=${61 + i},highpass=f=1300,afade=t=out:d=0.12,${delay(at)}`,
  )
}
for (const [i, at] of [2.9, 3.25, 3.6, 4, 5.35, 5.6, 7.1, 7.4, 7.8].entries())
  add(
    `joint${i}`,
    `aevalsrc=0.05*(sin(2*PI*(180*t-150*t*t))+0.25*sin(2*PI*420*t))*exp(-15*t):s=48000:d=0.28,${delay(at)}`,
  )
for (const [i, at] of [1.05, 1.3, 1.55, 1.8, 3.65, 3.9].entries())
  add(`foot${i}`, `aevalsrc=0.075*sin(2*PI*140*t)*exp(-45*t):s=48000:d=0.13,${delay(at)}`)
add('stop', `aevalsrc=0.12*sin(2*PI*58*t)*exp(-8*t):s=48000:d=0.6,${delay(5.8)}`)
add(
  'fall',
  `anoisesrc=c=brown:a=0.24:d=0.42:r=48000:seed=49,highpass=f=110,lowpass=f=1400,afade=t=out:d=0.42,${delay(6.22)}`,
)
add(
  'reanimate',
  `aevalsrc=0.04*(sin(2*PI*44*t)+0.4*sin(2*PI*72*t))*sin(PI*t/1.2)^2:s=48000:d=1.2,${delay(7)}`,
)
phrases.forEach(([name, , at], i) =>
  add(name, `[${i + 1}:a]aresample=48000,highpass=f=130,lowpass=f=5500,volume=1.35,${delay(at)}`),
)
add(
  'announcer',
  `[0:a]asetrate=22050*0.82,aresample=48000,atempo=1.3,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.75,${delay(8)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Illumi-Meme-Apres-La-Mort-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/illumi.m4a')
const picture = path.join(folder, 'Illumi-Meme-Apres-La-Mort-picture.mp4')
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
    path.join(folder, 'Illumi-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      implantSecond: 2.2,
      needleSeconds: [4.7, 5],
      deathSecond: 5.8,
      riseSecond: 7,
      bowSecond: 7.8,
      commands: phrases.map(([name, words, second]) => ({ name, words, second })),
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Illumi soundtrack: ${audio}\n`)
