import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-luini-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['luini-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('hush', 'aevalsrc=0.025*(sin(2*PI*43*t)+0.22*sin(2*PI*67*t))*sin(PI*t/10):s=48000:d=10')
add(
  'latch',
  `aevalsrc=0.2*(sin(2*PI*950*t)+0.4*sin(2*PI*1720*t))*exp(-30*t):s=48000:d=0.2,${delay(0.9)}`,
)
for (const [i, at] of [1.2, 1.8, 3.7, 4.0].entries()) {
  add(
    `gate${i}`,
    `anoisesrc=c=pink:a=0.2:d=0.7:r=48000:seed=${38 + i},highpass=f=200,lowpass=f=4500,afade=t=in:d=0.08,afade=t=out:st=0.22:d=0.48,${delay(at)}`,
  )
  add(
    `fold${i}`,
    `aevalsrc=0.13*sin(2*PI*(90*t+230*t*t))*sin(PI*t/0.55):s=48000:d=0.55,${delay(at)}`,
  )
}
for (const [i, at] of [4.7, 5.0, 5.3].entries())
  add(
    `step${i}`,
    `anoisesrc=c=brown:a=0.17:d=0.12:r=48000:seed=${71 + i},lowpass=f=1700,afade=t=out:d=0.12,${delay(at)}`,
  )
add('handle', `aevalsrc=0.15*sin(2*PI*1430*t)*exp(-28*t):s=48000:d=0.22,${delay(5.5)}`)
add(
  'creak',
  `aevalsrc=0.07*(sin(2*PI*(240*t+180*t*t))+0.3*sin(2*PI*960*t))*sin(PI*t/0.55):s=48000:d=0.55,${delay(5.7)}`,
)
add(
  'strike',
  `anoisesrc=c=brown:a=0.8:d=0.25:r=48000:seed=97,highpass=f=70,afade=t=out:d=0.25,${delay(6.6)}`,
)
add(
  'blade',
  `anoisesrc=c=white:a=0.22:d=0.14:r=48000:seed=15,highpass=f=1800,afade=t=out:d=0.14,${delay(6.6)}`,
)
add('body', `aevalsrc=0.5*sin(2*PI*47*t)*exp(-12*t):s=48000:d=0.65,${delay(6.6)}`)
add(
  'landing',
  `anoisesrc=c=brown:a=0.48:d=0.45:r=48000:seed=67,lowpass=f=2200,afade=t=out:d=0.45,${delay(7.6)}`,
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
const audio = path.join(folder, 'Luini-La-Mauvaise-Porte-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/luini.m4a')
const picture = path.join(folder, 'Luini-La-Mauvaise-Porte-picture.mp4')
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
    path.join(folder, 'Luini-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      departureSecond: 1.8,
      returnSecond: 3.9,
      doorOpeningSecond: 5.7,
      physicalStrikeSecond: 6.6,
      victimTransported: false,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Luini soundtrack: ${audio}\n`)
