import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-basho-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['basho-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.025*(sin(2*PI*43*t)+0.2*sin(2*PI*71*t))*sin(PI*t/10):s=48000:d=10')
for (const [i, at] of [0.3, 0.52, 0.76, 0.98, 1.2, 1.42, 1.64, 1.86, 2.08, 2.3].entries()) {
  add(
    `ink${i}`,
    `anoisesrc=c=white:a=0.045:d=0.13:r=48000:seed=${12 + i},highpass=f=2200,lowpass=f=5200,afade=t=out:d=0.13,${delay(at)}`,
  )
}
add(
  'paper',
  `anoisesrc=c=pink:a=0.1:d=0.28:r=48000:seed=52,highpass=f=1000,afade=t=out:d=0.28,${delay(2.6)}`,
)
for (const [i, at] of [3.6, 5.0, 6.4].entries()) {
  add(
    `hit${i}`,
    `anoisesrc=c=brown:a=0.5:d=0.22:r=48000:seed=${112 + i},highpass=f=80,lowpass=f=4000,afade=t=out:d=0.22,${delay(at)}`,
  )
  add(`body${i}`, `aevalsrc=0.3*sin(2*PI*62*t)*exp(-18*t):s=48000:d=0.35,${delay(at)}`)
  add(
    `spark${i}`,
    `anoisesrc=c=white:a=0.11:d=0.4:r=48000:seed=${61 + i},highpass=f=2300,afade=t=out:d=0.4,${delay(at)}`,
  )
}
add(
  'fire',
  `anoisesrc=c=pink:a=0.16:d=4.5:r=48000:seed=75,highpass=f=350,lowpass=f=5400,afade=t=in:d=1.5,afade=t=out:st=3.8:d=0.7,${delay(3.6)}`,
)
add(
  'roar',
  `anoisesrc=c=brown:a=0.28:d=1.65:r=48000:seed=95,lowpass=f=2200,afade=t=in:d=0.12,afade=t=out:st=0.9:d=0.75,${delay(6.4)}`,
)
add(
  'fall',
  `anoisesrc=c=brown:a=0.25:d=0.3:r=48000:seed=67,lowpass=f=1600,afade=t=out:d=0.3,${delay(7.5)}`,
)
add(
  'pageEnd',
  `anoisesrc=c=pink:a=0.06:d=0.22:r=48000:seed=33,highpass=f=1300,afade=t=out:d=0.22,${delay(8.1)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.15)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Basho-Le-Dernier-Vers-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/basho.m4a')
const picture = path.join(folder, 'Basho-Le-Dernier-Vers-picture.mp4')
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
    path.join(folder, 'Basho-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      contacts: [3.6, 5, 6.4],
      writtenSecond: 2.4,
      collapseSecond: 7,
      recognizedPoem: true,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Basho soundtrack: ${audio}\n`)
