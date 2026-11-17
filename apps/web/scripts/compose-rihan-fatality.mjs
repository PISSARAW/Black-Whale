import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const physical = process.argv.includes('--physical')

const folder = path.resolve('output/fighting-rihan-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['rihan-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.022*(sin(2*PI*49*t)+0.27*sin(2*PI*73*t))*sin(PI*t/10)^2:s=48000:d=10')
if (!physical) {
  add(
    'birth',
    `anoisesrc=c=brown:a=0.18:d=1.1:r=48000:seed=31,highpass=f=180,lowpass=f=1300,afade=t=in:d=0.3,afade=t=out:st=0.7:d=0.4,${delay(1.3)}`,
  )
  add(
    'breath',
    `anoisesrc=c=pink:a=0.09:d=2.3:r=48000:seed=39,highpass=f=380,lowpass=f=2100,afade=t=in:d=0.4,afade=t=out:st=1.9:d=0.4,${delay(2.4)}`,
  )
  for (const [i, at] of [2.4, 2.52, 4.7].entries()) {
    add(
      `claw${i}`,
      `anoisesrc=c=brown:a=0.15:d=0.12:r=48000:seed=${40 + i},highpass=f=450,afade=t=out:d=0.12,${delay(at)}`,
    )
  }
  add(
    'bite',
    `aevalsrc=0.25*(sin(2*PI*72*t)+0.4*sin(2*PI*133*t))*exp(-24*t):s=48000:d=0.35,${delay(4.7)}`,
  )
  add('gulp', `aevalsrc=0.1*sin(2*PI*(140*t-65*t*t))*exp(-6*t):s=48000:d=0.9,${delay(5)}`)
  add(
    'seal',
    `aevalsrc=0.06*(sin(2*PI*659*t)+0.4*sin(2*PI*1046*t))*exp(-5*t):s=48000:d=0.65,${delay(5.7)}`,
  )
}
add(
  'shot',
  `anoisesrc=c=white:a=0.8:d=0.16:r=48000:seed=112,highpass=f=180,lowpass=f=10500,afade=t=out:d=0.12,aecho=0.8:0.6:83|171:0.25|0.12,${delay(6.4)}`,
)
add('impact', `aevalsrc=0.36*sin(2*PI*62*t)*exp(-23*t):s=48000:d=0.4,${delay(6.4)}`)
add('land', `aevalsrc=0.22*sin(2*PI*78*t)*exp(-20*t):s=48000:d=0.4,${delay(7.15)}`)
add(
  'case',
  `aevalsrc=0.07*(sin(2*PI*2140*t)+0.6*sin(2*PI*3521*t))*exp(-30*t):s=48000:d=0.35,${delay(7.25)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.15)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(
  path.join(folder, physical ? 'sound-design-physical.ffscript' : 'sound-design.ffscript'),
  filter,
)
const audio = path.join(
  folder,
  physical ? 'Rihan-Physical-audio.m4a' : 'Rihan-Angle-Mort-audio.m4a',
)
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
await copyFile(
  audio,
  `apps/web/static/clash-victories/${physical ? 'rihan-physical' : 'rihan'}.m4a`,
)
const picture = path.join(folder, 'Rihan-Angle-Mort-picture.mp4')
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
    path.join(folder, 'Rihan-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, physical ? 'composition-physical.json' : 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      birthSecond: physical ? null : 1.3,
      biteSecond: physical ? null : 4.7,
      predationSecond: physical ? null : 5.7,
      ownSealHours: physical ? 0 : 48,
      shotSecond: 6.4,
      predationDamage: 0,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Rihan soundtrack: ${audio}\n`)

if (!physical)
  await run(process.execPath, [fileURLToPath(import.meta.url), '--physical', '--audio-only'])
