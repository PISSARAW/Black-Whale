import assert from 'node:assert/strict'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'

const folder = path.resolve('output/fighting-chrollo-fish-fatality')
await mkdir(folder, { recursive: true })
const run = async (command, args) => {
  const job = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  assert.equal((await once(job, 'exit'))[0], 0)
}
const voice = path.join(folder, 'chrollo-announcer.aiff')
if (!existsSync(voice)) await run('say', ['-v', 'Daniel', '-r', '118', '-o', voice, 'Fatality.'])
const layers = []
const delay = (s) => `adelay=${Math.round(s * 1000)}:all=1`
const add = (label, chain) => layers.push({ label, chain })
add('drone', 'aevalsrc=0.035*(sin(2*PI*39*t)+.35*sin(2*PI*58.5*t))*sin(PI*t/6.5)^2:s=48000:d=6.5')
add(
  'pages',
  `anoisesrc=c=brown:a=0.06:d=1:r=48000:seed=71,highpass=f=750,afade=t=out:d=1,${delay(0.3)}`,
)
for (let i = 0; i < 2; i++) {
  add(
    `swim${i}`,
    `anoisesrc=c=pink:a=0.07:d=1.1:r=48000:seed=${32 + i},lowpass=f=1300,afade=t=in:d=0.3,afade=t=out:st=0.5:d=0.6,${delay(1.1 + i * 0.2)}`,
  )
  add(
    `brand${i}`,
    `aevalsrc=0.055*sin(2*PI*${880 - i * 220}*t)*exp(-7*t):s=48000:d=0.7,${delay((132 + i * 28) / 60)}`,
  )
}
for (const [i, frame] of [204, 246, 288, 330].entries()) {
  add(
    `bite${i}`,
    `aevalsrc=0.11*(sin(2*PI*180*t)+.4*sin(2*PI*1390*t))*exp(-35*t):s=48000:d=0.25,${delay(frame / 60)}`,
  )
  add(
    `tear${i}`,
    `anoisesrc=c=brown:a=0.09:d=0.28:r=48000:seed=${44 + i},lowpass=f=1000,afade=t=out:d=0.28,${delay(frame / 60 + 0.02)}`,
  )
}
add(
  'converge',
  `anoisesrc=c=pink:a=0.08:d=0.8:r=48000:seed=18,lowpass=f=2200,afade=t=in:d=0.8,${delay(5.7)}`,
)
add(
  'book',
  `aevalsrc=0.18*(sin(2*PI*930*t)+.35*sin(2*PI*1830*t))*exp(-85*t):s=48000:d=0.14,${delay(6.5)}`,
)
add('blast', `aevalsrc=0.42*sin(2*PI*(63*t-9*t*t))*exp(-4.5*t):s=48000:d=1.6,${delay(6.5)}`)
add(
  'fire',
  `anoisesrc=c=pink:a=0.2:d=2:r=48000:seed=18,lowpass=f=1800,afade=t=out:st=0.2:d=1.8,${delay(6.5)}`,
)
add(
  'debris',
  `anoisesrc=c=white:a=0.04:d=1.5:r=48000:seed=38,highpass=f=2400,afade=t=out:st=0.05:d=1.45,${delay(6.65)}`,
)
add(
  'announcer',
  `[0:a]asetrate=22050*.76,aresample=48000,atempo=1.12,highpass=f=65,lowpass=f=4200,aecho=0.8:0.5:74:0.2,volume=0.95,${delay(8.05)}`,
)
const filter = [
  ...layers.map(({ label, chain }) => `${chain}[${label}]`),
  `${layers.map(({ label }) => `[${label}]`).join('')}amix=inputs=${layers.length}:normalize=0,aresample=48000,asetpts=N/SR/TB,apad=whole_len=480000,atrim=end_sample=480000,afade=t=out:st=9.45:d=0.55,loudnorm=I=-17:TP=-1.5:LRA=10,aresample=48000,alimiter=limit=0.94:level=0:latency=1,asetpts=N/SR/TB,atrim=end_sample=480000[audio]`,
].join(';')
const audio = path.join(folder, 'Chrollo-Indoor-Fish-Sun-and-Moon-audio.m4a')
await writeFile(path.join(folder, 'sound-design.ffscript'), filter)
await run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  voice,
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
await copyFile(audio, 'apps/web/static/clash-victories/chrollo.m4a')
const picture = path.join(folder, 'Chrollo-Indoor-Fish-Sun-and-Moon-picture.mp4')
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
    path.join(folder, 'Chrollo-Indoor-Fish-Fatality-10s.mp4'),
  ])
await writeFile(
  path.join(folder, 'composition.json'),
  JSON.stringify(
    {
      duration: 10,
      frameCount: 600,
      biteFrames: [204, 246, 288, 330],
      explosionSecond: 6.5,
      bookClosedSecond: 6.5,
      announcementSecond: 8.05,
    },
    null,
    2,
  ),
)
console.log(`Saved Chrollo soundtrack: ${audio}`)
