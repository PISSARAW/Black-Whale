import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-biscuit-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['biscuit-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('spa', 'aevalsrc=0.025*(sin(2*PI*220*t)+0.35*sin(2*PI*330*t))*exp(-0.45*t):s=48000:d=3.4')
for (const [i, at] of [0.08, 0.36, 0.72, 1.1, 7.08, 7.34, 7.65].entries()) {
  add(
    `chime${i}`,
    `aevalsrc=0.07*(sin(2*PI*${880 + i * 66}*t)+0.3*sin(2*PI*${1760 + i * 66}*t))*exp(-8*t):s=48000:d=0.55,${delay(at)}`,
  )
}
for (const [i, at] of [0.3, 0.58, 0.9, 1.2, 7.12, 7.45].entries()) {
  add(
    `rub${i}`,
    `anoisesrc=c=pink:a=0.035:d=0.22:r=48000:seed=${40 + i},highpass=f=1800,afade=t=in:d=0.05,afade=t=out:st=0.1:d=0.12,${delay(at)}`,
  )
}
for (const [i, at] of [1.72, 2.08, 2.5].entries())
  add(`step${i}`, `aevalsrc=0.06*sin(2*PI*120*t)*exp(-38*t):s=48000:d=0.2,${delay(at)}`)
add(
  'grow',
  `aevalsrc=0.075*(sin(2*PI*(38*t+18*t*t))+0.3*sin(2*PI*76*t))*sin(PI*t/1.35)^2:s=48000:d=1.35,${delay(3.5)}`,
)
add(
  'cloth',
  `anoisesrc=c=brown:a=0.16:d=0.65:r=48000:seed=95,highpass=f=300,afade=t=in:d=0.15,afade=t=out:st=0.4:d=0.25,${delay(3.6)}`,
)
add(
  'swish',
  `anoisesrc=c=white:a=0.17:d=0.18:r=48000:seed=14,lowpass=f=3400,afade=t=in:d=0.13,afade=t=out:st=0.13:d=0.05,${delay(5.32)}`,
)
add(
  'punch',
  `aevalsrc=0.48*(sin(2*PI*48*t)+0.3*sin(2*PI*96*t))*exp(-13*t):s=48000:d=0.65,${delay(5.5)}`,
)
add(
  'crack',
  `anoisesrc=c=white:a=0.38:d=0.12:r=48000:seed=89,highpass=f=650,afade=t=out:d=0.12,${delay(5.5)}`,
)
add(
  'flight',
  `anoisesrc=c=pink:a=0.11:d=0.65:r=48000:seed=23,highpass=f=600,afade=t=out:d=0.65,${delay(5.6)}`,
)
add('land', `aevalsrc=0.28*sin(2*PI*62*t)*exp(-11*t):s=48000:d=0.65,${delay(5.95)}`)
add(
  'rubble',
  `anoisesrc=c=brown:a=0.2:d=0.6:r=48000:seed=71,highpass=f=300,afade=t=out:d=0.6,${delay(5.95)}`,
)
add('return', `aevalsrc=0.05*sin(2*PI*(660*t+300*t*t))*exp(-5*t):s=48000:d=0.6,${delay(7)}`)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.1)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
const audio = path.join(folder, 'Biscuit-Le-Soin-De-Grace-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/biscuit.m4a')
const picture = path.join(folder, 'Biscuit-Le-Soin-De-Grace-picture.mp4')
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
    path.join(folder, 'Biscuit-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      revealSecond: 3.5,
      impactSecond: 5.5,
      landingSecond: 5.95,
      returnSecond: 7,
      announcementSecond: 8.1,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Biscuit soundtrack: ${audio}\n`)
