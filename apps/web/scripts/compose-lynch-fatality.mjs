import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn, execFileSync } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-lynch-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const speeches = [['lynch-announcer', 'Daniel', 'Fatality.', '118']]
for (const [name, voice, line, rate] of speeches) {
  const file = path.join(folder, `${name}.aiff`)
  if (!existsSync(file)) await run('say', ['-v', voice, '-r', rate, '-o', file, line])
}
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add(
  'hush',
  'aevalsrc=0.025*(sin(2*PI*49*t)+0.27*sin(2*PI*73*t)):s=48000:d=6.1,afade=t=out:st=5.85:d=0.25',
)
for (const [i, at] of [2.2, 4.1, 5.3, 5.5, 5.7, 5.9].entries()) {
  add(
    `hit${i}`,
    `anoisesrc=c=brown:a=0.5:d=0.14:r=48000:seed=${112 + i},highpass=f=100,lowpass=f=3500,afade=t=out:d=0.14,${delay(at)}`,
  )
  add(`body${i}`, `aevalsrc=0.24*sin(2*PI*78*t)*exp(-25*t):s=48000:d=0.16,${delay(at)}`)
  add(
    `reply${i}`,
    `aevalsrc=0.065*(sin(2*PI*120*t)+0.3*sin(2*PI*240*t)+0.2*sin(2*PI*720*t))*sin(PI*t/0.12):s=48000:d=0.12,${delay(at + 0.06)}`,
  )
}
add(
  'final',
  `anoisesrc=c=brown:a=0.9:d=0.7:r=48000:seed=95,highpass=f=50,lowpass=f=7000,afade=t=out:d=0.7,aecho=0.8:0.6:83|171:0.25|0.12,${delay(6.6)}`,
)
add(
  'break',
  `aevalsrc=0.55*(sin(2*PI*43*t)+0.25*sin(2*PI*119*t))*exp(-10*t):s=48000:d=0.8,${delay(6.6)}`,
)
add(
  'air',
  `anoisesrc=c=pink:a=0.12:d=0.5:r=48000:seed=41,highpass=f=450,afade=t=out:d=0.5,${delay(6.65)}`,
)
add(
  'landing',
  `anoisesrc=c=brown:a=0.45:d=0.45:r=48000:seed=67,lowpass=f=2200,afade=t=out:d=0.45,${delay(7.5)}`,
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
const audio = path.join(folder, 'Lynch-Le-Dernier-Aveu-audio.m4a')
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
await copyFile(audio, 'apps/web/static/clash-victories/lynch.m4a')
const picture = path.join(folder, 'Lynch-Le-Dernier-Aveu-picture.mp4')
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
    path.join(folder, 'Lynch-Fatality-10s.mp4'),
  ])
}
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      contacts: [2.2, 4.1, 5.3, 5.5, 5.7, 5.9, 6.6],
      silentWindup: [6.2, 6.6],
      afterKoReply: false,
      announcementSecond: 8.15,
      frenchDialogue: false,
    },
    null,
    2,
  ),
)
process.stdout.write(`Saved Lynch soundtrack: ${audio}\n`)
