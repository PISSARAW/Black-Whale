import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-kurapika-judgment')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['kurapika-judgment-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('tension', 'aevalsrc=0.025*(sin(2*PI*42*t)+0.25*sin(2*PI*63*t))*sin(PI*t/8)^2:s=48000:d=8')
for (const [i, at] of [0.3, 1.0, 1.4, 1.8, 2.2, 2.5].entries()) {
  add(
    `link${i}`,
    `aevalsrc=0.045*(sin(2*PI*${1250 + i * 95}*t)+0.45*sin(2*PI*${1870 + i * 120}*t))*exp(-25*t):s=48000:d=0.25,${delay(at)}`,
  )
}
add(
  'cast',
  `anoisesrc=c=white:a=0.055:d=1.4:r=48000:seed=65,highpass=f=2800,afade=t=in:d=0.4,afade=t=out:st=0.8:d=0.6,${delay(1.1)}`,
)
add('implant', `aevalsrc=0.12*sin(2*PI*85*t)*exp(-20*t):s=48000:d=0.3,${delay(2.5)}`)
for (const [i, at] of [2.9, 3.65, 4.35, 5.0, 5.5].entries()) {
  add(
    `heart${i}`,
    `aevalsrc=0.15*sin(2*PI*55*t)*exp(-25*t)+0.075*sin(2*PI*68*(t-.13))*exp(-30*(t-.13))*gte(t\\,.13):s=48000:d=0.4,${delay(at)}`,
  )
}
add(
  'nen',
  `anoisesrc=c=pink:a=0.075:d=0.9:r=48000:seed=81,highpass=f=750,afade=t=in:d=0.75,afade=t=out:st=0.75:d=0.15,${delay(4.9)}`,
)
add(
  'clamp',
  `anoisesrc=c=white:a=0.2:d=0.12:r=48000:seed=43,highpass=f=2200,afade=t=out:d=0.12,${delay(5.8)}`,
)
add('stop', `aevalsrc=0.28*sin(2*PI*46*t)*exp(-13*t):s=48000:d=0.6,${delay(5.8)}`)
add('fall', `aevalsrc=0.17*sin(2*PI*77*t)*exp(-18*t):s=48000:d=0.35,${delay(6.35)}`)
add(
  'cloth',
  `anoisesrc=c=brown:a=0.07:d=0.4:r=48000:seed=93,highpass=f=500,afade=t=out:d=0.4,${delay(6.35)}`,
)
add('clock', `aevalsrc=0.035*sin(2*PI*1800*t)*exp(-65*t):s=48000:d=0.1,${delay(7.4)}`)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.1)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Kurapika-La-Derniere-Condition-audio.m4a')
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  ...speeches.flatMap(([name]) => ['-i', path.join(folder, `${name}.aiff`)]),
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
await copyFile(audio, 'apps/web/static/clash-victories/kurapika-judgment.m4a')
const picture = path.join(folder, 'Kurapika-La-Derniere-Condition-picture.mp4')
if (existsSync(picture) && !process.argv.includes('--audio-only')) {
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
    path.join(folder, 'Kurapika-Judgment-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      implantSecond: 2.5,
      ruleSecond: 3,
      attemptSecond: 4.9,
      breachSecond: 5.8,
      portraitSecond: 7.4,
      announcementSecond: 8.1,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Kurapika Judgment soundtrack: ${audio}\n`)
