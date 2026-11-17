import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-hanzo-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['hanzo-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.018*(sin(2*PI*48*t)+0.3*sin(2*PI*72*t))*sin(PI*t/7.8)^2:s=48000:d=7.8')
add(
  'sleep',
  `anoisesrc=c=pink:a=0.035:d=0.8:r=48000:seed=35,highpass=f=700,lowpass=f=2400,afade=t=in:d=0.25,afade=t=out:st=0.4:d=0.4,${delay(0.35)}`,
)
for (const [i, at] of [1.2, 2.3, 7.08, 7.8].entries()) {
  add(
    `phase${i}`,
    `aevalsrc=0.045*(sin(2*PI*(${i % 2 ? 540 : 320}*t+160*t*t))+0.3*sin(2*PI*820*t))*exp(-5*t):s=48000:d=0.7,${delay(at)}`,
  )
  add(
    `air${i}`,
    `anoisesrc=c=pink:a=0.075:d=0.6:r=48000:seed=${57 + i},highpass=f=1500,afade=t=in:d=0.2,afade=t=out:st=0.2:d=0.4,${delay(at)}`,
  )
}
add(
  'grip',
  `anoisesrc=c=brown:a=0.13:d=0.22:r=48000:seed=67,highpass=f=500,afade=t=out:d=0.22,${delay(3.6)}`,
)
add('contact', `aevalsrc=0.12*sin(2*PI*92*t)*exp(-24*t):s=48000:d=0.25,${delay(3.6)}`)
for (const [i, at] of [3.85, 4.35, 4.9, 5.45].entries()) {
  add(
    `strain${i}`,
    `anoisesrc=c=pink:a=${0.065 - i * 0.008}:d=0.35:r=48000:seed=${80 + i},highpass=f=400,lowpass=f=1900,afade=t=in:d=0.1,afade=t=out:st=0.15:d=0.2,${delay(at)}`,
  )
}
add('still', `aevalsrc=0.1*sin(2*PI*45*t)*exp(-14*t):s=48000:d=0.4,${delay(6)}`)
add(
  'return',
  `anoisesrc=c=pink:a=0.06:d=1.3:r=48000:seed=71,highpass=f=1800,afade=t=in:d=0.35,afade=t=out:st=0.7:d=0.6,${delay(6.45)}`,
)
add('fall', `aevalsrc=0.15*sin(2*PI*76*t)*exp(-18*t):s=48000:d=0.35,${delay(6.93)}`)
add(
  'cloth',
  `anoisesrc=c=brown:a=0.07:d=0.35:r=48000:seed=92,highpass=f=400,afade=t=out:d=0.35,${delay(6.93)}`,
)
add(
  'wake',
  `anoisesrc=c=pink:a=0.045:d=0.35:r=48000:seed=26,highpass=f=850,lowpass=f=3000,afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.1,${delay(7.9)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.25)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Hanzo-Derriere-Toi-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/hanzo.m4a')
const picture = path.join(folder, 'Hanzo-Derriere-Toi-picture.mp4')
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
    path.join(folder, 'Hanzo-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      projectionSecond: 1.2,
      phaseSecond: 2.3,
      gripSecond: 3.6,
      deathSecond: 6,
      releaseSecond: 6.4,
      returnSecond: 7.8,
      announcementSecond: 8.25,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Hanzo soundtrack: ${audio}\n`)
