import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-theta-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['theta-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.022*(sin(2*PI*49*t)+0.27*sin(2*PI*73*t))*sin(PI*t/10)^2:s=48000:d=10')
for (const [i, at] of [0.45, 1.4, 1.75].entries()) {
  add(
    `metal${i}`,
    `aevalsrc=0.12*(sin(2*PI*1433*t)+0.6*sin(2*PI*3247*t))*exp(-35*t):s=48000:d=0.22,${delay(at)}`,
  )
}
add(
  'rush',
  `anoisesrc=c=brown:a=0.12:d=0.5:r=48000:seed=39,highpass=f=350,afade=t=in:d=0.05,afade=t=out:st=0.15:d=0.35,${delay(2.2)}`,
)
add(
  'stock',
  `aevalsrc=0.35*(sin(2*PI*78*t)+0.3*sin(2*PI*160*t))*exp(-27*t):s=48000:d=0.3,${delay(4.2)}`,
)
add(
  'breath',
  `anoisesrc=c=pink:a=0.025:d=1.5:r=48000:seed=32,highpass=f=350,lowpass=f=1800,afade=t=in:d=0.45,afade=t=out:st=0.9:d=0.6,${delay(4.7)}`,
)
add(
  'shot',
  `anoisesrc=c=white:a=0.85:d=0.17:r=48000:seed=112,highpass=f=180,lowpass=f=10500,afade=t=out:d=0.13,aecho=0.8:0.6:83|171:0.25|0.12,${delay(6.2)}`,
)
add(
  'body',
  `aevalsrc=0.4*(sin(2*PI*62*t)+0.3*sin(2*PI*113*t))*exp(-23*t):s=48000:d=0.4,${delay(6.2)}`,
)
add(
  'case',
  `aevalsrc=0.09*(sin(2*PI*2140*t)+0.6*sin(2*PI*3521*t))*exp(-30*t):s=48000:d=0.35,${delay(7.55)}`,
)
add('fall', `aevalsrc=0.24*sin(2*PI*78*t)*exp(-18*t):s=48000:d=0.4,${delay(7.45)}`)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.15)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Theta-Une-Balle-d-Avance-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/theta.m4a')
const picture = path.join(folder, 'Theta-Une-Balle-d-Avance-picture.mp4')
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
    path.join(folder, 'Theta-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      magazineRemovedSecond: 0.9,
      magazineDroppedSecond: 1.4,
      stockSecond: 4.2,
      shotSecond: 6.2,
      fallSecond: 7.45,
      shots: 1,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Theta soundtrack: ${audio}\n`)
